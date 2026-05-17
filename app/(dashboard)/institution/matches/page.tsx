import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MatchesClient from './matches-client'

export default async function InstitutionMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: viewerProfile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = viewerProfile && ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(viewerProfile.role)
  if (isAdmin) redirect('/admin/institutions')

  const { data: institution } = await service.from('institutions').select('id, is_approved').eq('profile_id', user.id).single()
  if (!institution?.is_approved) redirect('/institution/profile')

  return <MatchesClient institutionId={institution.id} />
}
