import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // All active applications (ממתינה / נצפתה) with full join
  const { data: apps } = await service
    .from('applications')
    .select(`
      id,
      status,
      applied_at,
      updated_at,
      cover_letter,
      candidates!inner(
        id,
        city,
        college,
        academic_level,
        cv_url,
        profiles(full_name, phone)
      ),
      jobs!inner(
        id,
        title,
        institutions!inner(id, institution_name, city)
      )
    `)
    .in('status', ['ממתינה', 'נצפתה'])
    .order('updated_at', { ascending: false })
    .limit(50)

  // Interviews for these applications (latest per application)
  const appIds = (apps ?? []).map(a => a.id)
  const { data: interviews } = appIds.length
    ? await service
        .from('interviews')
        .select('id, application_id, scheduled_at, candidate_confirmed')
        .in('application_id', appIds)
        .order('scheduled_at', { ascending: true })
    : { data: [] }

  // Map interviews to application_id (keep latest)
  const ivMap: Record<string, { id: string; scheduled_at: string; candidate_confirmed: boolean | null }> = {}
  for (const iv of interviews ?? []) {
    ivMap[iv.application_id] = iv
  }

  const result = (apps ?? []).map(app => {
    const cand = app.candidates as unknown as {
      id: string
      city: string | null
      college: string | null
      academic_level: string | null
      cv_url: string | null
      profiles: { full_name: string | null; phone: string | null } | null
    }
    const job = app.jobs as unknown as {
      id: string
      title: string
      institutions: { id: string; institution_name: string; city: string | null } | null
    }

    const iv = ivMap[app.id] ?? null
    const daysWaiting = Math.floor((Date.now() - new Date(app.applied_at).getTime()) / 86_400_000)

    let interviewStatus: string | null = null
    if (iv) {
      if (iv.candidate_confirmed === true) interviewStatus = 'אושר'
      else if (iv.candidate_confirmed === false) interviewStatus = 'בוטל'
      else interviewStatus = 'ממתין לאישור'
    }

    return {
      id: app.id,
      candidateName: cand?.profiles?.full_name ?? '—',
      candidatePhone: cand?.profiles?.phone ?? null,
      candidateCity: cand?.city ?? null,
      candidateCvUrl: cand?.cv_url ?? null,
      candidateId: cand?.id ?? null,
      jobTitle: job?.title ?? '—',
      jobId: job?.id ?? null,
      institutionName: job?.institutions?.institution_name ?? '—',
      institutionId: job?.institutions?.id ?? null,
      status: app.status,
      daysWaiting,
      updatedAt: app.updated_at,
      appliedAt: app.applied_at,
      interviewDate: iv?.scheduled_at ?? null,
      interviewStatus,
    }
  })

  return NextResponse.json(result)
}
