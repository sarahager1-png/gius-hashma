import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendInterviewReminderEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'

// Vercel Cron Job — runs daily at 08:00 Israel time (05:00 UTC)
// Sends email + SMS reminders for interviews scheduled in the next 24 hours
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // interviews scheduled between 24 and 25 hours from now (1-hour window to avoid duplicates)
  const { data: interviews, error } = await service
    .from('interviews')
    .select(`
      id,
      scheduled_at,
      location,
      applications(
        candidate_id,
        jobs(title, institutions(institution_name)),
        candidates(profile_id, profiles(full_name, phone))
      )
    `)
    .gte('scheduled_at', in24h.toISOString())
    .lt('scheduled_at', in25h.toISOString())

  if (error) {
    console.error('[CRON] interview-reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0

  for (const interview of interviews ?? []) {
    const app = interview.applications as unknown as {
      candidates: { profile_id: string; profiles: { full_name: string | null; phone: string | null } }
      jobs: { title: string; institutions: { institution_name: string } }
    } | null

    if (!app) continue

    const candidateProfileId = app.candidates?.profile_id
    const candidateName = app.candidates?.profiles?.full_name ?? 'מועמדת'
    const candidatePhone = app.candidates?.profiles?.phone
    const jobTitle = app.jobs?.title ?? ''
    const institutionName = app.jobs?.institutions?.institution_name ?? ''

    if (candidateProfileId) {
      try {
        await sendInterviewReminderEmail({
          candidateProfileId,
          candidateName,
          jobTitle,
          institutionName,
          scheduledAt: interview.scheduled_at,
          location: interview.location,
        })
      } catch (err) {
        console.error('[CRON] interview-reminders email failed:', candidateProfileId, err)
      }
    }

    if (candidatePhone) {
      try {
        const dt = new Date(interview.scheduled_at).toLocaleString('he-IL', {
          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
        })
        await sendSms(candidatePhone, `תזכורת: ראיון מחר! ${institutionName} · "${jobTitle}". תאריך: ${dt}${interview.location ? '. מיקום: ' + interview.location : ''}. בהצלחה! 🌟`)
      } catch (err) {
        console.error('[CRON] interview-reminders SMS failed:', candidatePhone, err)
      }
    }

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
