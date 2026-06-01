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
    .select('id, title, city, specialization, institution_id, institutions(institution_name)')
    .eq('status', 'פעילה')
    .gte('created_at', sevenDaysAgo)

  if (error) {
    console.error('[CRON] job-alerts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSent = 0
  // Track phones that already received the relevance question this run
  const askedRelevance = new Set<string>()
  const sessionExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  for (const job of jobs ?? []) {
    const institutionName = (job.institutions as unknown as { institution_name: string } | null)?.institution_name ?? ''
    const city = job.city ?? ''

    const { data: allCandidates } = await service
      .from('candidates')
      .select('profile_id, whatsapp_preference, specialization, profiles(full_name, phone)')
      .not('availability_status', 'in', '("משובצת","לא פעילה")')
      .limit(200)

    // Filter by specialization — candidates may store multiple values as comma-separated string
    const candidates = (allCandidates ?? []).filter(c => {
      if (!job.specialization || job.specialization === 'שניהם') return true
      const specs = (c.specialization as string | null)?.split(',').map((s: string) => s.trim()) ?? []
      return specs.includes(job.specialization) || specs.includes('שניהם')
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

        // First contact this week → prepend relevance question + create session
        if (!askedRelevance.has(phone)) {
          askedRelevance.add(phone)
          const { data: existingSession } = await service
            .from('wa_sessions')
            .select('id')
            .eq('phone', phone)
            .eq('session_type', 'relevance_check')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

          if (!existingSession) {
            const relevanceQ = `שלום ${name.split(' ')[0]} 👋\nעדיין מחפשת עבודה?\nענו *כן* להמשך קבלת עדכונים, או *לא* להשהיה זמנית.\n\n`
            void sendExternal({ phone, whatsapp_preference: candidate.whatsapp_preference, waMessage: relevanceQ + jobLine, smsMessage: `עדיין מחפשת עבודה? ענו כן/לא. ${jobSms}` })
            await service.from('wa_sessions').insert({
              phone,
              session_type: 'relevance_check',
              state: 'awaiting_reply',
              data: { profile_id: candidate.profile_id, user_type: 'candidate' },
              expires_at: sessionExpiry,
            })
          } else {
            void sendExternal({ phone, whatsapp_preference: candidate.whatsapp_preference, waMessage: jobLine, smsMessage: jobSms })
          }
        } else {
          void sendExternal({ phone, whatsapp_preference: candidate.whatsapp_preference, waMessage: jobLine, smsMessage: jobSms })
        }
      }

      totalSent++
    }
  }

  return NextResponse.json({ ok: true, alerts_sent: totalSent })
}
