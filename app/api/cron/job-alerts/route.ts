import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendNewJobMatchEmail } from '@/lib/email'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron Job — runs every Sunday at 08:00 Israel time (05:00 UTC)
// Sends weekly job alerts to matching candidates for jobs posted in the last 7 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs, error } = await service
    .from('jobs')
    .select('id, title, city, district, specialization, institution_id, institutions(institution_name)')
    .eq('status', 'פעילה')
    .gte('created_at', sevenDaysAgo)

  if (error) {
    console.error('[CRON] job-alerts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSent = 0

  for (const job of jobs ?? []) {
    const institutionName = (job.institutions as unknown as { institution_name: string } | null)?.institution_name ?? ''
    const city = job.city ?? ''

    const { data: allCandidates } = await service
      .from('candidates')
      .select('profile_id, whatsapp_preference, specialization, district, city, work_cities, profiles(full_name, phone)')
      .not('availability_status', 'in', '("משובצת","לא פעילה")')
      .limit(200)

    // Filter by specialization AND location
    const jobDistrict = (job as unknown as { district?: string | null }).district ?? null
    const candidates = (allCandidates ?? []).filter(c => {
      const cand = c as unknown as { specialization: string | null; district: string | null; city: string | null; work_cities: string[] | null }

      // specialization match
      if (job.specialization && job.specialization !== 'שניהם' && job.specialization !== 'אחר') {
        const specs = (cand.specialization ?? '').split(',').map((s: string) => s.trim())
        if (!specs.some(s => s === job.specialization || s === 'שניהם')) return false
      }

      // ── Location match (CRITICAL) ─────────────────────────────────────
      // If job has no location → skip
      if (!city && !jobDistrict) return false

      const workCities: string[] = (cand.work_cities ?? []).filter(Boolean)

      // 1. work_cities: candidate explicitly said they'll work in this city (may cross districts)
      if (city && workCities.includes(city)) return true

      // 2. district match: job district matches candidate's home district
      if (jobDistrict && cand.district && cand.district === jobDistrict) return true

      return false
    })
    if (!candidates.length) continue

    // skip candidates already notified about this job
    const { data: existingNotifs } = await service
      .from('notifications')
      .select('profile_id')
      .eq('related_id', job.id)
      .eq('type', 'match_suggestion')

    const alreadyNotified = new Set((existingNotifs ?? []).map(n => n.profile_id))

    for (const c of candidates) {
      const candidate = c as unknown as { profile_id: string; whatsapp_preference: boolean | null; profiles: { full_name: string | null; phone: string | null } }
      if (alreadyNotified.has(candidate.profile_id)) continue

      const name = candidate.profiles?.full_name ?? 'מועמדת'
      const phone = candidate.profiles?.phone

      try {
        await sendNewJobMatchEmail({
          candidateProfileId: candidate.profile_id,
          candidateName: name,
          jobTitle: job.title,
          institutionName,
          city,
          jobId: job.id,
        })
      } catch (err) {
        console.error('[CRON] job-alerts email failed:', candidate.profile_id, err)
      }

      if (phone) {
        const jobLine = `✨ משרה חדשה מתאימה לך!\n*${job.title}* — ${institutionName}${city ? ` · ${city}` : ''}\nלצפייה: giuus.vercel.app/jobs/${job.id}`
        const jobSms  = `✨ משרה מתאימה לך! "${job.title}" ב-${institutionName}${city ? `, ${city}` : ''}. לצפייה: giuus.vercel.app/jobs`

        // Relevance is checked by the weekly candidate-relevance cron — here we just send the match
        void sendExternal({ phone, whatsapp_preference: candidate.whatsapp_preference, waMessage: jobLine, smsMessage: jobSms })
      }

      // record notification so this job is never resent to this candidate — must be awaited
      // (a void fire-and-forget write can be dropped if the invocation ends right after the
      // response is sent, and the next run would then resend the same match indefinitely)
      await service.from('notifications').insert({
        profile_id: candidate.profile_id,
        type: 'match_suggestion',
        title: `✨ משרה מתאימה: ${job.title}`,
        body: `${institutionName}${city ? ` · ${city}` : ''}`,
        related_id: job.id,
      })

      totalSent++
    }
  }

  return NextResponse.json({ ok: true, alerts_sent: totalSent })
}
