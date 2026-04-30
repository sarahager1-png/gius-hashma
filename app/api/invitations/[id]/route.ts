import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH — candidate accepts or declines an invitation
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
  if (!cand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await request.json()
  if (!['התקבלה', 'נדחתה'].includes(status))
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })

  const { data: inv } = await service
    .from('invitations')
    .select('id, job_id, institution_id, candidate_id, scheduled_at')
    .eq('id', id)
    .single()
  if (!inv || inv.candidate_id !== cand.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await service.from('invitations').update({ status }).eq('id', id)

  // if accepted → auto-create application + interview + notify institution
  if (status === 'התקבלה') {
    const { data: app, error: appErr } = await service
      .from('applications')
      .insert({ job_id: inv.job_id, candidate_id: cand.id })
      .select()
      .single()

    if (!appErr && app && inv.scheduled_at) {
      await service.from('interviews').insert({
        application_id: app.id,
        scheduled_at: inv.scheduled_at,
        candidate_confirmed: true,
      })
    }

    // notify institution
    const [instRes, candRes, jobRes] = await Promise.all([
      service.from('institutions').select('profile_id').eq('id', inv.institution_id).single(),
      service.from('candidates').select('profiles(full_name)').eq('id', cand.id).single(),
      service.from('jobs').select('title').eq('id', inv.job_id).single(),
    ])
    const instProfileId = instRes.data?.profile_id
    const candidateName = (candRes.data?.profiles as unknown as { full_name: string | null } | null)?.full_name ?? 'מועמדת'
    const jobTitle = jobRes.data?.title ?? ''
    if (instProfileId) {
      await service.from('notifications').insert({
        profile_id: instProfileId,
        type: 'invitation_accepted',
        title: `${candidateName} קיבלה את ההזמנה`,
        body: `המועמדת אישרה את ההזמנה לראיון למשרת "${jobTitle}"`,
        related_id: app?.id ?? null,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
