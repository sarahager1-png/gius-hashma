// Cron: every 15 minutes — send any due pending reminders
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'
import { notify } from '@/lib/notify'

export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: reminders } = await service
    .from('reminders')
    .select('*, profiles(phone)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  if (!reminders?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const r of reminders) {
    const phone = (r.profiles as { phone?: string | null } | null)?.phone ?? null
    let ok = false

    if (r.channel === 'in_app' || (!phone && r.channel !== 'wa' && r.channel !== 'sms')) {
      if (r.target_profile_id) {
        await notify({ profile_id: r.target_profile_id, type: 'reminder', title: r.title, body: r.body })
        ok = true
      }
    } else if (r.channel === 'wa' && phone) {
      ok = await sendWA(phone, `${r.title}\n\n${r.body}`)
    } else if (r.channel === 'sms' && phone) {
      ok = await sendSms(phone, `${r.title} — ${r.body}`)
    }

    await service
      .from('reminders')
      .update({ status: ok ? 'sent' : 'failed', sent_at: new Date().toISOString() })
      .eq('id', r.id)

    if (ok) sent++
  }

  return NextResponse.json({ sent, total: reminders.length })
}
