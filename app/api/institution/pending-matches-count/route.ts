import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions')
    .select('id, city, district, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) return NextResponse.json({ count: 0 })

  const activeJobIds = (
    await service.from('jobs').select('id').eq('institution_id', institution.id).eq('status', 'פעילה')
  ).data?.map(j => j.id) ?? []

  const [{ data: jobs }, { data: candidates }, { data: apps }, { data: invites }, { data: dismissed }] =
    await Promise.all([
      service.from('jobs').select('id, specialization, city').eq('institution_id', institution.id).eq('status', 'פעילה'),
      service.from('candidates')
        .select('id, district, city, work_cities, specialization, availability_status')
        .neq('availability_status', 'משובצת')
        .neq('availability_status', 'לא פעילה')
        .limit(200),
      activeJobIds.length > 0
        ? service.from('applications').select('job_id, candidate_id').in('job_id', activeJobIds)
        : Promise.resolve({ data: [] }),
      service.from('invitations').select('job_id, candidate_id').eq('institution_id', institution.id),
      service.from('match_dismissals').select('job_id, candidate_id').eq('institution_id', institution.id),
    ])

  const usedPairs = new Set([
    ...(apps ?? []).map((a: { job_id: string; candidate_id: string }) => `${a.job_id}:${a.candidate_id}`),
    ...(invites ?? []).map((i: { job_id: string; candidate_id: string }) => `${i.job_id}:${i.candidate_id}`),
    ...(dismissed ?? []).map((d: { job_id: string; candidate_id: string }) => `${d.job_id}:${d.candidate_id}`),
  ])

  let count = 0

  for (const job of jobs ?? []) {
    for (const cand of (candidates ?? []) as {
      id: string; district: string | null; city: string | null
      work_cities: string[] | null; specialization: string | null; availability_status: string | null
    }[]) {
      if (usedPairs.has(`${job.id}:${cand.id}`)) continue
      let score = 0
      if (cand.district && institution.district && cand.district === institution.district) score += 5
      const specs: string[] = cand.specialization?.split(',').map((s: string) => s.trim()) ?? []
      if (cand.specialization && job.specialization &&
          (cand.specialization === job.specialization || specs.includes(job.specialization))) {
        score += 4
      } else if (!job.specialization || cand.specialization === 'שניהם') {
        score += 2
      }
      if (cand.city && institution.city && cand.city === institution.city) score += 2
      else if (cand.city && job.city && cand.city === job.city) score += 2
      if (cand.work_cities && job.city && cand.work_cities.includes(job.city)) score += 3
      if (cand.availability_status === "מחפשת סטאג'") score += 1
      if (score >= 4) count++
    }
  }

  return NextResponse.json({ count })
}
