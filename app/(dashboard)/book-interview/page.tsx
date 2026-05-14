import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { InterviewSlot } from '@/lib/types'
import BookSlotClient from './book-slot-client'

export default async function BookInterviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: slots } = await service
    .from('interview_slots')
    .select('*')
    .eq('is_available', true)
    .gte('slot_date', new Date().toISOString().slice(0, 10))
    .order('slot_date')
    .order('slot_time')

  // Check if already booked
  const { data: candidate } = await service
    .from('candidates')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  const { data: mySlot } = candidate
    ? await service
        .from('interview_slots')
        .select('*')
        .eq('booked_by', candidate.id)
        .gte('slot_date', new Date().toISOString().slice(0, 10))
        .order('slot_date')
        .limit(1)
        .maybeSingle()
    : { data: null }

  return (
    <BookSlotClient
      slots={(slots ?? []) as InterviewSlot[]}
      mySlot={(mySlot ?? null) as InterviewSlot | null}
    />
  )
}
