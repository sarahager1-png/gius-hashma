import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppsAllClient, { type AppRow } from './apps-client'

export default async function InstitutionApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/dashboard')

  // 1) Fetch all institution jobs
  const { data: jobs } = await service
    .from('jobs')
    .select('id, title, city')
    .eq('institution_id', institution.id)

  const jobIds = (jobs ?? []).map(j => j.id)

  if (jobIds.length === 0) {
    return (
      <AppsAllClient
        apps={[]}
        institutionId={institution.id}
        institutionName={institution.institution_name}
      />
    )
  }

  // 2) Fetch all applications for these jobs
  const { data: appsRaw } = await service
    .from('applications')
    .select('id, status, applied_at, cover_letter, institution_notes, job_id, candidate_id, jobs(id, title, city)')
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false })

  // 3) Fetch candidate rows separately (avoid nested join issues)
  const candidateIds = [...new Set(
    ((appsRaw ?? []) as Record<string, unknown>[])
      .map(a => a.candidate_id as string)
      .filter(Boolean)
  )]

  const { data: candRows } = candidateIds.length > 0
    ? await service
        .from('candidates')
        .select('id, profile_id, city, specialization, academic_level, cv_url')
        .in('id', candidateIds)
    : { data: [] as { id: string; profile_id: string; city: string | null; specialization: string | null; academic_level: string | null; cv_url: string | null }[] }

  // 4) Fetch profiles for those candidates
  const profileIds = [...new Set(
    ((candRows ?? []) as { profile_id: string }[]).map(c => c.profile_id).filter(Boolean)
  )]

  const { data: profiles } = profileIds.length > 0
    ? await service
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', profileIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] }

  // 5) Build lookup maps
  const profileMap = Object.fromEntries(
    ((profiles ?? []) as { id: string; full_name: string | null; phone: string | null }[])
      .map(p => [p.id, p])
  )
  const candMap = Object.fromEntries(
    ((candRows ?? []) as { id: string; profile_id: string; city: string | null; specialization: string | null; academic_level: string | null; cv_url: string | null }[])
      .map(c => [c.id, { ...c, profiles: profileMap[c.profile_id] ?? null }])
  )

  // 6) Combine
  const apps: AppRow[] = ((appsRaw ?? []) as Record<string, unknown>[]).map(a => ({
    id:                 a.id as string,
    status:             a.status as AppRow['status'],
    applied_at:         a.applied_at as string,
    cover_letter:       a.cover_letter as string | null,
    institution_notes:  (a.institution_notes as string | null) ?? null,
    job_id:             a.job_id as string,
    candidate_id:       a.candidate_id as string,
    jobs:               a.jobs as AppRow['jobs'],
    candidates:         (candMap[a.candidate_id as string] ?? null) as AppRow['candidates'],
  }))

  return (
    <AppsAllClient
      apps={apps}
      institutionId={institution.id}
      institutionName={institution.institution_name}
    />
  )
}
