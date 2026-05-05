import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendInvitationReminderEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'

// Vercel Cron Job — runs daily at 08:00 Israel time (05:00 UTC)
// 1. Sends reminder for invitations pending exactly 3 days (3-day window)
// 2. Marks invitations pending 7+ days as 'פגה תוקף'
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()

  // ── 1. Reminders: invitations pending for 3–4 days ──────────────────
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const fourDaysAgo  = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)

  const { data: toRemind } = await service
    .from('invitations')
    .select(`
      id,
      scheduled_at,
      jobs(title, institutions(institution_name)),
      candidates(profile_id, profiles(full_name, phone))
    `)
    .eq('status', 'ממתינה')
    .gte('created_at', fourDaysAgo.toISOString())
    .lt('created_at', threeDaysAgo.toISOString())

  let reminded = 0
  for (const inv of toRemind ?? []) {
    const candidate = inv.candidates as unknown as {
      profile_id: string
      profiles: { full_name: string | null; phone: string | null }
    } | null
    const job = inv.jobs as unknown as {
      title: string
      institutions: { institution_name: string }
    } | null

    if (!candidate || !job) continue

    const profileId = candidate.profile_id
    const name = candidate.profiles?.full_name ?? 'מועמדת'
    const phone = candidate.profiles?.phone
    const jobTitle = job.title
    const institutionName = job.institutions?.institution_name ?? ''

    try {
      await sendInvitationReminderEmail({
        candidateProfileId: profileId,
        candidateName: name,
        jobTitle,
        institutionName,
        scheduledAt: inv.scheduled_at,
      })
    } catch (err) {
      console.error('[CRON] invitation-reminders email failed:', profileId, err)
    }

    if (phone) {
      try {
        await sendSms(phone, `תזכורת: הזמנה לראיון מ-${institutionName} למשרת "${jobTitle}" ממתינה לתגובה שלך. היכנסי לדשבורד: giuus.vercel.app`)
      } catch (err) {
        console.error('[CRON] invitation-reminders SMS failed:', phone, err)
      }
    }

    reminded++
  }

  // ── 2. Expire: invitations pending for 7+ days ───────────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const { data: expired, error: expireError } = await service
    .from('invitations')
    .update({ status: 'פגה תוקף' })
    .eq('status', 'ממתינה')
    .lt('created_at', sevenDaysAgo.toISOString())
    .select('id')

  if (expireError) {
    console.error('[CRON] invitation-reminders expire error:', expireError)
  }

  return NextResponse.json({
    ok: true,
    reminded,
    expired: expired?.length ?? 0,
  })
}
