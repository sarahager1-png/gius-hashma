import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import CandidateManagerClient from './candidates-manager-client'

export default async function AdminCandidatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: candidates } = await service
    .from('candidates')
    .select('id, city, district, college, academic_level, specialization, availability_status, seniority_years, created_at, profiles(full_name, phone)')
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CandidateManagerClient candidates={(candidates ?? []) as any} />
}
