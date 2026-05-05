import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return <SettingsClient role={(profile?.role ?? 'מועמדת') as UserRole} />
}
