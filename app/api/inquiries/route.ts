import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — candidate sends inquiry to institution about a job
export async function POST(request: Request) {
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, message } = await request.json()
  if (!job_id || !message?.trim())
    return NextResponse.json({ error: 'job_id ו-message הם שדות חובה' }, { status: 400 })

  const { data: profile } = await service
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'מועמדת')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: candidate } = await service
    .from('candidates').select('id').eq('profile_id', user.id).single()
  if (!candidate) return NextResponse.json({ error: 'פרופיל מועמדת לא נמצא' }, { status: 404 })

  const { data: job } = await service
    .from('jobs').select('id, title, institution_id').eq('id', job_id).single()
  if (!job) return NextResponse.json({ error: 'משרה לא נמצאה' }, { status: 404 })

  const { data: inst } = await service
    .from('institutions').select('id, institution_name, profile_id').eq('id', job.institution_id).single()
  if (!inst) return NextResponse.json({ error: 'מוסד לא נמצא' }, { status: 404 })

  const { data: inquiry, error } = await service
    .from('candidate_inquiries')
    .insert({ candidate_id: candidate.id, institution_id: inst.id, job_id, message: message.trim() })
    .select()
    .single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'כבר שלחת פנייה למוסד זה' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // notify institution
  await service.from('notifications').insert({
    profile_id: inst.profile_id,
    type: 'candidate_inquiry',
    title: `פנייה חדשה — ${profile?.full_name ?? 'מועמדת'}`,
    body: `${message.trim().slice(0, 90)}${message.trim().length > 90 ? '...' : ''} · ${job.title}`,
    related_id: inquiry.id,
  })

  return NextResponse.json(inquiry, { status: 201 })
}

// GET — institution views their own inquiries (with full candidate profiles)
export async function GET() {
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מוסד', 'מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let institutionId: string | null = null
  if (profile.role === 'מוסד') {
    const { data: inst } = await service
      .from('institutions').select('id').eq('profile_id', user.id).single()
    if (!inst) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    institutionId = inst.id
  }

  let query = service
    .from('candidate_inquiries')
    .select(`
      *,
      candidates(
        id, city, academic_level, availability_status, specialization, study_day,
        college, placement_location, prev_employer, prev_role,
        profiles(full_name, phone)
      ),
      jobs(id, title)
    `)
    .order('created_at', { ascending: false })

  if (institutionId) query = query.eq('institution_id', institutionId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
