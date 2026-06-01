import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

  const [{ data: jobs }, { data: candidates }, { data: existingApps }, { data: existingInvites }] =
    await Promise.all([
      service.from('jobs').select('id, title, specialization, city').eq('institution_id', institution.id).eq('status', 'פעילה'),
      service.from('candidates')
        .select('id, district, city, specialization, academic_level, availability_status, cv_url, profiles(full_name, phone)')
        .neq('availability_status', 'משובצת')
        .neq('availability_status', 'לא פעילה')
        .limit(200),
      service.from('applications').select('job_id, candidate_id').in('job_id',
        (await service.from('jobs').select('id').eq('institution_id', institution.id).eq('status', 'פעילה')).data?.map(j => j.id) ?? []
      ),
      service.from('invitations').select('job_id, candidate_id').eq('institution_id', institution.id),
    ])

  const usedPairs = new Set([
    ...(existingApps ?? []).map(a => `${a.job_id}:${a.candidate_id}`),
    ...(existingInvites ?? []).map(i => `${i.job_id}:${i.candidate_id}`),
  ])

  const matches: {
    candidateId: string; candidateName: string; candidatePhone: string | null
    candidateCity: string | null; candidateDistrict: string | null
    college: string | null; academicLevel: string | null; specialization: string | null
    availabilityStatus: string; cvUrl: string | null
    jobId: string; jobTitle: string; score: number; reasons: string[]
  }[] = []

  for (const job of jobs ?? []) {
    for (const cand of candidates ?? []) {
      if (usedPairs.has(`${job.id}:${cand.id}`)) continue

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
        })
      }
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return NextResponse.json(matches.slice(0, 60))
}
