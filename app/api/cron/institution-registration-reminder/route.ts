import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

// Vercel Cron — runs Sun/Tue/Thu at 08:00 Israel time (05:00 UTC)
// Sends WhatsApp reminder to institution leads that haven't registered yet
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  const leadId = new URL(request.url).searchParams.get('lead_id')

  let query = service
    .from('institution_leads')
    .select('id, institution_name, phone')
    .is('registered_profile_id', null)
    .not('phone', 'is', null)

  if (leadId) query = query.eq('id', leadId) as typeof query

  const { data: leads, error } = await query

  if (error) {
    console.error('[CRON] institution-registration-reminder query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const lead of leads ?? []) {
    if (!lead.phone) continue

    const link = `${appUrl}/register/institution-form?lead=${lead.id}`
    const msg =
      `שלום 👋\nתזכורת — הרשמת המוסד *${lead.institution_name}* למערכת *השביל* עדיין לא הושלמה.\n\n` +
      `לחצי על הקישור להשלמת ההרשמה:\n${link}\n\n` +
      `רוצה לשמוע יותר על המערכת? ענו *כן* 😊`

    const waOk = await sendWA(lead.phone, msg)
    if (waOk) {
      // Create a short-lived session so a "כן" reply triggers the info message
      await service.from('wa_sessions').upsert({
        phone: lead.phone,
        session_type: 'lead_info_request',
        state: 'awaiting_reply',
        data: {
          lead_id: lead.id,
          institution_name: lead.institution_name,
          registration_link: link,
        },
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'phone' })
      sent++
    } else {
      // fallback to SMS
      const smsOk = await sendSms(lead.phone, msg)
      if (smsOk) {
        sent++
      } else {
        failed++
        console.error('[CRON] institution-registration-reminder send failed (WA+SMS):', lead.phone)
      }
    }

    await new Promise(r => setTimeout(r, 3000))
  }

  return NextResponse.json({ ok: true, total: (leads ?? []).length, sent, failed })
}
