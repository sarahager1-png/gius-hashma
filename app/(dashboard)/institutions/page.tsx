import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InstitutionsClient from './institutions-client'
import type { Institution } from '@/lib/types'

export default async function InstitutionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: institutions } = await service
    .from('institutions')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false })

  return <InstitutionsClient institutions={(institutions ?? []) as Institution[]} />
}
