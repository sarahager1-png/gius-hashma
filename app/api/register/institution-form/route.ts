import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, full_name, principal_phone, institution_name, city, district, school_type, lead_id } = body

  if (!email?.trim() || !email.includes('@'))
    return NextResponse.json({ error: 'כתובת מייל תקינה חובה' }, { status: 400 })
  if (!full_name?.trim())
    return NextResponse.json({ error: 'שם מנהלת חובה' }, { status: 400 })
  if (!institution_name?.trim())
    return NextResponse.json({ error: 'שם המוסד חובה' }, { status: 400 })
  if (!district)
    return NextResponse.json({ error: 'מחוז חובה' }, { status: 400 })

  const service = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'
  const cleanEmail = email.trim().toLowerCase()

  // Create auth user + send invite email (magic link)
  const { data: invited, error: inviteErr } = await service.auth.admin.inviteUserByEmail(cleanEmail, {
    redirectTo: `${appUrl}/auth/callback?next=/institution/jobs`,
  })
  if (inviteErr) {
    const msg = inviteErr.message.includes('already been registered')
      ? 'כתובת המייל כבר רשומה במערכת'
      : inviteErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = invited.user.id

  // Create profile
  await service.from('profiles').upsert(
    { id: userId, full_name: full_name.trim(), phone: principal_phone?.trim() || null, role: 'מוסד' },
    { onConflict: 'id' }
  )

  // institution_type derived from school_type
  const institutionType = school_type === 'גן ילדים' ? 'גן ילדים' : 'בית ספר יסודי'
  const finalSchoolType = school_type === 'גן ילדים' ? null : (school_type || null)

  await service.from('institutions').insert({
    profile_id: userId,
    institution_name: institution_name.trim(),
    city: city?.trim() || null,
    district,
    school_type: finalSchoolType,
    institution_type: institutionType,
    phone: principal_phone?.trim() || null,
    principal_name: full_name.trim(),
    whatsapp_preference: true,
    is_approved: true,
  })

  // Mark lead as registered
  if (lead_id) {
    await service
      .from('institution_leads')
      .update({ registered_profile_id: userId })
      .eq('id', lead_id)
  }

  // Also send magic link via WhatsApp if phone available
  const phone = principal_phone?.trim() || null
  if (phone) {
    const { data: linkData } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: { redirectTo: `${appUrl}/auth/callback?next=/institution/jobs` },
    })
    const link = linkData?.properties?.action_link
    if (link) {
      void sendExternal({
        phone,
        whatsapp_preference: true,
        waMessage:  `שלום ${full_name.trim()}!\nהרשמת בהצלחה למערכת השביל.\nלכניסה למערכת לחצי כאן:\n${link}`,
        smsMessage: `שלום! הרשמת למערכת השביל. לכניסה: ${link}`,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
