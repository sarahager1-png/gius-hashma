import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'

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

  const { data: leads, error } = await service
    .from('institution_leads')
    .select('id, institution_name, phone')
    .is('registered_profile_id', null)
    .not('phone', 'is', null)

  if (error) {
    console.error('[CRON] institution-registration-reminder query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const lead of leads ?? []) {
    if (!lead.phone) continue

    const link = `${appUrl}/register/institution-form?lead=${lead.id}`
    const msg = `שלום 👋\nתזכורת — הרשמת המוסד *${lead.institution_name}* למערכת *השביל* עדיין לא הושלמה.\n\nלחצי על הקישור להשלמת ההרשמה:\n${link}\n\nיש שאלות? נשמח לעזור 😊`

    const ok = await sendWA(lead.phone, msg)
    if (ok) {
      sent++
    } else {
      failed++
      console.error('[CRON] institution-registration-reminder send failed:', lead.phone)
    }

    await new Promise(r => setTimeout(r, 3000))
  }

  return NextResponse.json({ ok: true, total: (leads ?? []).length, sent, failed })
}
