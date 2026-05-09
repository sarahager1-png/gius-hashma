import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InboxClient from './inbox-client'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: raw } = await service
    .from('messages')
    .select(`
      id, subject, body, read_at, created_at, related_job_id,
      from_profile_id,
      from_profile:profiles!messages_from_profile_id_fkey(full_name),
      jobs(title)
    `)
    .eq('to_profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = (raw ?? []).map((m: any) => ({
    ...m,
    from_profile: Array.isArray(m.from_profile) ? (m.from_profile[0] ?? null) : m.from_profile,
    jobs:         Array.isArray(m.jobs)         ? (m.jobs[0] ?? null)         : m.jobs,
  }))

  return <InboxClient messages={messages} />
}
