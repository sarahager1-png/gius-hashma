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

  let institution = null as { id: string; is_approved: boolean } | null
  if (isAdmin) {
    const { data } = await service.from('institutions').select('id, is_approved').eq('is_approved', true).limit(1).single()
    institution = data
  } else {
    const { data } = await service.from('institutions').select('id, is_approved').eq('profile_id', user.id).single()
    institution = data
  }
  if (!institution?.is_approved) redirect('/institution/profile')

  return <MatchesClient institutionId={institution.id} />
}
