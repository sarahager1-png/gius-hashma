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
    .select('id, status, applied_at, updated_at, placement_date, cover_letter, jobs(title, city, job_type, institutions(institution_name))')
    .eq('candidate_id', cand.id)
    .order('applied_at', { ascending: false })

  const apps = data ?? []

  // attach the latest interview (scheduled_at) per application — drives the timeline "ראיון" stage
  const interviewMap: Record<string, { scheduled_at: string; location: string | null; candidate_confirmed: boolean | null }> = {}
  if (apps.length > 0) {
    const { data: interviews } = await service
      .from('interviews')
      .select('application_id, scheduled_at, location, candidate_confirmed')
      .in('application_id', apps.map(a => a.id))
      .order('scheduled_at', { ascending: false })
    for (const iv of interviews ?? []) {
      // keep the most recent interview per application (first seen due to desc order)
      if (!interviewMap[iv.application_id]) {
        interviewMap[iv.application_id] = {
          scheduled_at: iv.scheduled_at,
          location: iv.location,
          candidate_confirmed: iv.candidate_confirmed,
        }
      }
    }
  }

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
    interview: interviewMap[a.id] ?? null,
  })))
}
