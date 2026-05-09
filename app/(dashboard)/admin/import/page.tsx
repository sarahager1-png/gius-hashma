import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ImportClient from './import-client'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return <ImportClient />
}
