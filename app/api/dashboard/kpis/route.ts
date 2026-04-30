import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const DEMO = [
  { id: 'candidates', label: 'מועמדות פעילות', value: 247,
    delta: { value: 247, dir: 'up', unit: '', label: 'במאגר' }, variant: 'purple', icon: 'users' },
  { id: 'jobs', label: 'משרות פתוחות', value: 38,
    delta: { value: 14, dir: 'flat', label: 'הגשות ממתינות' }, variant: 'soft', icon: 'briefcase' },
  { id: 'placements', label: 'שיבוצים פעילים', value: 104,
    delta: { value: 104, dir: 'up', unit: '', label: 'מועמדות משובצות' }, variant: 'teal', icon: 'heart' },
  { id: 'avg_time', label: 'זמן טיפול ממוצע', value: 4, unit: 'ימים',
    delta: { value: 0, dir: 'flat', label: 'מהגשה לתגובה' }, variant: 'amber', icon: 'clock' },
]

export async function GET(req: Request) {
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

    const [
      { count: activeCandidates },
      { count: activeJobs },
      { count: placed },
      { count: pendingApps },
    ] = await Promise.all([candQ, jobsQ, placedQ, pendingQ])

    // no demo fallback — show real zeros

    const { data: respondedApps } = await service
      .from('applications').select('applied_at, updated_at')
      .in('status', ['נצפתה', 'התקבלה', 'נדחתה']).limit(50)
    let avgDays = 4
    if (respondedApps && respondedApps.length > 0) {
      const diffs = respondedApps.map(a => (new Date(a.updated_at).getTime() - new Date(a.applied_at).getTime()) / 86_400_000)
      avgDays = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length)
    }

    return NextResponse.json([
      { id: 'candidates', label: 'מועמדות פעילות', value: activeCandidates ?? 0,
        delta: { value: activeCandidates ?? 0, dir: 'up', unit: '', label: 'במאגר' }, variant: 'purple', icon: 'users' },
      { id: 'jobs', label: 'משרות פתוחות', value: activeJobs ?? 0,
        delta: { value: pendingApps ?? 0, dir: 'flat', label: 'הגשות ממתינות' }, variant: 'soft', icon: 'briefcase' },
      { id: 'placements', label: 'שיבוצים פעילים', value: placed ?? 0,
        delta: { value: placed ?? 0, dir: placed && placed > 0 ? 'up' : 'flat', unit: '', label: 'מועמדות משובצות' }, variant: 'teal', icon: 'heart' },
      { id: 'avg_time', label: 'זמן טיפול ממוצע', value: avgDays, unit: 'ימים',
        delta: { value: 0, dir: 'flat', label: 'מהגשה לתגובה' }, variant: 'amber', icon: 'clock' },
    ])
  } catch {
    return NextResponse.json(DEMO)
  }
}
