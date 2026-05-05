import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

// Vercel Cron Job — runs daily at 08:00 Israel time (05:00 UTC)
// Warns institution managers when a job expires within 3 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: jobs, error } = await service
    .from('jobs')
    .select('id, title, expires_at, institutions(institution_name, phone, profile_id)')
    .eq('status', 'פעילה')
    .not('expires_at', 'is', null)
    .gt('expires_at', now.toISOString())
    .lte('expires_at', in3Days.toISOString())

  if (error) {
    console.error('[CRON] job-expiry error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let warned = 0

  for (const job of jobs ?? []) {
    const inst = job.institutions as unknown as { institution_name: string; phone: string | null; profile_id: string | null } | null
    if (!inst) continue

    if (inst.profile_id) {
      await service.from('notifications').insert({
        profile_id: inst.profile_id,
        type: 'job_expiry_warning',
        title: `המשרה "${job.title}" עומדת לפוג`,
        body: 'המשרה תפוג בעוד 3 ימים. לחידוש כנסי לניהול המשרות.',
        related_id: job.id,
      })
    }

    if (inst.phone) {
      await sendSms(inst.phone, `המשרה "${job.title}" תפוג בעוד 3 ימים. לחידוש: giuus.vercel.app/institution/jobs`)
    }

    warned++
  }

  return NextResponse.json({ ok: true, jobs_warned: warned })
}
