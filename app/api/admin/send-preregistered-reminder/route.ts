import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWA, normalizePhone } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all pending pre_registered + fill in phone from institution_leads where missing
  const { data: pending } = await service
    .from('pre_registered_institutions')
    .select('institution_name, email, phone, full_name, city')
    .eq('status', 'pending')

  if (!pending?.length) return NextResponse.json({ sent: 0, skipped: 0 })

  // Get leads phones for cross-reference
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
      `מילאת את טופס ההרשמה למערכת *השביל* — תודה רבה! 🙏\n\n` +
      `כדי להיכנס למערכת ולהתחיל לפרסם משרות, יש לבצע שלב אחד נוסף:\n\n` +
      `*לחצי על הקישור והתחברי עם Google עם המייל:*\n` +
      `📧 ${p.email}\n\n` +
      `🔗 ${appUrl}/mosad\n\n` +
      `נשמח לעזור בכל שאלה! 😊\n*רשת חינוך חב"ד*`

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
