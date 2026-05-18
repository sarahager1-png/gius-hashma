import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import SetupFormClient from './setup-form-client'

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'מועמדת') redirect('/dashboard')

  const { data: candidate } = await service
    .from('candidates')
    .select('district, specialization, availability_status, whatsapp_preference')
    .eq('profile_id', user.id)
    .single()

  // already set up — send to jobs
  if (candidate?.district && candidate?.specialization) redirect('/jobs')

  return (
    <SetupFormClient
      candidateName={profile.full_name ?? ''}
      current={{
        district: candidate?.district ?? null,
        specialization: candidate?.specialization ?? null,
        availability_status: candidate?.availability_status ?? null,
        whatsapp_preference: candidate?.whatsapp_preference ?? null,
      }}
    />
  )
}
