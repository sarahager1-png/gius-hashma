import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/surveys?t=<token> — fetch survey by token (public, no auth)
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('t')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('placement_surveys')
    .select(`
      id, survey_type, submitted_at,
      overall_rating, q2_rating, q3_rating, recommend, notes,
      applications(
        jobs(title, institutions(institution_name)),
        candidates(profiles(full_name))
      )
    `)
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  if (data.submitted_at) return NextResponse.json({ ...data, already_submitted: true })

  return NextResponse.json(data)
}

// POST /api/surveys?t=<token> — submit survey (public, no auth)
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('t')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const body = await request.json()
  const { overall_rating, q2_rating, q3_rating, recommend, notes } = body

  if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const service = createServiceClient()

  // verify survey exists and not yet submitted
  const { data: survey } = await service
    .from('placement_surveys')
    .select('id, submitted_at')
    .eq('token', token)
    .single()

  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  if (survey.submitted_at) return NextResponse.json({ error: 'Already submitted' }, { status: 409 })

  const { error } = await service
    .from('placement_surveys')
    .update({
      overall_rating,
      q2_rating: q2_rating ?? null,
      q3_rating: q3_rating ?? null,
      recommend: recommend ?? null,
      notes: notes ?? null,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', survey.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
