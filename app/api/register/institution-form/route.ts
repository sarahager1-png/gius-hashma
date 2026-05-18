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
  const cleanEmail = email.trim().toLowerCase()
  const name = full_name.trim()
  const phone = principal_phone?.trim() || null

  // בדיקה אם המייל כבר רשום כמשתמש פעיל (לא רק pre_registered)
  const { data: { users } } = await service.auth.admin.listUsers({ perPage: 1000 })
  const alreadyExists = users?.some(u => u.email?.toLowerCase() === cleanEmail)
  if (alreadyExists) {
    return NextResponse.json({ error: 'כתובת המייל כבר רשומה במערכת' }, { status: 400 })
  }

  // שמירה ב-pre_registered_institutions — הכניסה תהיה דרך Google
  const institutionType = school_type === 'גן ילדים' ? 'גן ילדים' : 'בית ספר יסודי'

  const finalSchoolType = school_type === 'גן ילדים' ? null : (school_type || null)

  const { error: preRegErr } = await service
    .from('pre_registered_institutions')
    .upsert({
      email: cleanEmail,
      full_name: name,
      institution_name: institution_name.trim(),
      city: city?.trim() || null,
      institution_type: institutionType,
      district: district || null,
      school_type: finalSchoolType,
      phone: phone,
    }, { onConflict: 'email' })

  if (preRegErr)
    return NextResponse.json({ error: preRegErr.message }, { status: 500 })

  // שליחת וואטסאפ עם קישור לכניסה עם Google
  if (phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'
    const mosadLink = `${appUrl}/mosad`
    const waMsg = `שלום ${name}!\nפרטי המוסד "${institution_name.trim()}" נקלטו בהצלחה.\n\nלכניסה למערכת — לחצי כאן:\n${mosadLink}\n\nהיכנסי עם Google עם המייל: ${cleanEmail}`
    const smsMsg = `שלום ${name}! פרטי המוסד נקלטו. לכניסה עם Google: ${mosadLink}`
    await sendExternal({ phone, whatsapp_preference: true, waMessage: waMsg, smsMessage: smsMsg })
  }

  return NextResponse.json({ ok: true })
}
