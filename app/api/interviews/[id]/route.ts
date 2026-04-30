import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH — candidate confirms or declines an interview
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { confirmed } = await request.json()

  // verify caller is the candidate for this interview
  const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
  if (!cand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: iv } = await service
    .from('interviews')
    .select('id, application_id, applications!inner(candidate_id)')
    .eq('id', id)
    .single()

  const appCandId = (iv?.applications as unknown as { candidate_id: string } | null)?.candidate_id
  if (!iv || appCandId !== cand.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await service
    .from('interviews')
    .update({ candidate_confirmed: confirmed })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify institution when candidate confirms/declines
  const { data: fullIv } = await service
    .from('interviews')
    .select('application_id, applications(job_id, jobs(title, institution_id, institutions(profile_id)), candidates(profiles(full_name)))')
    .eq('id', id)
    .single()

  type FullApp = {
    job_id: string
    jobs: { title: string; institution_id: string; institutions: { profile_id: string | null } } | null
    candidates: { profiles: { full_name: string | null } | null } | null
  }
  const app = fullIv?.applications as unknown as FullApp | null
  const instProfileId = app?.jobs?.institutions?.profile_id
  if (instProfileId) {
    const candidateName = app?.candidates?.profiles?.full_name ?? 'מועמדת'
    const jobTitle = app?.jobs?.title ?? ''
    await service.from('notifications').insert({
      profile_id: instProfileId,
      type: 'interview_confirmed',
      title: confirmed ? `${candidateName} אישרה הגעה לראיון` : `${candidateName} ביטלה את הראיון`,
      body: `${confirmed ? 'אישור הגעה' : 'ביטול'} לראיון למשרת "${jobTitle}"`,
      related_id: fullIv?.application_id ?? null,
    })
  }

  return NextResponse.json({ ok: true })
}
