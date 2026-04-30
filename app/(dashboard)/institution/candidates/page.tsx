import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Candidate } from '@/lib/types'
import CandidateSearchClient from './candidates-search-client'

export default async function SearchCandidatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions').select('id, institution_name, is_approved').eq('profile_id', user.id).single()
  if (!institution?.is_approved) redirect('/dashboard')

  const [candidatesRes, jobsRes] = await Promise.all([
    service
      .from('candidates')
      .select('*, profiles(full_name, phone)')
      .neq('availability_status', 'לא פעילה')
      .order('updated_at', { ascending: false }),
    service
      .from('jobs')
      .select('id, title')
      .eq('institution_id', institution.id)
      .eq('status', 'פעילה')
      .order('created_at', { ascending: false }),
  ])

  const candidates = (candidatesRes.data ?? []) as Candidate[]
  const activeJobs = (jobsRes.data ?? []) as { id: string; title: string }[]

  return (
    <CandidateSearchClient
      candidates={candidates}
      institutionId={institution.id}
      institutionName={institution.institution_name}
      activeJobs={activeJobs}
    />
  )
}
