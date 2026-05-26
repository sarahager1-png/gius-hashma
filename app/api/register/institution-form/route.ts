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

  // Map school_type → institution_type (broader category)
  function toInstitutionType(st: string | null): string {
    if (!st || st === 'גן ילדים') return st ?? 'בית חינוך'
    if (st.includes('קהילתי')) return 'קהילתי'
    if (st.includes('שלהבות')) return 'שלהבות חב"ד'
    return 'בית חינוך'
  }

  const institutionType = toInstitutionType(school_type || null)
  const finalSchoolType = (school_type === 'גן ילדים' ? null : school_type) || null

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

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  const mosadLink = `${appUrl}/mosad`

  // שליחת וואטסאפ עם קישור כניסה והסבר על המערכת
  if (phone) {
    const waMsg =
      `שלום ${name}! 🎉 ברוכה הבאה למערכת *השביל* של רשת חינוך חב"ד!\n\n` +
      `*איך המערכת עובדת?*\n` +
      `📋 תפרסמי משרות פתוחות מהדשבורד שלך\n` +
      `🔍 המערכת תציג לך מועמדות מתאימות לפי תפקיד, התמחות ומחוז\n` +
      `📩 תשלחי הזמנה לראיון — *המועמדת תקבל הודעה בוואטסאפ*\n` +
      `✅ לאחר שהמועמדת תאשר — תיצרו קשר ישיר ביניכן\n` +
      `🎯 לאחר השיבוץ המשרה נסגרת אוטומטית\n\n` +
      `*כל עדכון יגיע אלייך ישירות לוואטסאפ* 📱\n\n` +
      `לכניסה למערכת:\n${mosadLink}\n` +
      `היכנסי עם Google עם המייל: ${cleanEmail}\n\n` +
      `נשמח לעזור! 😊\n*רשת חינוך חב"ד*`
    const smsMsg = `שלום ${name}! ברוכה הבאה למערכת השביל. לכניסה עם Google: ${mosadLink}`
    await sendExternal({ phone, whatsapp_preference: true, waMessage: waMsg, smsMessage: smsMsg })
  }

  // התראה לאדמין — in-app notification
  const { data: admins } = await service.from('profiles').select('id').in('role', ['מנהלת מערכת', 'אדמין מערכת'])
  if (admins?.length) {
    void service.from('notifications').insert(
      admins.map(admin => ({
        profile_id: admin.id,
        type: 'institution_registered',
        title: `מוסד חדש נרשם — ${institution_name.trim()}`,
        body: `${name}${phone ? ' · ' + phone : ''} · ${cleanEmail}${city ? ' · ' + city : ''}${district ? ' · ' + district : ''}${school_type ? ' · ' + school_type : ''}`,
      }))
    )
  }

  return NextResponse.json({ ok: true })
}
