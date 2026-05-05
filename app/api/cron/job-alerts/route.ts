import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendNewJobMatchEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'
import { sendWA } from '@/lib/whatsapp'

// Vercel Cron Job — runs every Sunday at 08:00 Israel time (05:00 UTC)
// Sends weekly job alerts to matching candidates for jobs posted in the last 7 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs, error } = await service
    .from('jobs')
    .select('id, title, city, specialization, institution_id, institutions(institution_name)')
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

    let query = service
      .from('candidates')
      .select('profile_id, profiles(full_name, phone)')
      .not('availability_status', 'in', '("משובצת","לא פעילה")')

    if (job.specialization && job.specialization !== 'שניהם') {
      query = query.in('specialization', [job.specialization, 'שניהם'])
    }

    const { data: candidates } = await query.limit(30)
    if (!candidates?.length) continue

    // skip candidates already notified about this job
    const { data: existingNotifs } = await service
      .from('notifications')
      .select('profile_id')
      .eq('related_id', job.id)
      .eq('type', 'match_suggestion')

    const alreadyNotified = new Set((existingNotifs ?? []).map(n => n.profile_id))

    for (const c of candidates) {
      const candidate = c as unknown as { profile_id: string; profiles: { full_name: string | null; phone: string | null } }
      if (alreadyNotified.has(candidate.profile_id)) continue

      const name = candidate.profiles?.full_name ?? 'מועמדת'
      const phone = candidate.profiles?.phone

      void sendNewJobMatchEmail({
        candidateProfileId: candidate.profile_id,
        candidateName: name,
        jobTitle: job.title,
        institutionName,
        city,
        jobId: job.id,
      })

      if (phone) {
        void sendSms(phone, `✨ משרה מתאימה לך! "${job.title}" ב-${institutionName}${city ? `, ${city}` : ''}. לצפייה: giuus.vercel.app/jobs`)
        void sendWA(phone, `✨ משרה חדשה מתאימה לך!\n*${job.title}* — ${institutionName}${city ? ` · ${city}` : ''}\nלצפייה: giuus.vercel.app/jobs/${job.id}`)
      }

      totalSent++
    }
  }

  return NextResponse.json({ ok: true, alerts_sent: totalSent })
}
