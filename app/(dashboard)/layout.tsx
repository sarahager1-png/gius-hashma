import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppHeader from '@/components/layout/app-header'
import AppSidebar from '@/components/layout/app-sidebar'
import WaFloatButton from '@/components/layout/wa-float-button'
import HelpFloatButton from '@/components/layout/help-float-button'
import RealtimeRefresh from '@/components/layout/realtime-refresh'
import type { UserRole } from '@/lib/types'

function roleHome(role: string): string {
  if (role === 'מועמדת') return '/profile'
  if (role === 'מוסד')   return '/institution/jobs'
  return '/dashboard'
}

function canAccess(role: string, pathname: string): boolean {
  if (['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(role)) return true

  if (role === 'מועמדת') {
    const allowed = ['/jobs', '/my-applications', '/my-invitations', '/book-interview', '/inbox', '/notifications', '/history', '/profile', '/help', '/institutions']
    return allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
  }

  if (role === 'מוסד') {
    const allowed = [
      '/institution/jobs',
      '/institution/candidates',
      '/institution/matches',
      '/institution/applications',
      '/institution/invitations',
      '/institution/inquiries',
      '/institution/interviews',
      '/institution/profile',
      '/settings',
      '/help',
    ]
    return allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
  }

  return false
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? ''
  if (pathname && !canAccess(profile.role, pathname)) {
    redirect(roleHome(profile.role))
  }

  if (profile.role === 'מועמדת' && pathname && pathname !== '/profile/setup') {
    const { data: candRow } = await service
      .from('candidates')
      .select('district, specialization')
      .eq('profile_id', user.id)
      .single()
    if (candRow && (!candRow.district || !candRow.specialization)) {
      redirect('/profile/setup')
    }
  }

  const INST_ALLOWED_INCOMPLETE = ['/institution/profile', '/settings', '/help']
  if (profile.role === 'מוסד' && pathname && !INST_ALLOWED_INCOMPLETE.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const { data: instRow } = await service
      .from('institutions')
      .select('district, school_type, institution_type')
      .eq('profile_id', user.id)
      .single()
    const hasType = !!instRow?.school_type || instRow?.institution_type === 'גן ילדים'
    if (instRow && (!instRow.district || !hasType)) {
      redirect('/institution/profile?setup=1')
    }
  }

  const { data: waRow } = await service
    .from('system_settings')
    .select('value')
    .eq('key', 'support_wa_number')
    .single()
  const waPhone = waRow?.value || process.env.NEXT_PUBLIC_WA_SUPPORT_NUMBER || ''

  let pendingInstitutions   = 0
  let pendingApplications   = 0
  let pendingInquiries      = 0
  let pendingCandidateReqs  = 0
  let pendingMatches        = 0

  if (['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    const [instRes, reqRes] = await Promise.all([
      service.from('institutions').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      Promise.resolve(
        service.from('candidate_requests').select('*', { count: 'exact', head: true }).eq('status', 'ממתינה')
      ).catch(() => ({ count: 0 as number | null })),
    ])
    pendingInstitutions  = instRes.count  ?? 0
    pendingCandidateReqs = reqRes.count   ?? 0
  }

  if (profile.role === 'מוסד') {
    const { data: inst } = await service
      .from('institutions')
      .select('id, city, district')
      .eq('profile_id', user.id)
      .single()

    if (inst) {
      const [{ data: allJobRows }, { data: activeJobs }] = await Promise.all([
        service.from('jobs').select('id').eq('institution_id', inst.id),
        service.from('jobs').select('id, specialization, city').eq('institution_id', inst.id).eq('status', 'פעילה'),
      ])

      const allJobIds = (allJobRows ?? []).map((j: { id: string }) => j.id)
      const activeJobIds = (activeJobs ?? []).map((j: { id: string }) => j.id)

      const [appsCountRes, inquiriesCountRes, candsRes, appsForScoreRes, invitesRes, dismissalsRes] = await Promise.all([
        allJobIds.length > 0
          ? service.from('applications').select('*', { count: 'exact', head: true }).in('job_id', allJobIds).eq('status', 'ממתינה')
          : Promise.resolve({ count: 0 }),
        service.from('candidate_inquiries').select('*', { count: 'exact', head: true }).eq('institution_id', inst.id).eq('status', 'ממתינה'),
        service.from('candidates')
          .select('id, district, city, work_cities, specialization, availability_status')
          .neq('availability_status', 'משובצת')
          .neq('availability_status', 'לא פעילה')
          .limit(200),
        activeJobIds.length > 0
          ? service.from('applications').select('job_id, candidate_id').in('job_id', activeJobIds)
          : Promise.resolve({ data: [] as { job_id: string; candidate_id: string }[] }),
        service.from('invitations').select('job_id, candidate_id').eq('institution_id', inst.id),
        service.from('match_dismissals').select('job_id, candidate_id').eq('institution_id', inst.id),
      ])

      const excluded = new Set<string>([
        ...(appsForScoreRes.data ?? []).map((r: { job_id: string; candidate_id: string }) => `${r.job_id}:${r.candidate_id}`),
        ...(invitesRes.data ?? []).map((r: { job_id: string; candidate_id: string }) => `${r.job_id}:${r.candidate_id}`),
        ...(dismissalsRes.data ?? []).map((r: { job_id: string; candidate_id: string }) => `${r.job_id}:${r.candidate_id}`),
      ])

      let matchCount = 0
      for (const job of activeJobs ?? []) {
        for (const cand of (candsRes.data ?? []) as {
          id: string; district: string | null; city: string | null
          work_cities: string[] | null; specialization: string | null; availability_status: string | null
        }[]) {
          if (excluded.has(`${job.id}:${cand.id}`)) continue
          let score = 0
          if (cand.district && inst.district && cand.district === inst.district) score += 5
          const specs: string[] = cand.specialization?.split(',').map((s: string) => s.trim()) ?? []
          if (cand.specialization && job.specialization &&
              (cand.specialization === job.specialization || specs.includes(job.specialization))) {
            score += 4
          } else if (!job.specialization || cand.specialization === 'שניהם') {
            score += 2
          }
          if (cand.city && inst.city && cand.city === inst.city) score += 2
          else if (cand.city && job.city && cand.city === job.city) score += 2
          if (cand.work_cities && job.city && cand.work_cities.includes(job.city)) score += 3
          if (cand.availability_status === "מחפשת סטאג'") score += 1
          if (score >= 4) matchCount++
        }
      }

      pendingApplications = appsCountRes.count ?? 0
      pendingInquiries    = inquiriesCountRes.count ?? 0
      pendingMatches      = matchCount
    }
  }

  return (
    <>
    <style>{`html, body { overflow: hidden; height: 100%; }`}</style>
    <div className="dashboard-grid" style={{ background: 'var(--bg-2)' }}>
      <AppHeader fullName={profile.full_name} role={profile.role} />
      <AppSidebar
        role={profile.role as UserRole}
        fullName={profile.full_name}
        pendingInstitutions={pendingInstitutions}
        pendingApplications={pendingApplications}
        pendingInquiries={pendingInquiries}
        pendingCandidateReqs={pendingCandidateReqs}
        pendingMatches={pendingMatches}
      />
      <main style={{ minWidth: 0, minHeight: 0, overflowX: 'hidden', overflowY: 'auto' }}>{children}</main>
      <RealtimeRefresh role={profile.role} profileId={user.id} />
      {waPhone && <WaFloatButton phone={waPhone} />}
      <HelpFloatButton hasWa={!!waPhone} />
    </div>
    </>
  )
}
