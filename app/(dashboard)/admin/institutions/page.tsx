import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InstitutionsManagerClient from './institutions-manager-client'

export default async function AdminInstitutionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת', 'מנהל רשת'].includes(profile.role)) redirect('/dashboard')

  const { data: institutions } = await service
    .from('institutions')
    .select('id, profile_id, institution_name, city, district, school_type, is_approved, approved_by, created_at, owner:profiles!profile_id(full_name, phone)')
    .order('created_at', { ascending: false })

  const { data: leads } = await service
    .from('institution_leads')
    .select('id, institution_name, city, phone, institution_type')
    .is('registered_profile_id', null)
    .order('institution_name')

  // exclude leads whose name matches an already-registered institution
  const registeredNames = new Set(
    (institutions ?? []).map(i => i.institution_name.trim().toLowerCase())
  )
  const unregisteredLeads = (leads ?? []).filter(
    l => !registeredNames.has(l.institution_name.trim().toLowerCase())
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <InstitutionsManagerClient institutions={(institutions ?? []) as any} leads={unregisteredLeads} />
}
