import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

type CandRow = {
  id: string
  profile_id: string
  specialization: string | null
  district: string | null
  city: string | null
  work_cities: string[] | null
  level: string | null
  availability_status: string | null
  profiles: { full_name: string | null } | null
}

type JobRow = {
  id: string
  institution_id: string
  specialization: string | null
  district: string | null
  city: string | null
  level: string | null
  institutions: {
    id: string
    profile_id: string
    institution_name: string
    whatsapp_preference: boolean | null
    profiles: { phone: string | null } | null
  }
}

function computeScore(cand: CandRow, job: JobRow): number {
  let score = 0
  if (cand.city && job.city && cand.city === job.city) score += 5
  if (cand.work_cities && job.city && cand.work_cities.includes(job.city)) score += 5
  if (cand.district && job.district && cand.district === job.district) score += 3
  if (cand.specialization && job.specialization) {
    const cSpecs = cand.specialization.split(',').map(s => s.trim().toLowerCase())
    const jSpec = job.specialization.trim().toLowerCase()
    if (jSpec === 'שניהם' || cSpecs.some(s => jSpec.includes(s) || s.includes(jSpec))) score += 5
  }
  if (cand.level && job.level && cand.level === job.level) score += 2
  if (cand.availability_status && ['פנויה', 'פנוי', 'פנוי/ה'].includes(cand.availability_status)) score += 1
  return score
}

// Vercel Cron — runs every Monday at 08:00 Israel time (06:00 UTC)
// Sends job-specific paired match alerts to institutions about new candidates
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  const [{ data: candidates, error: candErr }, { data: jobs, error: jobsErr }] = await Promise.all([
    service
      .from('candidates')
      .select('id, profile_id, specialization, district, city, work_cities, level, availability_status, profiles(full_name)')
      .gte('created_at', sevenDaysAgo)
      .not('availability_status', 'in', '("משובצת","לא פעילה")'),
    service
      .from('jobs')
      .select('id, institution_id, specialization, district, city, level, institutions!inner(id, profile_id, institution_name, whatsapp_preference, profiles(phone))')
      .eq('status', 'פעילה'),
  ])

  if (candErr) {
    console.error('[CRON] candidate-alerts candidates error:', candErr)
    return NextResponse.json({ error: candErr.message }, { status: 500 })
  }
  if (jobsErr) {
    console.error('[CRON] candidate-alerts jobs error:', jobsErr)
    return NextResponse.json({ error: jobsErr.message }, { status: 500 })
  }
  if (!candidates?.length || !jobs?.length) {
    return NextResponse.json({ ok: true, alerts_sent: 0 })
  }

  // Load dismissals to skip pairs the institution already rejected
  const { data: allDismissals } = await service
    .from('match_dismissals')
    .select('institution_id, candidate_id, job_id')

  const dismissedByInst = new Map<string, Set<string>>()
  for (const d of allDismissals ?? []) {
    if (!dismissedByInst.has(d.institution_id)) dismissedByInst.set(d.institution_id, new Set())
    dismissedByInst.get(d.institution_id)!.add(`${d.job_id}:${d.candidate_id}`)
  }

  // Build scored pairs grouped by institution profile_id
  type Pair = { cand: CandRow; job: JobRow; score: number }
  const pairsByInst = new Map<string, Pair[]>()

  for (const cand of candidates as unknown as CandRow[]) {
    for (const job of jobs as unknown as JobRow[]) {
      const score = computeScore(cand, job)
      if (score < 6) continue
      if (dismissedByInst.get(job.institutions.id)?.has(`${job.id}:${cand.id}`)) continue
      const key = job.institutions.profile_id
      if (!pairsByInst.has(key)) pairsByInst.set(key, [])
      pairsByInst.get(key)!.push({ cand, job, score })
    }
  }

  if (!pairsByInst.size) return NextResponse.json({ ok: true, alerts_sent: 0 })

  // Dedup — load existing job_match_alert notifications for these institutions
  const instProfileIds = [...pairsByInst.keys()]
  const { data: existingNotifs } = await service
    .from('notifications')
    .select('profile_id, url')
    .eq('type', 'job_match_alert')
    .in('profile_id', instProfileIds)

  const notifiedSet = new Set(
    (existingNotifs ?? []).map((n: { profile_id: string; url: string | null }) =>
      `${n.profile_id}::${n.url ?? ''}`
    )
  )

  let totalSent = 0

  for (const [instProfileId, pairs] of pairsByInst) {
    const fresh = pairs.filter(p => {
      const url = `/institution/matches?job=${p.job.id}&candidate=${p.cand.id}`
      return !notifiedSet.has(`${instProfileId}::${url}`)
    })
    if (!fresh.length) continue

    const top5 = fresh.sort((a, b) => b.score - a.score).slice(0, 5)
    const inst = top5[0].job.institutions
    const instPhone = inst.profiles?.phone ?? null
    if (!instPhone) continue

    const lines = top5.map((p, i) => {
      const name = p.cand.profiles?.full_name ?? 'מועמדת'
      const spec = p.cand.specialization ?? ''
      const city = p.cand.city ?? ''
      const url = `${appUrl}/institution/matches?job=${p.job.id}&candidate=${p.cand.id}`
      return `${i + 1}. *${name}* → ${spec}\n   ${city} · ציון ${p.score}\n   👉 ${url}`
    }).join('\n\n')

    const waMessage = `✨ *${top5.length} התאמות חדשות למשרות שלכם:*\n\n${lines}\n\nלכל ההתאמות: ${appUrl}/institution/matches`

    void sendExternal({
      phone: instPhone,
      whatsapp_preference: inst.whatsapp_preference,
      waMessage,
      smsMessage: `נמצאו ${top5.length} התאמות חדשות למשרות שלכם. לצפייה: ${appUrl}/institution/matches`,
    })

    void service.from('notifications').insert(
      top5.map(p => ({
        profile_id: instProfileId,
        type: 'job_match_alert',
        title: `✨ ${top5.length} התאמות חדשות`,
        body: `${p.cand.profiles?.full_name ?? 'מועמדת'} → ${p.cand.specialization ?? ''}`,
        related_id: p.cand.id,
        url: `/institution/matches?job=${p.job.id}&candidate=${p.cand.id}`,
      }))
    )

    totalSent++
  }

  return NextResponse.json({ ok: true, alerts_sent: totalSent })
}
