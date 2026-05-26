import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendInterviewReminderEmail } from '@/lib/email'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron Job — runs daily at 08:05 Israel time (06:05 UTC)
// Sends reminders to both candidate and institution for interviews in the next 24 hours
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const now   = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: interviews, error } = await service
    .from('interviews')
    .select(`
      id,
      scheduled_at,
      location,
      applications(
        candidate_id,
        jobs(
          title,
          institutions(institution_name, phone, whatsapp_preference, profile_id)
        ),
        candidates(profile_id, whatsapp_preference, profiles(full_name, phone))
      )
    `)
    .gte('scheduled_at', in24h.toISOString())
    .lt('scheduled_at', in25h.toISOString())

  if (error) {
    console.error('[CRON] interview-reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const interviewIds = (interviews ?? []).map(i => i.id)
  const { data: alreadyReminded } = interviewIds.length
    ? await service
        .from('notifications')
        .select('related_id')
        .eq('type', 'interview_reminder')
        .in('related_id', interviewIds)
    : { data: [] }

  const remindedSet = new Set((alreadyReminded ?? []).map(n => n.related_id))

  let sent = 0

  for (const interview of interviews ?? []) {
    if (remindedSet.has(interview.id)) continue

    const app = interview.applications as unknown as {
      candidates: { profile_id: string; whatsapp_preference: boolean | null; profiles: { full_name: string | null; phone: string | null } }
      jobs: {
        title: string
        institutions: {
          institution_name: string
          phone: string | null
          whatsapp_preference: boolean | null
          profile_id: string | null
        }
      }
    } | null

    if (!app) continue

    const candidateProfileId = app.candidates?.profile_id
    const candidateName      = app.candidates?.profiles?.full_name ?? 'מועמדת'
    const candidatePhone     = app.candidates?.profiles?.phone
    const candidateWaPref    = app.candidates?.whatsapp_preference
    const jobTitle           = app.jobs?.title ?? ''
    const institutionName    = app.jobs?.institutions?.institution_name ?? ''
    const instPhone          = app.jobs?.institutions?.phone ?? null
    const instWaPref         = app.jobs?.institutions?.whatsapp_preference
    const instProfileId      = app.jobs?.institutions?.profile_id ?? null

    const dt = new Date(interview.scheduled_at).toLocaleString('he-IL', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })

    // ── Candidate reminder ──
    if (candidateProfileId) {
      await service.from('notifications').insert({
        profile_id: candidateProfileId,
        type:       'interview_reminder',
        title:      'תזכורת לראיון מחר',
        body:       `ראיון עם ${institutionName} למשרת "${jobTitle}"`,
        related_id: interview.id,
      })

      try {
        await sendInterviewReminderEmail({
          candidateProfileId,
          candidateName,
          jobTitle,
          institutionName,
          scheduledAt: interview.scheduled_at,
          location:    interview.location,
        })
      } catch (err) {
        console.error('[CRON] interview-reminders candidate email failed:', err)
      }

      if (candidatePhone) {
        try {
          const candMsg = `תזכורת: ראיון מחר! ${institutionName} · "${jobTitle}". תאריך: ${dt}${interview.location ? '. מיקום: ' + interview.location : ''}. בהצלחה! 🌟`
          await sendExternal({ phone: candidatePhone, whatsapp_preference: candidateWaPref, waMessage: candMsg, smsMessage: candMsg })
        } catch (err) {
          console.error('[CRON] interview-reminders candidate send failed:', err)
        }
      }
    }

    // ── Institution reminder ──
    if (instProfileId) {
      await service.from('notifications').insert({
        profile_id: instProfileId,
        type:       'interview_reminder_institution',
        title:      `תזכורת: ראיון מחר עם ${candidateName}`,
        body:       `ראיון עם ${candidateName} למשרת "${jobTitle}". תאריך: ${dt}`,
        related_id: interview.id,
      })
    }

    if (instPhone) {
      const msg = `תזכורת לראיון מחר 📅\nמועמדת: ${candidateName}\nמשרה: "${jobTitle}"\nתאריך: ${dt}${interview.location ? '\nמיקום: ' + interview.location : ''}`
      try {
        await sendExternal({ phone: instPhone, whatsapp_preference: instWaPref, waMessage: msg, smsMessage: msg })
      } catch (err) {
        console.error('[CRON] interview-reminders institution msg failed:', err)
      }
    }

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
