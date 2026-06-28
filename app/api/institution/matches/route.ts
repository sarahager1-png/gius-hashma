import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { inSameCityGroup } from '@/lib/city-affinity'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, city, district, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const activeJobIds = (
    await service.from('jobs').select('id').eq('institution_id', institution.id).eq('status', 'פעילה')
  ).data?.map(j => j.id) ?? []

  const [{ data: jobs }, { data: candidates }, { data: existingApps }, { data: existingInvites }, { data: dismissed }] =
    await Promise.all([
      service.from('jobs').select('id, title, specialization, city').eq('institution_id', institution.id).eq('status', 'פעילה'),
      service.from('candidates')
        .select('id, district, city, work_cities, specialization, academic_level, availability_status, cv_url, profiles(full_name, phone)')
        .neq('availability_status', 'משובצת')
        .neq('availability_status', 'לא פעילה')
        .limit(200),
      activeJobIds.length > 0
        ? service.from('applications').select('job_id, candidate_id').in('job_id', activeJobIds)
        : Promise.resolve({ data: [] }),
      service.from('invitations').select('job_id, candidate_id, status').eq('institution_id', institution.id),
      service.from('match_dismissals').select('candidate_id, job_id').eq('institution_id', institution.id),
    ])

  // applications + dismissals + "לא מעוניינת" invitations are hidden completely
  // other invitations still shown (with wasInvited flag)
  const notInterestedInvites = (existingInvites ?? []).filter(
    (i: { status: string }) => i.status === 'לא מעוניינת'
  )
  const otherInvites = (existingInvites ?? []).filter(
    (i: { status: string }) => i.status !== 'לא מעוניינת'
  )
  const skipPairs = new Set([
    ...(existingApps ?? []).map((a: { job_id: string; candidate_id: string }) => `${a.job_id}:${a.candidate_id}`),
    ...(dismissed ?? []).map((d: { job_id: string; candidate_id: string }) => `${d.job_id}:${d.candidate_id}`),
    ...notInterestedInvites.map((i: { job_id: string; candidate_id: string }) => `${i.job_id}:${i.candidate_id}`),
  ])
  const invitedPairs = new Set(
    otherInvites.map((i: { job_id: string; candidate_id: string }) => `${i.job_id}:${i.candidate_id}`)
  )

  const matches: {
    candidateId: string; candidateName: string; candidatePhone: string | null
    candidateCity: string | null; candidateDistrict: string | null
    college: string | null; academicLevel: string | null; specialization: string | null
    availabilityStatus: string; cvUrl: string | null
    jobId: string; jobTitle: string; score: number; reasons: string[]
    wasInvited: boolean
  }[] = []

  for (const job of jobs ?? []) {
    for (const cand of candidates ?? []) {
      if (skipPairs.has(`${job.id}:${cand.id}`)) continue

      let score = 0
      const reasons: string[] = []

      if (cand.district && institution.district && cand.district === institution.district) {
        score += 5; reasons.push(`מחוז: ${cand.district}`)
      }
      const candSpecs = cand.specialization?.split(',').map((s: string) => s.trim()) ?? []
      if (cand.specialization && job.specialization &&
          (cand.specialization === job.specialization || candSpecs.includes(job.specialization))) {
        score += 4; reasons.push(`התמחות: ${job.specialization}`)
      } else if (!job.specialization || cand.specialization === 'שניהם') {
        score += 2
      }
      if (cand.city && institution.city && cand.city === institution.city) {
        score += 2; reasons.push(`עיר: ${cand.city}`)
      } else if (cand.city && job.city && cand.city === job.city) {
        score += 2; reasons.push(`עיר: ${cand.city}`)
      }
      if (cand.work_cities && job.city && (cand.work_cities as string[]).includes(job.city)) {
        score += 3; reasons.push(`עיר עבודה: ${job.city}`)
      }
      // City affinity — nearby communities
      const affinityCity = institution.city ?? job.city
      if (cand.city && affinityCity && inSameCityGroup(cand.city, affinityCity) &&
          !reasons.some(r => r.startsWith('עיר'))) {
        score += 2; reasons.push(`אזור קרוב: ${affinityCity}`)
      }
      if (cand.availability_status === "מחפשת סטאג'") score += 1

      if (score >= 4) {
        const prof = cand.profiles as unknown as { full_name: string | null; phone: string | null } | null
        matches.push({
          candidateId: cand.id,
          candidateName: prof?.full_name ?? '—',
          candidatePhone: prof?.phone ?? null,
          candidateCity: cand.city,
          candidateDistrict: cand.district,
          college: null,
          academicLevel: cand.academic_level,
          specialization: cand.specialization,
          availabilityStatus: cand.availability_status,
          cvUrl: cand.cv_url,
          jobId: job.id,
          jobTitle: job.title,
          score,
          reasons,
          wasInvited: invitedPairs.has(`${job.id}:${cand.id}`),
        })
      }
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return NextResponse.json(matches.slice(0, 60))
}
