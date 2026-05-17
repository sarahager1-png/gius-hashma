import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InvitationsClient, { type InvRow } from './invitations-client'

export default async function InstitutionInvitationsPage() {
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

  const { data } = await service
    .from('invitations')
    .select('id, status, scheduled_at, created_at, job_id, jobs(id, title, city), candidates(id, profiles(full_name, phone))')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  const invitations = ((data ?? []) as unknown[]) as InvRow[]

  return <InvitationsClient invitations={invitations} />
}
