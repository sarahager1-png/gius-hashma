import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: institutions } = await service
    .from('institutions')
    .select('institution_name, owner:profiles!profile_id(full_name, phone)')

  if (!institutions?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const inst of institutions) {
    const owner = inst.owner as { full_name: string | null; phone: string | null } | null
    const phone = owner?.phone ?? null
    if (!phone) { skipped++; continue }

    const firstName = (owner?.full_name ?? inst.institution_name).split(' ')[0]

    const msg =
      `שלום ${firstName}! 👋\n\n` +
      `השנה הקרובה מתקרבת — והמשרות הכי טובות מתמלאות קודם 😊\n\n` +
      `יש אצלך משרות פתוחות לתשפ"ז?\n` +
      `*העליתי אותן עכשיו* — מועמדות בוגרות חב"ד, עם התאמה ערכית מלאה למוסד שלך, כבר מחפשות בדיוק אצלך.\n\n` +
      `⏰ המועמדות הטובות נתפשות מהר — כל שבוע שעובר זה מישהי שכבר מצאה מקום אחר.\n\n` +
      `להעלאת משרה:\n` +
      `🔗 https://giuus.vercel.app/institution/jobs/new\n\n` +
      `בברכה 💙\n` +
      `*מערכת השביל — רשת חינוך חב"ד*`

    const waOk = await sendWA(phone, msg)
    if (waOk) { sent++ }
    else {
      const smsOk = await sendSms(phone, msg)
      if (smsOk) sent++ else skipped++
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ ok: true, sent, skipped })
}
