import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// DELETE — institution cancels a pending invitation
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // resolve institution
  const { data: inst } = await service.from('institutions').select('id').eq('profile_id', user.id).single()
  if (!inst) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: inv } = await service
    .from('invitations')
    .select('id, status, institution_id')
    .eq('id', id)
    .single()

  if (!inv || inv.institution_id !== inst.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (inv.status !== 'ממתינה')
    return NextResponse.json({ error: 'ניתן לבטל רק הזמנות ממתינות' }, { status: 400 })

  await service.from('invitations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

// PATCH — candidate accepts or declines an invitation
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
  if (!cand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status, rejection_reason } = await request.json()
  if (!['התקבלה', 'נדחתה'].includes(status))
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })

  const { data: inv } = await service
    .from('invitations')
    .select('id, job_id, institution_id, candidate_id, scheduled_at')
    .eq('id', id)
    .single()
  if (!inv || inv.candidate_id !== cand.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updateData: Record<string, string | null> = { status }
  if (status === 'נדחתה' && rejection_reason) updateData.rejection_reason = rejection_reason

  await service.from('invitations').update(updateData).eq('id', id)

  // if accepted → auto-create application + interview + notify institution
  if (status === 'התקבלה') {
    // reuse existing application if candidate already applied to this job
    const { data: existing } = await service
      .from('applications')
      .select('id')
      .eq('job_id', inv.job_id)
      .eq('candidate_id', cand.id)
      .maybeSingle()

    const { data: app, error: appErr } = existing
      ? { data: existing, error: null }
      : await service
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
      service.from('institutions').select('profile_id, phone, whatsapp_preference').eq('id', inv.institution_id).single(),
      service.from('candidates').select('profiles(full_name)').eq('id', cand.id).single(),
      service.from('jobs').select('title').eq('id', inv.job_id).single(),
    ])
    const instProfileId = instRes.data?.profile_id
    const instPhone = instRes.data?.phone ?? null
    const instWaPref = instRes.data?.whatsapp_preference
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
    if (instPhone) {
      const msg = `✅ ${candidateName} קיבלה את ההזמנה לראיון למשרת "${jobTitle}". לפרטים: giuus.vercel.app/institution/applications`
      void sendExternal({ phone: instPhone, whatsapp_preference: instWaPref, waMessage: msg, smsMessage: msg })
    }
  }

  // if declined → notify institution with reason
  if (status === 'נדחתה') {
    const [instRes, candRes, jobRes] = await Promise.all([
      service.from('institutions').select('profile_id, phone, whatsapp_preference').eq('id', inv.institution_id).single(),
      service.from('candidates').select('profiles(full_name)').eq('id', cand.id).single(),
      service.from('jobs').select('title').eq('id', inv.job_id).single(),
    ])
    const instProfileId = instRes.data?.profile_id
    const instPhone = instRes.data?.phone ?? null
    const instWaPref = instRes.data?.whatsapp_preference
    const candidateName = (candRes.data?.profiles as unknown as { full_name: string | null } | null)?.full_name ?? 'מועמדת'
    const jobTitle = jobRes.data?.title ?? ''
    const reasonSuffix = rejection_reason ? ` סיבה: ${rejection_reason}` : ''
    if (instProfileId) {
      await service.from('notifications').insert({
        profile_id: instProfileId,
        type: 'invitation_declined',
        title: `${candidateName} דחתה את ההזמנה`,
        body: `המועמדת דחתה את ההזמנה לראיון למשרת "${jobTitle}".${reasonSuffix}`,
        related_id: inv.id,
      })
    }
    if (instPhone) {
      const msg = `${candidateName} דחתה את ההזמנה לראיון למשרת "${jobTitle}".${reasonSuffix} ניתן להזמין מועמדת אחרת: giuus.vercel.app/institution/candidates`
      void sendExternal({ phone: instPhone, whatsapp_preference: instWaPref, waMessage: msg, smsMessage: msg })
    }
  }

  return NextResponse.json({ ok: true })
}
