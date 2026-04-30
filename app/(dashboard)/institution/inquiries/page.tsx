import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InquiriesClient from './inquiries-client'

export default async function InstitutionInquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/dashboard')

  const { data: inquiries } = await service
    .from('candidate_inquiries')
    .select(`
      *,
      candidates(
        id, city, academic_level, availability_status, specialization, study_day,
        college, placement_location, prev_employer, prev_role,
        profiles(full_name, phone)
      ),
      jobs(id, title)
    `)
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  return <InquiriesClient inquiries={inquiries ?? []} />
}
