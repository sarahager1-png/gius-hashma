import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'
import { inSameCityGroup } from '@/lib/city-affinity'

type CandRow = {
  id: string
  profile_id: string
  specialization: string | null
  district: string | null
  city: string | null
  work_cities: string[] | null
  level: string | null
  availability_status: string | null
  whatsapp_preference: boolean | null
  profiles: { full_name: string | null; phone: string | null } | null
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
    institution_name: string
    city: string | null
    profile_id: string
    whatsapp_preference: boolean | null
    profiles: { phone: string | null } | null
  }
}

function computeScore(cand: CandRow, job: JobRow): number {
  let score = 0
  const jobCity = job.institutions.city ?? job.city
  if (cand.city && jobCity && cand.city === jobCity) score += 5
  if (cand.work_cities && jobCity && cand.work_cities.includes(jobCity)) score += 5
  if (cand.district && job.district && cand.district === job.district) score += 3
  if (cand.city && jobCity && inSameCityGroup(cand.city, jobCity)) score += 2
  if (cand.specialization && job.specialization) {
    const cSpecs = cand.specialization.split(',').map(s => s.trim().toLowerCase())
    const jSpec = job.specialization.trim().toLowerCase()
    if (jSpec === 'שניהם' || cSpecs.some(s => jSpec.includes(s) || s.includes(jSpec))) score += 5
  }
  if (cand.level && job.level && cand.level === job.level) score += 2
  if (cand.availability_status && ['פנויה', 'פנוי', 'פנוי/ה'].includes(cand.availability_status)) score += 1
  return score
}

