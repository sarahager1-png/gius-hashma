import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { id: string; candidateId: string }

// Admin: update status/review_notes. Candidate: submit reflection_text.
export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const { id, candidateId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = ['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? '')

  const body = await req.json()

  if (isAdmin) {
    // Admin can change status and review_notes
    const allowed: Record<string, unknown> = {}
    if ('status' in body) allowed.status = body.status
    if ('review_notes' in body) allowed.review_notes = body.review_notes
    if ('status' in body) allowed.reviewed_by = user.id

    const { data, error } = await service
      .from('learning_day_reflections')
      .update(allowed)
      .eq('learning_day_id', id)
      .eq('candidate_id', candidateId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Candidate submitting their own reflection
  const { data: candidate } = await service
    .from('candidates')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!candidate || candidate.id !== candidateId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await service
    .from('learning_day_reflections')
    .update({
      reflection_text: body.reflection_text,
      status: 'שיקוף התקבל',
      submitted_at: new Date().toISOString(),
    })
    .eq('learning_day_id', id)
    .eq('candidate_id', candidateId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
