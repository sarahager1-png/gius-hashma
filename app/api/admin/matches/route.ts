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
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()

  // Fetch active jobs with institution data
  const { data: jobs } = await service
    .from('jobs')
    .select('id, title, specialization, city, institution_id, institutions!inner(id, institution_name, city, district, is_approved)')
    .eq('status', 'פעילה')
    .limit(50)

  // Fetch available candidates
  const { data: candidates } = await service
    .from('candidates')
    .select('id, district, city, college, specialization, academic_level, availability_status, cv_url, profiles(full_name, phone)')
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

    for (const cand of candidates ?? []) {
      if (appliedPairs.has(`${job.id}:${cand.id}`)) continue

      const prof = cand.profiles as unknown as { full_name: string | null; phone: string | null } | null
      let score = 0
      const reasons: string[] = []

      // District match (highest priority)
      if (cand.district && inst.district && cand.district === inst.district) {
        score += 5
        reasons.push(`מחוז: ${cand.district}`)
      }

      // Specialization match
      if (cand.specialization && job.specialization && cand.specialization === job.specialization) {
        score += 4
        reasons.push(`התמחות: ${cand.specialization}`)
      } else if (job.specialization === null || cand.specialization === 'שניהם') {
        score += 2
      }

      // City match
      if (cand.city && inst.city && cand.city === inst.city) {
        score += 2
        reasons.push(`עיר: ${cand.city}`)
      } else if (cand.city && job.city && cand.city === job.city) {
        score += 2
        reasons.push(`עיר: ${cand.city}`)
      }

      // Availability bonus
      if (cand.availability_status === "מחפשת סטאג'") score += 1

      if (score >= 4) {
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
          institutionDistrict: inst.district,
          institutionCity: inst.city,
          score,
          reasons,
        })
      }
    }
  }

  // Sort by score desc, limit to top 50
  matches.sort((a, b) => b.score - a.score)
  return NextResponse.json(matches.slice(0, 60))
}
