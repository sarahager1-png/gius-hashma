import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron Job — runs daily at 08:00 Israel time (05:00 UTC)
// 1. Marks jobs past their expires_at as 'פג תוקפה' and notifies institution
// 2. Warns institution 3 days before expiry
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()

  // ── 1. Actually expire jobs that are past their expiry date ─────────────
  const { data: toExpire, error: expireErr } = await service
    .from('jobs')
    .select('id, title, institutions(profile_id, institution_name, phone, whatsapp_preference)')
    .eq('status', 'פעילה')
    .not('expires_at', 'is', null)
    .lt('expires_at', now.toISOString())

  if (expireErr) {
    console.error('[CRON] job-expiry fetch error:', expireErr)
    return NextResponse.json({ error: expireErr.message }, { status: 500 })
  }

  let expired = 0
  for (const job of toExpire ?? []) {
    const inst = job.institutions as unknown as {
      profile_id: string | null
      institution_name: string
      phone: string | null
      whatsapp_preference: boolean | null
    } | null

    // Auto-renew instead of closing — jobs stay active until manually filled
    const newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    await service.from('jobs').update({ expires_at: newExpiry.toISOString() }).eq('id', job.id)
    expired++
  }

  // ── 2. Warn institutions 3 days before expiry ────────────────────────────
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

  const { data: toWarn } = await service
    .from('jobs')
    .select('id, title, institutions(profile_id, institution_name, phone, whatsapp_preference)')
    .eq('status', 'פעילה')
    .not('expires_at', 'is', null)
    .gt('expires_at', in3Days.toISOString())
    .lte('expires_at', in4Days.toISOString())

  let warned = 0
  for (const job of toWarn ?? []) {
    const inst = job.institutions as unknown as {
      profile_id: string | null
      institution_name: string
      phone: string | null
      whatsapp_preference: boolean | null
    } | null

    if (inst?.profile_id) {
      // Skip if already warned today (dedup via notifications table)
      const { data: existing } = await service
        .from('notifications')
        .select('id')
        .eq('profile_id', inst.profile_id)
        .eq('type', 'job_expiry_warning')
        .eq('related_id', job.id)
        .limit(1)

      if (existing?.length) continue

      await service.from('notifications').insert({
        profile_id: inst.profile_id,
        type: 'job_expiry_warning',
        title: `המשרה "${job.title}" עומדת לפוג בעוד 3 ימים`,
        body: 'לחידוש המשרה כנסי לניהול המשרות.',
        related_id: job.id,
      })
    }

    if (inst?.phone) {
      const warnMsg = `המשרה "${job.title}" תפוג בעוד 3 ימים. לחידוש: giuus.vercel.app/institution/jobs`
      void sendExternal({ phone: inst.phone, whatsapp_preference: inst.whatsapp_preference, waMessage: warnMsg, smsMessage: warnMsg })
    }

    warned++
  }

  return NextResponse.json({ ok: true, expired, warned })
}
