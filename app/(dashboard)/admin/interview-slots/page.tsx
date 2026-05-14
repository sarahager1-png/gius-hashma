import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { InterviewSlot } from '@/lib/types'
import SlotsClient from './slots-client'

export default async function InterviewSlotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? '')) redirect('/dashboard')

  const { data: slots } = await service
    .from('interview_slots')
    .select('*, candidates(id, profiles(id, full_name, phone))')
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true })

  return <SlotsClient slots={(slots ?? []) as InterviewSlot[]} />
}
