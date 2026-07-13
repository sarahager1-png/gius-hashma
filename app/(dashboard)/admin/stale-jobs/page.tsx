import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import StaleJobsClient from './stale-jobs-client'

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']

export const dynamic = 'force-dynamic'

export default async function StaleJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !ADMIN_ROLES.includes(profile.role)) redirect('/dashboard')

  // כל המשרות שעדיין מסומנות "פעילה" — הישנות ביותר קודם
  const { data: activeJobs } = await service
    .from('jobs')
    .select('id, title, city, created_at, institution_id, institutions(institution_name, district)')
    .eq('status', 'פעילה')
    .order('created_at', { ascending: true })

  const rawJobs = (activeJobs ?? []) as unknown as {
    id: string
    title: string
    city: string | null
    created_at: string | null
    institution_id: string
    institutions: { institution_name: string; district: string | null } | null
  }[]

  // ספירת הגשות לכל משרה — עם עימוד כדי לעקוף את תקרת 1000 השורות של PostgREST
  const jobIds = rawJobs.map(j => j.id)
  const appAgg: Record<string, { total: number; pending: number; lastAt: string | null }> = {}
  if (jobIds.length) {
    const PAGE = 1000
    for (let from = 0; ; from += PAGE) {
      const { data: apps } = await service
        .from('applications')
        .select('job_id, status, created_at')
        .in('job_id', jobIds)
        .range(from, from + PAGE - 1)
      for (const a of apps ?? []) {
        const b = (appAgg[a.job_id] ??= { total: 0, pending: 0, lastAt: null })
        b.total++
        if (a.status === 'ממתינה' || a.status === 'נצפתה') b.pending++
        if (a.created_at && (!b.lastAt || a.created_at > b.lastAt)) b.lastAt = a.created_at
      }
      if (!apps || apps.length < PAGE) break
    }
  }

  const now = Date.now()
  const DAY = 86_400_000
  const jobs = rawJobs.map(j => {
    const created = j.created_at ? new Date(j.created_at).getTime() : now
    const agg = appAgg[j.id] ?? { total: 0, pending: 0, lastAt: null }
    const lastActivity = agg.lastAt ? new Date(agg.lastAt).getTime() : created
    return {
      id: j.id,
      title: j.title,
      city: j.city,
      institutionName: j.institutions?.institution_name ?? '—',
      district: j.institutions?.district ?? null,
      daysOpen: Math.max(0, Math.floor((now - created) / DAY)),
      daysQuiet: Math.max(0, Math.floor((now - lastActivity) / DAY)),
      apps: agg.total,
      pending: agg.pending,
    }
  })

  return <StaleJobsClient jobs={jobs} />
}
