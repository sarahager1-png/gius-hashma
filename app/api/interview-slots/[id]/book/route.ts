import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendToCandidate } from '@/lib/communication'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verify caller is a candidate
  const { data: candidate } = await service
    .from('candidates')
    .select('id, profiles(full_name)')
    .eq('profile_id', user.id)
    .single()

  if (!candidate) return NextResponse.json({ error: 'Only candidates can book slots' }, { status: 403 })

  // Read slot and verify availability
  const { data: slot } = await service
    .from('interview_slots')
    .select('*')
    .eq('id', id)
    .single()

  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  if (!slot.is_available) return NextResponse.json({ error: 'הזמן כבר תפוס' }, { status: 409 })

  // Book it
  const { error } = await service
    .from('interview_slots')
    .update({ is_available: false, booked_by: candidate.id, booked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the candidate
  const dateStr = new Date(`${slot.slot_date}T${slot.slot_time}`).toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const timeStr = slot.slot_time.slice(0, 5)
  const profileRow = candidate.profiles as unknown as { full_name: string | null } | null

  await sendToCandidate({
    profileId: user.id,
    templateKey: 'interview_invitation',
    vars: {
      name: profileRow?.full_name ?? 'מועמדת',
      date: dateStr,
      time: timeStr,
      location: slot.location ?? 'יתואם בנפרד',
      slot_link: '',
    },
    inAppTitle: `ראיון נקבע ל-${dateStr} בשעה ${timeStr}`,
    contextType: 'interview_slot',
    contextId: slot.id,
  })

  return NextResponse.json({ ok: true })
}
