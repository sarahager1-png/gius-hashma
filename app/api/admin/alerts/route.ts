import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const now = Date.now()

  const [jobsRes, stuckInterviewsRes, unresponsiveInstRes] = await Promise.all([
    // Active jobs with application count (to find jobs with no applicants)
    service
      .from('jobs')
      .select('id, title, created_at, institutions!inner(institution_name)')
      .eq('status', 'פעילה'),

    // Interviews pending candidate confirmation for 48+ hours
    service
      .from('interviews')
      .select('id, scheduled_at, created_at, applications!inner(id, candidates!inner(profiles(full_name)), jobs!inner(title, institutions!inner(institution_name)))')
      .is('candidate_confirmed', null)
      .lt('created_at', new Date(now - 48 * 3600 * 1000).toISOString()),

    // Applications pending for 7+ days with their institution
    service
      .from('applications')
      .select('id, applied_at, jobs!inner(title, institutions!inner(id, institution_name))')
      .eq('status', 'ממתינה')
      .lt('applied_at', new Date(now - 7 * 86400 * 1000).toISOString()),
  ])

  // Jobs with 0 applicants for 14+ days
  const { data: appsPerJob } = await service
    .from('applications')
    .select('job_id')

  const jobsWithApps = new Set((appsPerJob ?? []).map(a => a.job_id))

  const jobsNoApplicants = (jobsRes.data ?? []).filter(j => {
    const ageMs = now - new Date(j.created_at).getTime()
    return ageMs > 14 * 86400 * 1000 && !jobsWithApps.has(j.id)
  }).map(j => ({
    type: 'job_no_applicants' as const,
    id: j.id,
    label: `"${j.title}" — ${(j.institutions as unknown as { institution_name: string }).institution_name}`,
    detail: `פעילה ${Math.floor((now - new Date(j.created_at).getTime()) / 86400000)} ימים ללא הגשה`,
    severity: 'warning' as const,
  }))

  // Interviews pending confirmation 48+ hours
  const stuckInterviews = (stuckInterviewsRes.data ?? []).map((iv: unknown) => {
    const row = iv as {
      id: string; created_at: string
      applications: {
        candidates: { profiles: { full_name: string | null } | null } | null
        jobs: { title: string; institutions: { institution_name: string } | null } | null
      }
    }
    const name = row.applications?.candidates?.profiles?.full_name ?? '—'
    const job = row.applications?.jobs?.title ?? '—'
    const inst = row.applications?.jobs?.institutions?.institution_name ?? '—'
    const hoursWaiting = Math.floor((now - new Date(row.created_at).getTime()) / 3600000)
    return {
      type: 'interview_no_response' as const,
      id: row.id,
      label: `${name} לא אישרה ראיון — ${job} (${inst})`,
      detail: `ממתין ${hoursWaiting} שעות`,
      severity: 'warning' as const,
    }
  })

  // Institutions with many long-pending applications (already grouped in attention, here flag worst offenders)
  const instPendingMap: Record<string, { name: string; count: number; oldest: string }> = {}
  for (const app of stuckInterviewsRes.data ?? []) { void app } // already fetched above

  for (const app of unresponsiveInstRes.data ?? []) {
    const row = app as unknown as {
      id: string; applied_at: string
      jobs: { title: string; institutions: { id: string; institution_name: string } | null }
    }
    const inst = row.jobs?.institutions
    if (!inst) continue
    if (!instPendingMap[inst.id]) {
      instPendingMap[inst.id] = { name: inst.institution_name, count: 0, oldest: row.applied_at }
    }
    instPendingMap[inst.id].count++
    if (new Date(row.applied_at) < new Date(instPendingMap[inst.id].oldest)) {
      instPendingMap[inst.id].oldest = row.applied_at
    }
  }

  const unresponsiveInsts = Object.entries(instPendingMap)
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => {
      const daysOldest = Math.floor((now - new Date(v.oldest).getTime()) / 86400000)
      return {
        type: 'institution_unresponsive' as const,
        id,
        label: `${v.name} — ${v.count} הגשות ממתינות`,
        detail: `הוותיקה ביותר: ${daysOldest} ימים`,
        severity: daysOldest >= 14 ? ('critical' as const) : ('warning' as const),
      }
    })
    .sort((a, b) => (b.severity === 'critical' ? 1 : 0) - (a.severity === 'critical' ? 1 : 0))

  const alerts = [
    ...unresponsiveInsts,
    ...stuckInterviews,
    ...jobsNoApplicants,
  ]

  return NextResponse.json(alerts)
}
