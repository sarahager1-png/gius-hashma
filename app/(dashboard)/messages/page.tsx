import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MessagesClient from './messages-client'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: candidates } = await service
    .from('candidates')
    .select('id, availability_status, city, profiles(full_name, phone)')
    .not('profiles.phone', 'is', null)
    .order('created_at', { ascending: false })

  return <MessagesClient candidates={(candidates ?? []) as unknown as Parameters<typeof MessagesClient>[0]['candidates']} />
}
