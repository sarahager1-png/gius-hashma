import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

// Vercel Cron Job — runs daily at 09:00 Israel time (06:00 UTC)
// Reminds institutions that have applications waiting > 2 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: applications, error } = await service
    .from('applications')
    .select('id, job_id, jobs(institution_id, title, institutions(institution_name, phone, profile_id))')
    .eq('status', 'ממתינה')
    .lt('applied_at', twoDaysAgo)

  if (error) {
    console.error('[CRON] pending-applications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // group by institution
  const byInstitution = new Map<string, {
    institutionId: string
    institutionName: string
    phone: string | null
    profileId: string | null
    count: number
  }>()

  for (const app of applications ?? []) {
    const job = app.jobs as unknown as {
      institution_id: string
      institutions: { institution_name: string; phone: string | null; profile_id: string | null }
    } | null
    if (!job) continue
    const instId = job.institution_id
    if (!byInstitution.has(instId)) {
      byInstitution.set(instId, {
        institutionId: instId,
        institutionName: job.institutions?.institution_name ?? '',
        phone: job.institutions?.phone ?? null,
        profileId: job.institutions?.profile_id ?? null,
        count: 0,
      })
    }
    byInstitution.get(instId)!.count++
  }

  let notified = 0

  for (const inst of byInstitution.values()) {
    if (inst.profileId) {
      await service.from('notifications').insert({
        profile_id: inst.profileId,
        type: 'pending_apps_reminder',
        title: `תזכורת: ${inst.count} הגשות ממתינות`,
        body: `יש ${inst.count} הגשות שממתינות לטיפולך מזה יותר מיומיים.`,
      })
    }
    if (inst.phone) {
      await sendSms(inst.phone, `תזכורת: ${inst.count} הגשות ממתינות לטיפולך. giuus.vercel.app/institution/applications`)
    }
    notified++
  }

  return NextResponse.json({ ok: true, institutions_notified: notified })
}
