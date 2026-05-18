import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron — runs every Monday at 08:00 Israel time (06:00 UTC)
// Sends weekly alerts to institutions about new candidates registered in the last 7 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

  const { data: candidates, error } = await service
    .from('candidates')
    .select('id, profile_id, specialization, district, city, profiles(full_name, phone)')
    .gte('created_at', sevenDaysAgo)
    .not('availability_status', 'in', '("משובצת","לא פעילה")')

  if (error) {
    console.error('[CRON] candidate-alerts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSent = 0

  for (const cand of candidates ?? []) {
    const candidate = cand as unknown as {
      id: string
      profile_id: string
      specialization: string | null
      district: string | null
      city: string | null
      profiles: { full_name: string | null; phone: string | null }
    }

    const filters: string[] = []
    if (candidate.specialization) filters.push(`specialization.eq.${candidate.specialization}`)
    if (candidate.district)       filters.push(`district.eq.${candidate.district}`)
    if (candidate.city)           filters.push(`city.eq.${candidate.city}`)
    if (!filters.length) continue

    const { data: jobs } = await service
      .from('jobs')
      .select('institution_id, institutions(profile_id, institution_name, whatsapp_preference, profiles(phone))')
      .eq('status', 'פעילה')
      .or(filters.join(','))
      .limit(50)

    if (!jobs?.length) continue

    // fetch institutions already notified about this candidate
    const { data: existingNotifs } = await service
      .from('notifications')
      .select('profile_id')
      .eq('related_id', candidate.id)
      .eq('type', 'new_match')

    const alreadyNotified = new Set((existingNotifs ?? []).map(n => n.profile_id))

    const seenInst = new Set<string>()
    const candidateName = candidate.profiles?.full_name ?? 'מועמדת חדשה'
    const desc = [candidateName, candidate.specialization, candidate.city].filter(Boolean).join(' · ')

    for (const job of jobs) {
      const inst = job.institutions as unknown as {
        profile_id: string
        institution_name: string
        whatsapp_preference: boolean | null
        profiles: { phone: string | null } | null
      } | null
      if (!inst || seenInst.has(inst.profile_id)) continue
      if (alreadyNotified.has(inst.profile_id)) continue
      seenInst.add(inst.profile_id)

      void service.from('notifications').insert({
        profile_id: inst.profile_id,
        type: 'new_match',
        title: '✨ מועמדת חדשה מתאימה',
        body: desc,
        related_id: candidate.id,
      })

      void sendExternal({
        phone: inst.profiles?.phone ?? null,
        whatsapp_preference: inst.whatsapp_preference,
        waMessage:  `✨ מועמדת חדשה שעשויה להתאים למשרה שלכם:\n${desc}\nלצפייה: ${appUrl}/candidates/${candidate.id}`,
        smsMessage: `✨ מועמדת חדשה מתאימה: ${desc}. לצפייה: ${appUrl}/candidates/${candidate.id}`,
      })

      totalSent++
    }
  }

  return NextResponse.json({ ok: true, alerts_sent: totalSent })
}
