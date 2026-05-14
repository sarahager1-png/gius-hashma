import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MatchesClient from './matches-client'

export default async function InstitutionMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions').select('id, is_approved').eq('profile_id', user.id).single()
  if (!institution?.is_approved) redirect('/institution/profile')

  return <MatchesClient institutionId={institution.id} />
}
