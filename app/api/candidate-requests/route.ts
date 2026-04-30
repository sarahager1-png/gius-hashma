import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — public, submit a request (no auth required)
export async function POST(request: Request) {
  const service = createServiceClient()

  const body = await request.json()
  const {
    full_name, phone, email, district, city, address,
    birth_year, marital_status, maiden_name,
    college, specialization, academic_level, seniority_years, handwriting_font,
    experiences, practical_work,
    shlichut_location, shlichut_years,
    technical_skills, interpersonal_skills,
    study_day,
    past_projects, personal_note,
    availability_from, availability_to,
  } = body

  if (!full_name?.trim() || !phone?.trim())
    return NextResponse.json({ error: 'שם וטלפון הם שדות חובה' }, { status: 400 })

  const { data, error } = await service
    .from('candidate_requests')
    .insert({
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      district: district || null,
      city: city?.trim() || null,
      address: address?.trim() || null,
      birth_year: birth_year ?? null,
      marital_status: marital_status || null,
      maiden_name: maiden_name?.trim() || null,
      college: college?.trim() || null,
      specialization: specialization || null,
      academic_level: academic_level || null,
      seniority_years: seniority_years || null,
      handwriting_font: handwriting_font || null,
      experiences: experiences ?? null,
      practical_work: practical_work ?? null,
      shlichut_location: shlichut_location?.trim() || null,
      shlichut_years: shlichut_years?.trim() || null,
      technical_skills: technical_skills?.trim() || null,
      interpersonal_skills: interpersonal_skills?.trim() || null,
      study_day: study_day || null,
      past_projects: past_projects?.trim() || null,
      personal_note: personal_note?.trim() || null,
      availability_from: availability_from || null,
      availability_to: availability_to || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify all admins
  const { data: admins } = await service
    .from('profiles')
    .select('id')
    .in('role', ['מנהל רשת', 'אדמין מערכת'])

  if (admins && admins.length > 0) {
    await service.from('notifications').insert(
      admins.map(admin => ({
        profile_id: admin.id,
        type: 'candidate_request',
        title: `בקשת הצטרפות חדשה — ${full_name.trim()}`,
        body: `${phone.trim()}${city ? ' · ' + city : ''}${specialization ? ' · ' + specialization : ''}. ממתינה לאישור.`,
        related_id: data.id,
      }))
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

// GET — admin only, list all requests
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { data } = await service
    .from('candidate_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
