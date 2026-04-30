import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, city, phone, level, status, placement_location, prev_employer, prev_role, exp } = await request.json()

  const { data: newProfile, error: pe } = await service
    .from('profiles').insert({ role: 'מועמדת', full_name: name, phone: phone || null }).select().single()
  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })

  const { data: newCand, error: ce } = await service
    .from('candidates').insert({
      profile_id: newProfile.id, city: city || null,
      academic_level: level, availability_status: status, specialization: 'יסודי',
      placement_location: placement_location || null,
      prev_employer: prev_employer || null, prev_role: prev_role || null,
      years_experience: exp ? parseInt(exp) : null,
    }).select().single()
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: newCand.id }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { profile, candidate } = await request.json()

  if (profile) {
    const { error } = await service
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (candidate) {
    const ALLOWED = [
      'city', 'college', 'graduation_year', 'specialization', 'academic_level',
      'availability_status', 'bio', 'cv_url', 'district', 'address', 'birth_year',
      'marital_status', 'maiden_name', 'seniority_years', 'handwriting_font',
      'technical_skills', 'interpersonal_skills', 'experiences', 'practical_work',
      'shlichut_location', 'shlichut_years', 'past_projects', 'personal_note',
      'availability_from', 'availability_to', 'study_day',
    ]
    const safe = Object.fromEntries(Object.entries(candidate).filter(([k]) => ALLOWED.includes(k)))
    if (Object.keys(safe).length > 0) {
      const { error } = await service.from('candidates').update(safe).eq('profile_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
