import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const EMPTY = [
  { id: 'candidates', label: 'מועמדות פעילות', value: 0, ring: 0,
    delta: { value: 0, dir: 'flat', unit: '', label: 'במאגר' }, variant: 'purple', icon: 'users' },
  { id: 'jobs', label: 'משרות פתוחות', value: 0, ring: 0,
    delta: { value: 0, dir: 'flat', label: 'הגשות ממתינות' }, variant: 'soft', icon: 'briefcase' },
  { id: 'placements', label: 'שיבוצים פעילים', value: 0, ring: 0,
    delta: { value: 0, dir: 'flat', unit: '', label: 'מועמדות משובצות' }, variant: 'teal', icon: 'heart' },
  { id: 'avg_time', label: 'זמן טיפול ממוצע', value: 0, unit: 'ימים', ring: 0,
    delta: { value: 0, dir: 'flat', label: 'מהגשה לתגובה' }, variant: 'amber', icon: 'clock' },
]

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')
  const until = searchParams.get('until')

  try {
    const service = createServiceClient()

    let candQ = service.from('candidates').select('*', { count: 'exact', head: true }).neq('availability_status', 'לא פעילה')
    let jobsQ = service.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'פעילה')
    let placedQ = service.from('candidates').select('*', { count: 'exact', head: true }).eq('availability_status', 'משובצת')
    let pendingQ = service.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'ממתינה')

    if (since) {
      candQ = candQ.gte('created_at', since)
      jobsQ = jobsQ.gte('created_at', since)
      placedQ = (service.from('applications').select('*', { count: 'exact', head: true }) as typeof placedQ).eq('status', 'התקבלה').gte('updated_at', since)
      pendingQ = pendingQ.gte('applied_at', since)
    }
    if (until) {
      candQ = candQ.lte('created_at', until)
      jobsQ = jobsQ.lte('created_at', until)
    }

    const [candRes, jobsRes, placedRes, pendingRes] = await Promise.all([candQ, jobsQ, placedQ, pendingQ])
    const queryErr = candRes.error ?? jobsRes.error ?? placedRes.error ?? pendingRes.error
    if (queryErr) {
      // supabase-js doesn't throw on query errors, so without this check a failed
      // query silently looked identical to "genuinely zero" — surface it in logs
      console.error('[kpis] query error, returning EMPTY (not a real zero):', queryErr)
      return NextResponse.json(EMPTY)
    }
    const activeCandidates = candRes.count
    const activeJobs = jobsRes.count
    const placed = placedRes.count
    const pendingApps = pendingRes.count

    const isEmpty = !activeCandidates && !activeJobs && !placed && !pendingApps
    if (isEmpty) return NextResponse.json(EMPTY)

    const { data: respondedApps } = await service
      .from('applications').select('applied_at, updated_at')
      .in('status', ['נצפתה', 'התקבלה', 'נדחתה']).limit(50)
    let avgDays = 0
    if (respondedApps && respondedApps.length > 0) {
      const diffs = respondedApps.map(a => (new Date(a.updated_at).getTime() - new Date(a.applied_at).getTime()) / 86_400_000)
      avgDays = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length)
    }

    const cands = activeCandidates ?? 0
    const jobs  = activeJobs ?? 0
    const pl    = placed ?? 0
    const pend  = pendingApps ?? 0
    const candRing  = Math.min(99, Math.round(cands / 150 * 100))
    const jobRing   = Math.min(99, Math.round(jobs  / 40  * 100))
    const placeRing = cands > 0 ? Math.min(99, Math.round(pl / cands * 100)) : 0
    const timeRing  = avgDays > 0 ? Math.min(99, Math.max(10, Math.round((20 - Math.min(avgDays, 20)) / 20 * 100))) : 0

    return NextResponse.json([
      { id: 'candidates', label: 'מועמדות פעילות', value: cands, ring: candRing,
        delta: { value: cands, dir: 'up', unit: '', label: 'במאגר' }, variant: 'purple', icon: 'users' },
      { id: 'jobs', label: 'משרות פתוחות', value: jobs, ring: jobRing,
        delta: { value: pend, dir: 'flat', label: 'הגשות ממתינות' }, variant: 'soft', icon: 'briefcase' },
      { id: 'placements', label: 'שיבוצים פעילים', value: pl, ring: placeRing,
        delta: { value: pl, dir: pl > 0 ? 'up' : 'flat', unit: '', label: 'מועמדות משובצות' }, variant: 'teal', icon: 'heart' },
      { id: 'avg_time', label: 'זמן טיפול ממוצע', value: avgDays, unit: 'ימים', ring: timeRing,
        delta: { value: 0, dir: 'flat', label: 'מהגשה לתגובה' }, variant: 'amber', icon: 'clock' },
    ])
  } catch (err) {
    console.error('[kpis] unexpected error:', err)
    return NextResponse.json(EMPTY)
  }
}
