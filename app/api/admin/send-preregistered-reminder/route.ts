import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWA, normalizePhone } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

async function handler(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const { data: pending } = await service
    .from('pre_registered_institutions')
    .select('institution_name, email, phone, full_name, city')
    .eq('status', 'pending')

  if (!pending?.length) return NextResponse.json({ sent: 0, skipped: 0 })

  const { data: leads } = await service
    .from('institution_leads')
    .select('institution_name, phone')
    .not('phone', 'is', null)

  const leadsMap = new Map<string, string>()
  for (const l of leads ?? []) {
    if (l.phone) leadsMap.set(l.institution_name.trim().toLowerCase(), l.phone)
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  let sent = 0
  let skipped = 0

  for (const p of pending) {
    const phone = p.phone ?? leadsMap.get(p.institution_name.trim().toLowerCase()) ?? null
    if (!phone) { skipped++; continue }

    const firstName = (p.full_name ?? p.institution_name).split(' ')[0]
    const cleanPhone = normalizePhone(phone.replace(/\D/g, '').replace(/^0/, ''))

    const msg =
      `שלום ${firstName}! 👋\n\n` +
      `את יודעת את הרגע הזה —\n` +
      `מחפשת מורה, שולחת הודעות לכל הכיוונים, מקבלת המלצות שלא מתאימות, ובסוף את עצמך מכסה שעות.\n\n` +
      `גיוס כח אדם לחינוך חב"ד זה לא עוד משרה — זה למצוא מישהי שמבינה את הנשמה של המוסד.\n\n` +
      `בדיוק בשביל זה בנינו את *השביל* 🌿\n\n` +
      `מאגר בוגרות מוסדות חב"ד — נשים שגדלו על אותם ערכים שאת מחנכת אליהם.\n` +
      `מאושרות במערכת, זמינות לשיבוץ, מחפשות בדיוק מה שאת מציעה.\n\n` +
      `את מפרסמת משרה — אנחנו מביאות לך את המתאימות.\n` +
      `פחות טלפונים. פחות הפתעות. יותר זמן לך.\n\n` +
      `וכבר עכשיו — *הגיע הזמן להתחיל לאייש את השנה הבאה.* 📅\n` +
      `כל משרה שתעלי היום — מועמדות כבר מחכות.\n\n` +
      `את כבר מילאת את הטופס — צעד אחד קטן נשאר 👇\n` +
      `*התחברי עם המייל שלך, קבלי גישה מיידית והתחילי להעלות משרות:*\n` +
      `📧 ${p.email}\n` +
      `🔗 https://giuus.vercel.app/mosad\n\n` +
      `נשמח ללוות אותך 💙\n` +
      `*רשת חינוך חב"ד — מערכת השביל*`

    const waOk = await sendWA(cleanPhone, msg)
    if (waOk) { sent++ }
    else {
      const smsOk = await sendSms(phone, msg)
      if (smsOk) sent++ else skipped++
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ sent, skipped })
}

export { handler as GET, handler as POST }
