import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { MessageTemplate, CommunicationLog } from '@/lib/types'
import CommunicationClient from './communication-client'

export default async function CommunicationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? '')) redirect('/dashboard')

  const [{ data: templates }, { data: logs }] = await Promise.all([
    service.from('message_templates').select('*').order('key'),
    service.from('communication_logs').select('*').order('sent_at', { ascending: false }).limit(200),
  ])

  return (
    <CommunicationClient
      templates={(templates ?? []) as MessageTemplate[]}
      logs={(logs ?? []) as CommunicationLog[]}
    />
  )
}