// Vercel Cron — runs every Sunday and Wednesday at 09:00 Israel time (06:00 UTC)
// 1. Sends ONE consolidated WhatsApp per candidate listing their matching institutions
// 2. Sends ONE WhatsApp per institution about new matching candidates
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
      .select('id, profile_id, specialization, district, city, work_cities, level, availability_status, whatsapp_preference, profiles(full_name, phone)')
      .gte('created_at', sevenDaysAgo)
      .not('availability_status', 'in', '("משובצת","לא פעילה")')
    ,
    service
      .from('jobs')
      .select('id, institution_id, specialization, district, city, level, institutions!inner(id, institution_name, city, profile_id, whatsapp_preference, profiles(phone))')
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
    return NextResponse.json({ ok: true, cand_alerts_sent: 0, inst_alerts_sent: 0 })
  }

  // Build scored pairs grouped by candidate profile_id
  type Pair = { cand: CandRow; job: JobRow; score: number }
  const pairsByCand = new Map<string, Pair[]>()

  for (const cand of candidates as unknown as CandRow[]) {
    for (const job of jobs as unknown as JobRow[]) {
      const score = computeScore(cand, job)
      if (score < 6) continue
      const key = cand.profile_id
      if (!pairsByCand.has(key)) pairsByCand.set(key, [])
      pairsByCand.get(key)!.push({ cand, job, score })
    }
  }

  if (!pairsByCand.size) return NextResponse.json({ ok: true, cand_alerts_sent: 0, inst_alerts_sent: 0 })

  // ── 1. Candidate notifications ────────────────────────────────────────

  const candProfileIds = [...pairsByCand.keys()]
  const { data: existingCandNotifs } = await service
    .from('notifications')
    .select('profile_id, url')
    .eq('type', 'candidate_match_alert')
    .in('profile_id', candProfileIds)

  const notifiedCandSet = new Set(
    (existingCandNotifs ?? []).map((n: { profile_id: string; url: string | null }) =>
      `${n.profile_id}::${n.url ?? ''}`
    )
  )

  let candSent = 0

  for (const [candProfileId, pairs] of pairsByCand) {
    const fresh = pairs.filter(p => {
      const url = `/profile?inst=${p.job.institutions.id}`
      return !notifiedCandSet.has(`${candProfileId}::${url}`)
    })
    if (!fresh.length) continue

    const top5 = fresh.sort((a, b) => b.score - a.score).slice(0, 5)
    const cand = top5[0].cand
    const candPhone = cand.profiles?.phone ?? null
    if (!candPhone) continue

    const seenInst = new Set<string>()
    const uniqueInsts = top5.filter(p => {
      if (seenInst.has(p.job.institutions.id)) return false
      seenInst.add(p.job.institutions.id); return true
    })

    const instLines = uniqueInsts.map((p, i) => {
      const instName = p.job.institutions.institution_name
      const spec = p.job.specialization ?? ''
      const city = p.job.institutions.city ?? p.job.city ?? ''
      return `${i + 1}. *${instName}*\n   ${[spec, city].filter(Boolean).join(' · ')}`
    }).join('\n\n')

    const firstName = cand.profiles?.full_name?.split(' ')[0] ?? ''
    const count = uniqueInsts.length
    const waMessage = [
      `✨ *שלום${firstName ? ` ${firstName}` : ''}!*`,
      `המערכת מצאה עבורך ${count} מוסד${count !== 1 ? 'ות' : ''} מתאימ${count !== 1 ? 'ות' : ''} לפרופיל שלך:`,
      '',
      instLines,
      '',
      `📌 *כיצד לפנות?*`,
      `היכנסי לפרופיל שלך, עברי על ההצעות ולחצי “הגישי מועמדות” ליד המוסד שמעניין אותך — ואנחנו נעביר את הפרטים שלך.`,
      '',
      `${appUrl}/profile`,
    ].join('\n')

    void sendExternal({
      phone: candPhone,
      whatsapp_preference: cand.whatsapp_preference,
      waMessage,
      smsMessage: `נמצאו ${count} מוסדות מתאימים לפרופיל שלך. לפנייה: ${appUrl}/profile`,
    })

    void service.from('notifications').insert(
      uniqueInsts.map(p => ({
        profile_id: candProfileId,
        type: 'candidate_match_alert',
        title: `✨ ${count} מוסדות מתאימים`,
        body: p.job.institutions.institution_name,
        related_id: p.job.institution_id,
        url: `/profile?inst=${p.job.institutions.id}`,
      }))
    )

    candSent++
  }

  // ── 2. Institution notifications ───────────────────────────────────
  // Group all qualifying pairs by institution

  type InstInfo = {
    profileId: string
    name: string
    phone: string | null
    waPref: boolean | null
    candSet: Set<string>
  }
  const instInfoMap = new Map<string, InstInfo>()

  for (const [candProfileId, pairs] of pairsByCand) {
    for (const p of pairs) {
      const inst = p.job.institutions
      if (!instInfoMap.has(inst.id)) {
        instInfoMap.set(inst.id, {
          profileId: inst.profile_id,
          name: inst.institution_name,
          phone: inst.profiles?.phone ?? null,
          waPref: inst.whatsapp_preference,
          candSet: new Set(),
        })
      }
      instInfoMap.get(inst.id)!.candSet.add(candProfileId)
    }
  }

  // Load existing institution_match_alert notifications for dedup
  const instProfileIdsList = [...instInfoMap.values()].map(e => e.profileId).filter(Boolean)
  let notifiedInstSet = new Set<string>()
  if (instProfileIdsList.length > 0) {
    const { data: existingInstNotifs } = await service
      .from('notifications')
      .select('profile_id, url')
      .eq('type', 'institution_match_alert')
      .in('profile_id', instProfileIdsList)
    notifiedInstSet = new Set(
      (existingInstNotifs ?? []).map((n: { profile_id: string; url: string | null }) =>
        `${n.profile_id}::${n.url ?? ''}`
      )
    )
  }

  let instSent = 0

  for (const [, entry] of instInfoMap) {
    const freshCandIds: string[] = []
    for (const candProfileId of entry.candSet) {
      const key = `${entry.profileId}::/institution/matches?cand=${candProfileId}`
      if (!notifiedInstSet.has(key)) freshCandIds.push(candProfileId)
    }
    if (!freshCandIds.length || !entry.phone) continue

    const count = freshCandIds.length
    const waMessage = [
      `✨ *שלום!*`,
      `נמצאו ${count} מועמד${count !== 1 ? 'ות' : 'ת'} חדש${count !== 1 ? 'ות' : 'ה'} שמתאימ${count !== 1 ? 'ות' : 'ה'} למשרות ${entry.name}.`,
      ``,
      `הן קיבלו הודעה ועשויות לפנות אליך בקרוב — כדאי להכיר אותן מראש כדי שתוכלי להגיב מהר:`,
      `${appUrl}/institution/matches`,
    ].join('\n')

    void sendExternal({
      phone: entry.phone,
      whatsapp_preference: entry.waPref,
      waMessage,
      smsMessage: `נמצאו ${count} מועמדות מתאימות למשרותך: ${appUrl}/institution/matches`,
    })

    void service.from('notifications').insert(
      freshCandIds.map(candProfileId => ({
        profile_id: entry.profileId,
        type: 'institution_match_alert',
        title: `✨ ${count} מועמדות חדשות`,
        body: entry.name,
        url: `/institution/matches?cand=${candProfileId}`,
      }))
    )

    instSent++
  }

  return NextResponse.json({ ok: true, cand_alerts_sent: candSent, inst_alerts_sent: instSent })
}
