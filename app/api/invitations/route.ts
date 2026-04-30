import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — institution invites a candidate to a job
export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { institution_id, candidate_id, job_id, message, scheduled_at } = await request.json()
  if (!institution_id || !candidate_id || !job_id)
    return NextResponse.json({ error: 'institution_id, candidate_id, job_id required' }, { status: 400 })

  const { data: callerProfile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = callerProfile?.role && ['מנהל רשת', 'אדמין מערכת'].includes(callerProfile.role)

  // verify institution belongs to caller (or caller is admin)
  const { data: inst } = await service
    .from('institutions').select('id, institution_name').eq('id', institution_id).single()
  if (!inst) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isAdmin) {
    const { data: ownedInst } = await supabase
      .from('institutions').select('id').eq('id', institution_id).eq('profile_id', user.id).single()
    if (!ownedInst) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // verify job belongs to this institution (also fetch title for notification)
  const { data: jobRow } = await service
    .from('jobs').select('id, title').eq('id', job_id).eq('institution_id', institution_id).single()
  if (!jobRow) return NextResponse.json({ error: 'המשרה אינה שייכת למוסד זה' }, { status: 403 })

  const { data: inv, error } = await service
    .from('invitations')
    .insert({ institution_id, candidate_id, job_id, message: message || null, scheduled_at: scheduled_at || null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already invited' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // notify candidate
  const jobTitle = jobRow.title
  const { data: cand } = await service.from('candidates').select('profile_id').eq('id', candidate_id).single()
  if (cand?.profile_id) {
    const dt = scheduled_at ? new Date(scheduled_at).toLocaleString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : null
    await service.from('notifications').insert({
      profile_id: cand.profile_id,
      type: 'interview_scheduled',
      title: `הוזמנת לראיון — ${inst.institution_name}`,
      body: `${jobTitle}${dt ? ' · ' + dt : ''}. ניתן לאשר או לסרב בדשבורד.`,
      related_id: inv.id,
    })
  }

  return NextResponse.json(inv, { status: 201 })
}
