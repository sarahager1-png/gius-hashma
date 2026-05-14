import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'מועמדת') as UserRole

  let waNumber = ''
  let contactEmail = ''
  if (['מנהלת מערכת', 'אדמין מערכת'].includes(role)) {
    const { data: rows } = await service
      .from('system_settings')
      .select('key, value')
      .in('key', ['support_wa_number', 'contact_email'])
    for (const row of rows ?? []) {
      if (row.key === 'support_wa_number') waNumber = row.value ?? ''
      if (row.key === 'contact_email')     contactEmail = row.value ?? ''
    }
  }

  return (
    <SettingsClient
      role={role}
      initialWaNumber={waNumber}
      initialContactEmail={contactEmail}
    />
  )
}
