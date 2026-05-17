import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const service = createServiceClient()
  const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
  if (!cand) return NextResponse.json([])

  const { data } = await service
    .from('applications')
    .select('id, status, applied_at, cover_letter, jobs(title, city, job_type, institutions(institution_name))')
    .eq('candidate_id', cand.id)
    .order('applied_at', { ascending: false })

  const apps = data ?? []

  // attach survey token for accepted applications
  const acceptedIds = apps.filter(a => a.status === 'התקבלה').map(a => a.id)
  const surveyTokenMap: Record<string, string> = {}
  if (acceptedIds.length > 0) {
    const { data: surveys } = await service
      .from('placement_surveys')
      .select('application_id, token')
      .in('application_id', acceptedIds)
      .eq('survey_type', 'candidate_about_institution')
      .is('submitted_at', null)
    for (const s of surveys ?? []) {
      surveyTokenMap[s.application_id] = s.token
    }
  }

  return NextResponse.json(apps.map(a => ({
    ...a,
    survey_token: surveyTokenMap[a.id] ?? null,
  })))
}
