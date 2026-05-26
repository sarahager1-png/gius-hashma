import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron Job — runs daily
// Reminds institutions to update application status 14 days after an interview,
// when the application is still pending (not accepted/rejected).
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString()
  const fifteenDaysAgo  = new Date(now.getTime() - 15 * 86_400_000).toISOString()

  // Find interviews that took place 14–15 days ago
  const { data: interviews, error } = await service
    .from('interviews')
    .select(`
      id,
      scheduled_at,
      applications(
        id,
        status,
        candidates(profiles(full_name)),
        jobs(
          title,
          institutions(institution_name, phone, whatsapp_preference, profile_id)
        )
      )
    `)
    .gte('scheduled_at', fifteenDaysAgo)
    .lt('scheduled_at', fourteenDaysAgo)

  if (error) {
    console.error('[CRON] post-interview-reminder error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!interviews?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Skip already-reminded interviews
  const interviewIds = interviews.map(i => i.id)
  const { data: alreadyReminded } = await service
    .from('notifications')
    .select('related_id')
    .eq('type', 'post_interview_reminder')
    .in('related_id', interviewIds)

  const remindedSet = new Set((alreadyReminded ?? []).map(n => n.related_id))

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  let sent = 0

  for (const interview of interviews) {
    if (remindedSet.has(interview.id)) continue

    const app = interview.applications as unknown as {
      id: string
      status: string
      candidates: { profiles: { full_name: string | null } } | null
      jobs: {
        title: string
        institutions: {
          institution_name: string
          phone: string | null
          whatsapp_preference: boolean | null
          profile_id: string | null
        } | null
      } | null
    } | null

    if (!app) continue

    // Only remind if status is still pending/viewed
    if (!['ממתינה', 'נצפתה'].includes(app.status)) continue

    const inst = app.jobs?.institutions
    if (!inst?.profile_id) continue

    const candidateName   = app.candidates?.profiles?.full_name ?? 'המועמדת'
    const jobTitle        = app.jobs?.title ?? ''
    const institutionName = inst.institution_name
    const instPhone       = inst.phone
    const instWaPref      = inst.whatsapp_preference

    // In-app notification
    await service.from('notifications').insert({
      profile_id: inst.profile_id,
      type:       'post_interview_reminder',
      title:      `האם המשרה עדיין רלוונטית? — ${candidateName}`,
      body:       `ראיינת את ${candidateName} למשרת "${jobTitle}" לפני שבועיים. האם המשרה עדיין פתוחה? נא לעדכן את הסטטוס.`,
      related_id: interview.id,
      url:        `/institution/applications`,
    })

    if (instPhone) {
      const msg = `שלום מרשת השביל 👋\nלפני שבועיים ראיינת את ${candidateName} למשרת "${jobTitle}".\n\nהאם המשרה עדיין רלוונטית?\nאם כן — נא לעדכן אם המועמדת התקבלה או לא:\n${appUrl}/institution/applications\n\nאם המשרה כבר אוישה מחוץ למערכת — נא לסגור אותה שם גם כן.`
      try {
        await sendExternal({ phone: instPhone, whatsapp_preference: instWaPref, waMessage: msg, smsMessage: msg })
      } catch (err) {
        console.error('[CRON] post-interview-reminder msg failed:', inst.profile_id, err)
      }
    }

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
