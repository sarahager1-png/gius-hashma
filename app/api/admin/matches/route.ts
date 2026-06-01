import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface ScoredMatch {
  candidateId: string
  candidateName: string
  candidatePhone: string | null
  candidateCity: string | null
  candidateDistrict: string | null
  college: string | null
  academicLevel: string | null
  specialization: string | null
  availabilityStatus: string
  cvUrl: string | null
  jobId: string
  jobTitle: string
  institutionId: string
  institutionName: string
  institutionDistrict: string | null
  institutionCity: string | null
  score: number
  reasons: string[]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()

  // Fetch active jobs with institution data (include job-level district too)
  const { data: jobs } = await service
    .from('jobs')
    .select('id, title, specialization, city, district, job_type, institution_id, institutions!inner(id, institution_name, city, district, is_approved)')
    .eq('status', 'פעילה')
    .limit(50)

  // Fetch available candidates
  const { data: candidates } = await service
    .from('candidates')
    .select('id, district, city, work_cities, college, specialization, academic_level, availability_status, cv_url, profiles(full_name, phone)')
    .neq('availability_status', 'משובצת')
    .neq('availability_status', 'לא פעילה')
    .limit(100)

  // Fetch existing applications to exclude already-applied pairs
  const { data: existingApps } = await service
    .from('applications')
    .select('job_id, candidate_id')

  const appliedPairs = new Set(
    (existingApps ?? []).map(a => `${a.job_id}:${a.candidate_id}`)
  )

  const matches: ScoredMatch[] = []

  for (const job of jobs ?? []) {
    const inst = job.institutions as unknown as {
      id: string; institution_name: string; city: string | null; district: string | null; is_approved: boolean
    }
    if (!inst?.is_approved) continue

    // Effective location of the job: prefer institution fields as ground truth
    const jobDistrict = inst.district ?? (job as unknown as Record<string, unknown>).district as string | null
    const jobCity    = inst.city ?? job.city

    for (const cand of candidates ?? []) {
      if (appliedPairs.has(`${job.id}:${cand.id}`)) continue

      const prof      = cand.profiles as unknown as { full_name: string | null; phone: string | null } | null
      const workCities = (cand.work_cities as string[] | null) ?? []
      let score = 0
      const reasons: string[] = []
      let locationHit = false
      let roleHit     = false

      // ── Location signals ─────────────────────────────────────────────
      const hasWorkCities = workCities.length > 0
      if (jobCity) {
        if (cand.city && cand.city === jobCity) {
          score += 5
          reasons.push(`עיר: ${cand.city}`)
          locationHit = true
        } else if (workCities.includes(jobCity)) {
          score += 5
          reasons.push(`עיר מועדפת: ${jobCity}`)
          locationHit = true
        }
      }
      if (cand.district && jobDistrict && cand.district === jobDistrict) {
        score += 3
        reasons.push(`מחוז: ${cand.district}`)
        // District alone counts as location hit only when the candidate has no preferred-city list.
        // If work_cities is set, the job city must appear in it for a real location hit.
        if (!hasWorkCities) locationHit = true
      }

      // ── Role / specialization signals ────────────────────────────────
      // Candidates may store multiple specializations as a comma-separated string
      const candSpecs = cand.specialization?.split(',').map((s: string) => s.trim()) ?? []
      if (cand.specialization && job.specialization &&
          (cand.specialization === job.specialization || candSpecs.includes(job.specialization))) {
        score += 5
        reasons.push(`התמחות: ${job.specialization}`)
        roleHit = true
      }
      // Academic level ↔ job type: סטאג' candidate → סטאג' job
      const jobType = (job as unknown as Record<string, unknown>).job_type as string | null
      if (jobType === "סטאג'" && cand.academic_level?.includes("סטאג'")) {
        score += 2
        reasons.push(`רמה: ${cand.academic_level}`)
        roleHit = true
      } else if (jobType && jobType !== "סטאג'" && cand.academic_level && !cand.academic_level.includes("סטאג'")) {
        score += 1
        roleHit = true
      }

      // Availability bonus
      if (cand.availability_status === "מחפשת סטאג'") score += 1

      // Require a meaningful signal on BOTH dimensions to avoid generic matches
      if (!locationHit || !roleHit) continue
      if (score < 7) continue

      matches.push({
        candidateId: cand.id,
        candidateName: prof?.full_name ?? '—',
        candidatePhone: prof?.phone ?? null,
        candidateCity: cand.city,
        candidateDistrict: cand.district,
        college: cand.college,
        academicLevel: cand.academic_level,
        specialization: cand.specialization,
        availabilityStatus: cand.availability_status,
        cvUrl: cand.cv_url,
        jobId: job.id,
        jobTitle: job.title,
        institutionId: inst.id,
        institutionName: inst.institution_name,
        institutionDistrict: jobDistrict,
        institutionCity: jobCity,
        score,
        reasons,
      })
    }
  }

  // Sort by score desc, limit to top 60
  matches.sort((a, b) => b.score - a.score)
  return NextResponse.json(matches.slice(0, 60))
}
