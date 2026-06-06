// Cron: every 15 minutes — send any due pending reminders
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'
import { notify } from '@/lib/notify'
import { isShabbatOrChag } from '@/lib/shabbat'

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Don't send on Shabbat / Yom Tov. Reminders stay 'pending' and are picked up
  // by the next run after Shabbat/Chag ends (instead of being marked failed).
  if (isShabbatOrChag())
    return NextResponse.json({ skipped: 'shabbat', sent: 0 })

  const service = createServiceClient()

  const { data: reminders } = await service
    .from('reminders')
    .select('*, profiles!target_profile_id(phone)')
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
