import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'
import { Resend } from 'resend'

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
  const phone = principal_phone?.trim() || null
  const name = full_name.trim()

  // Create auth user without sending Supabase's built-in invite email
  // (Supabase's invite email often goes to spam — we send the login link ourselves)
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: cleanEmail,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (createErr) {
    const msg = createErr.message.includes('already been registered') || createErr.message.includes('already exists')
      ? 'כתובת המייל כבר רשומה במערכת'
      : createErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = created.user.id

  // Create profile
  await service.from('profiles').upsert(
    { id: userId, full_name: name, phone: phone || null, role: 'מוסד' },
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
    phone: phone || null,
    principal_name: name,
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

  // Generate a magic link and send it ourselves (WhatsApp primary, email fallback)
  const { data: linkData } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: cleanEmail,
    options: { redirectTo: `${appUrl}/auth/callback?next=/institution/jobs` },
  })
  const loginLink = linkData?.properties?.action_link

  if (loginLink) {
    const waMsg = `שלום ${name}!\nפרטי המוסד "${institution_name.trim()}" נקלטו בהצלחה.\nלכניסה למערכת לחצי כאן:\n${loginLink}`
    const smsMsg = `שלום ${name}! הרשמת למערכת השביל. לכניסה: ${loginLink}`

    if (phone) {
      // Primary: WhatsApp / SMS
      await sendExternal({ phone, whatsapp_preference: true, waMessage: waMsg, smsMessage: smsMsg })
    } else {
      // Fallback: send via Resend email
      const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
      if (resend) {
        const from = process.env.EMAIL_FROM ?? 'השביל <noreply@giuus.vercel.app>'
        void resend.emails.send({
          from,
          to: cleanEmail,
          subject: 'קישור כניסה למערכת השביל',
          html: `<div dir="rtl"><p>שלום ${name},</p><p>פרטי המוסד "${institution_name.trim()}" נקלטו בהצלחה.</p><p><a href="${loginLink}" style="background:#5B3AAB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">כניסה למערכת</a></p><p style="color:#888;font-size:12px">הקישור תקף ל-24 שעות.</p></div>`,
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
