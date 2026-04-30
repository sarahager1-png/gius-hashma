import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MyInvitationsClient from './my-invitations-client'

export default async function MyInvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: candidate } = await service
    .from('candidates').select('id').eq('profile_id', user.id).single()
  if (!candidate) redirect('/dashboard')

  const { data } = await service
    .from('invitations')
    .select('id, status, scheduled_at, created_at, jobs(title, city, job_type), institutions(institution_name, phone, profiles(phone))')
    .eq('candidate_id', candidate.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <MyInvitationsClient invitations={(data ?? []) as any} candidateId={candidate.id} />
}
