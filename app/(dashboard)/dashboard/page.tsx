import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'
import CandidateDashboard from './candidate-dashboard'
import InstitutionDashboard from './institution-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile) redirect('/login')

  /* ── הנהלה ── */
  if (['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) {
    return <DashboardClient fullName={profile.full_name} />
  }

  /* ── מועמדת ── */
  if (profile.role === 'מועמדת') {
    const [
      { data: candidateRow },
      { count: totalJobs },
    ] = await Promise.all([
      service.from('candidates').select('id, availability_status, city, district, specialization, academic_level').eq('profile_id', user.id).single(),
      service.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'פעילה'),
    ])

    const candidateId = candidateRow?.id ?? null

    const profileFields = [
      profile.full_name,
      candidateRow?.city,
      candidateRow?.district,
      candidateRow?.specialization,
      candidateRow?.academic_level,
      candidateRow?.availability_status && candidateRow.availability_status !== 'לא פעילה'
        ? candidateRow.availability_status : null,
    ]
    const profileScore = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

    // Fetch all active jobs once, use for both matched + suggested
    const { data: allActiveJobs } = await service
      .from('jobs')
      .select('id, title, city, district, job_type, specialization, description, institutions(institution_name, institution_type, city)')
      .eq('status', 'פעילה')
      .order('created_at', { ascending: false })
      .limit(40)

    // Score jobs by candidate match (district, specialization, city)
    type ActiveJob = typeof allActiveJobs extends (infer T)[] | null ? T : never
    const scoreJob = (j: ActiveJob & Record<string, unknown>) => {
      let s = 0
      if (candidateRow?.specialization && j.specialization === candidateRow.specialization) s += 3
      if (candidateRow?.district && j.district === candidateRow.district) s += 2
      if (candidateRow?.city && j.city === candidateRow.city) s += 2
      return s
    }
    const sorted = [...(allActiveJobs ?? [])].sort((a, b) =>
      scoreJob(b as ActiveJob & Record<string, unknown>) - scoreJob(a as ActiveJob & Record<string, unknown>)
    )
    const matchedJobs = sorted.slice(0, 3)
    const suggestedJobs = sorted.slice(0, 5)

    const [appsRes, interviewsRes, notifsRes, invitationsRes] = await Promise.all([
      candidateId
        ? service
            .from('applications')
            .select('id, status, applied_at, jobs(title, city, institutions(institution_name))')
            .eq('candidate_id', candidateId)
            .order('applied_at', { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] }),
      candidateId
        ? service
            .from('interviews')
            .select('id, scheduled_at, location, notes, candidate_confirmed, applications!inner(candidate_id, jobs(title, institutions(institution_name)))')
            .eq('applications.candidate_id', candidateId)
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(3)
        : Promise.resolve({ data: [] }),
      service
        .from('notifications')
        .select('id, type, title, body, read, created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      candidateId
        ? service
            .from('invitations')
            .select('id, status, scheduled_at, created_at, jobs(title, city, job_type), institutions(institution_name)')
            .eq('candidate_id', candidateId)
            .eq('status', 'ממתינה')
            .order('created_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ])

    return (
      <CandidateDashboard
        fullName={profile.full_name}
        availabilityStatus={candidateRow?.availability_status ?? 'לא פעילה'}
        profileScore={profileScore}
        totalJobs={totalJobs ?? 0}
        myApplications={(appsRes.data ?? []) as unknown as Parameters<typeof CandidateDashboard>[0]['myApplications']}
        matchedJobs={matchedJobs as unknown as Parameters<typeof CandidateDashboard>[0]['matchedJobs']}
        suggestedJobs={suggestedJobs as unknown as Parameters<typeof CandidateDashboard>[0]['suggestedJobs']}
        upcomingInterviews={(interviewsRes.data ?? []) as unknown as Parameters<typeof CandidateDashboard>[0]['upcomingInterviews']}
        notifications={(notifsRes.data ?? []) as unknown as Parameters<typeof CandidateDashboard>[0]['notifications']}
        pendingInvitations={(invitationsRes.data ?? []) as unknown as Parameters<typeof CandidateDashboard>[0]['pendingInvitations']}
      />
    )
  }

  /* ── מוסד ── */
  if (profile.role === 'מוסד') {
    const { data: institution } = await service
      .from('institutions').select('id, institution_name, is_approved').eq('profile_id', user.id).single()

    if (!institution?.is_approved) {
      return <PendingApproval fullName={profile.full_name} />
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const [jobsRes, recentAppsRes] = await Promise.all([
      service
        .from('jobs')
        .select('id, title, city, district, specialization, job_type, status, applications(count)')
        .eq('institution_id', institution.id)
        .order('created_at', { ascending: false })
        .limit(8),
      service
        .from('applications')
        .select('id, status, applied_at, job_id, jobs!inner(id, title, institution_id), candidates(profiles(full_name))')
        .eq('jobs.institution_id', institution.id)
        .order('applied_at', { ascending: false })
        .limit(10),
    ])

    const newAppsRes = await service
      .from('applications')
      .select('job_id, applied_at, jobs!inner(institution_id)')
      .eq('jobs.institution_id', institution.id)
      .gte('applied_at', oneWeekAgo)

    const newAppsByJob: Record<string, number> = {}
    for (const a of newAppsRes.data ?? []) {
      newAppsByJob[a.job_id] = (newAppsByJob[a.job_id] ?? 0) + 1
    }

    type RawJob = { id: string; title: string; city: string | null; district: string | null; specialization: string | null; job_type: string | null; status: string; applications: { count: number }[] }
    const jobs = ((jobsRes.data ?? []) as RawJob[]).map(j => ({
      id: j.id,
      title: j.title,
      city: j.city,
      job_type: j.job_type,
      status: j.status,
      appCount: j.applications?.[0]?.count ?? 0,
      newAppCount: newAppsByJob[j.id] ?? 0,
    }))

    // Fetch matched candidates for active jobs
    const activeJobs = ((jobsRes.data ?? []) as RawJob[]).filter(j => j.status === 'פעילה')
    const specs    = [...new Set(activeJobs.map(j => j.specialization).filter(Boolean))] as string[]
    const districts= [...new Set(activeJobs.map(j => j.district).filter(Boolean))]       as string[]
    const cities   = [...new Set(activeJobs.map(j => j.city).filter(Boolean))]           as string[]

    let candQ = service
      .from('candidates')
      .select('id, city, district, specialization, academic_level, availability_status, profiles(id, full_name)')
      .not('availability_status', 'in', '("לא פעילה","משובצת")')
      .limit(40)

    const { data: allCands } = await candQ

    type CandRow = { id: unknown; city: unknown; district: unknown; specialization: unknown; academic_level: unknown; availability_status: unknown; profiles: unknown }
    const scoreCand = (c: Record<string, unknown>) => {
      let s = 0
      if (specs.includes(String(c.specialization ?? '')))   s += 3
      if (districts.includes(String(c.district ?? '')))     s += 2
      if (cities.includes(String(c.city ?? '')))            s += 2
      return s
    }
    const matchedCandidates = [...(allCands ?? [])]
      .sort((a, b) => scoreCand(b as Record<string, unknown>) - scoreCand(a as Record<string, unknown>))
      .slice(0, 3) as unknown as CandRow[]

    return (
      <InstitutionDashboard
        fullName={profile.full_name}
        institutionName={institution.institution_name}
        jobs={jobs}
        matchedCandidates={matchedCandidates as unknown as Parameters<typeof InstitutionDashboard>[0]['matchedCandidates']}
        recentApps={(recentAppsRes.data ?? []) as unknown as Parameters<typeof InstitutionDashboard>[0]['recentApps']}
      />
    )
  }

  redirect('/login')
}

function PendingApproval({ fullName }: { fullName: string | null }) {
  const firstName = fullName?.split(' ')[0] ?? ''
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="text-center max-w-sm px-6">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: '#FDF3E3' }}
        >
          <Clock size={30} style={{ color: '#D97706' }} />
        </div>
        <h1
          className="text-[22px] font-extrabold mb-2"
          style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}
        >
          {firstName ? `שלום, ${firstName}` : 'שלום'}
        </h1>
        <p className="text-[15px] mb-1" style={{ color: 'var(--ink-2)' }}>
          החשבון שלך ממתין לאישור מנהל הרשת.
        </p>
        <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>
          תקבלי הודעה בדוא&quot;ל ברגע שהחשבון יאושר.
        </p>
      </div>
    </div>
  )
}
