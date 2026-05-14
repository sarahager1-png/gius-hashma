import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InterviewsClient, { type InterviewRow } from './interviews-client'

export default async function InstitutionInterviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/institution/profile')

  // 1) job IDs
  const { data: jobs } = await service
    .from('jobs')
    .select('id, title')
    .eq('institution_id', institution.id)

  const jobIds = (jobs ?? []).map(j => j.id)
  const jobMap = Object.fromEntries((jobs ?? []).map(j => [j.id, j.title]))

  if (jobIds.length === 0) {
    return <InterviewsClient interviews={[]} institutionName={institution.institution_name} />
  }

  // 2) applications for these jobs
  const { data: apps } = await service
    .from('applications')
    .select('id, candidate_id, job_id')
    .in('job_id', jobIds)

  const appIds      = (apps ?? []).map(a => a.id)
  const candidateIds = [...new Set((apps ?? []).map(a => a.candidate_id).filter(Boolean))]
  const appJobMap   = Object.fromEntries((apps ?? []).map(a => [a.id, a.job_id]))
  const appCandMap  = Object.fromEntries((apps ?? []).map(a => [a.id, a.candidate_id]))

  if (appIds.length === 0) {
    return <InterviewsClient interviews={[]} institutionName={institution.institution_name} />
  }

  // 3) interviews for these applications
  const { data: ivRaw } = await service
    .from('interviews')
    .select('id, application_id, scheduled_at, location, notes, candidate_confirmed, created_at')
    .in('application_id', appIds)
    .order('scheduled_at', { ascending: true })

  if (!ivRaw || ivRaw.length === 0) {
    return <InterviewsClient interviews={[]} institutionName={institution.institution_name} />
  }

  // 4) candidates + profiles
  const { data: candRows } = candidateIds.length > 0
    ? await service
        .from('candidates')
        .select('id, profile_id, city')
        .in('id', candidateIds)
    : { data: [] as { id: string; profile_id: string; city: string | null }[] }

  const profileIds = [...new Set((candRows ?? []).map(c => c.profile_id).filter(Boolean))]

  const { data: profiles } = profileIds.length > 0
    ? await service
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', profileIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const candMap    = Object.fromEntries(
    (candRows ?? []).map(c => [c.id, { ...c, profile: profileMap[c.profile_id] ?? null }])
  )

  // 5) combine
  const interviews: InterviewRow[] = ivRaw.map(iv => {
    const candId  = appCandMap[iv.application_id]
    const cand    = candId ? candMap[candId] : null
    const jobId   = appJobMap[iv.application_id]
    return {
      id:                  iv.id,
      application_id:      iv.application_id,
      scheduled_at:        iv.scheduled_at,
      location:            iv.location,
      notes:               iv.notes,
      candidate_confirmed: iv.candidate_confirmed,
      created_at:          iv.created_at,
      job_title:           jobId ? (jobMap[jobId] ?? null) : null,
      candidate_name:      cand?.profile?.full_name ?? null,
      candidate_phone:     cand?.profile?.phone ?? null,
      candidate_city:      cand?.city ?? null,
    }
  })

  return <InterviewsClient interviews={interviews} institutionName={institution.institution_name} />
}
