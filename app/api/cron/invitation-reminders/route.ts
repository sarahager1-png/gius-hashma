import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendInvitationReminderEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'

// Vercel Cron Job — runs daily at 08:00 Israel time (05:00 UTC)
// 1. Sends reminder at day 3 (3–4 day window, deduped via notifications)
// 2. Warns candidate at day 6 — "invitation expires tomorrow"
// 3. Marks invitations pending 7+ days as 'פגה תוקף'
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()

  // ── Helper: fetch invitations in a created_at window ─────────────────────
  async function getInvitations(from: Date, to: Date) {
    const { data } = await service
      .from('invitations')
      .select(`
        id, scheduled_at,
        jobs(title, institutions(institution_name)),
        candidates(profile_id, profiles(full_name, phone))
      `)
      .eq('status', 'ממתינה')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
    return data ?? []
  }

  // ── 1. Day-3 reminders (3–4 days old) ────────────────────────────────────
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const fourDaysAgo  = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
  const toRemind = await getInvitations(fourDaysAgo, threeDaysAgo)

  // Deduplication: check which invitations already have a day-3 reminder
  const remindIds = toRemind.map(i => i.id)
  const { data: alreadyReminded } = remindIds.length
    ? await service.from('notifications').select('related_id').eq('type', 'invitation_reminder').in('related_id', remindIds)
    : { data: [] }
  const remindedSet = new Set((alreadyReminded ?? []).map(n => n.related_id))

  let reminded = 0
  for (const inv of toRemind) {
    if (remindedSet.has(inv.id)) continue

    const candidate = inv.candidates as unknown as { profile_id: string; profiles: { full_name: string | null; phone: string | null } } | null
    const job = inv.jobs as unknown as { title: string; institutions: { institution_name: string } } | null
    if (!candidate || !job) continue

    const profileId = candidate.profile_id
    const name = candidate.profiles?.full_name ?? 'מועמדת'
    const phone = candidate.profiles?.phone
    const jobTitle = job.title
    const institutionName = job.institutions?.institution_name ?? ''

    await service.from('notifications').insert({
      profile_id: profileId,
      type: 'invitation_reminder',
      title: `תזכורת: הזמנה לראיון מ-${institutionName}`,
      body: `ההזמנה למשרת "${jobTitle}" ממתינה לתגובתך.`,
      related_id: inv.id,
    })

    try {
      await sendInvitationReminderEmail({ candidateProfileId: profileId, candidateName: name, jobTitle, institutionName, scheduledAt: inv.scheduled_at })
    } catch (err) {
      console.error('[CRON] invitation-reminders day3 email failed:', profileId, err)
    }

    if (phone) {
      try {
        await sendSms(phone, `תזכורת: הזמנה לראיון מ-${institutionName} למשרת "${jobTitle}" ממתינה לתגובה שלך. היכנסי לדשבורד: giuus.vercel.app`)
      } catch (err) {
        console.error('[CRON] invitation-reminders day3 SMS failed:', phone, err)
      }
    }

    reminded++
  }

  // ── 2. Day-6 warning — "expires tomorrow" (6–7 days old) ─────────────────
  const sixDaysAgo  = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const toWarn = await getInvitations(sevenDaysAgo, sixDaysAgo)

  const warnIds = toWarn.map(i => i.id)
  const { data: alreadyWarned } = warnIds.length
    ? await service.from('notifications').select('related_id').eq('type', 'invitation_expiry_warning').in('related_id', warnIds)
    : { data: [] }
  const warnedSet = new Set((alreadyWarned ?? []).map(n => n.related_id))

  let warned = 0
  for (const inv of toWarn) {
    if (warnedSet.has(inv.id)) continue

    const candidate = inv.candidates as unknown as { profile_id: string; profiles: { full_name: string | null; phone: string | null } } | null
    const job = inv.jobs as unknown as { title: string; institutions: { institution_name: string } } | null
    if (!candidate || !job) continue

    const profileId = candidate.profile_id
    const phone = candidate.profiles?.phone
    const jobTitle = job.title
    const institutionName = job.institutions?.institution_name ?? ''

    await service.from('notifications').insert({
      profile_id: profileId,
      type: 'invitation_expiry_warning',
      title: `ההזמנה לראיון מ-${institutionName} תפוג מחר`,
      body: `אם לא תגיבי להזמנה למשרת "${jobTitle}" עד מחר, היא תיסגר אוטומטית.`,
      related_id: inv.id,
    })

    if (phone) {
      try {
        await sendSms(phone, `שימי לב: ההזמנה לראיון מ-${institutionName} למשרת "${jobTitle}" תפוג מחר. להגבת: giuus.vercel.app`)
      } catch (err) {
        console.error('[CRON] invitation-reminders day6 SMS failed:', phone, err)
      }
    }

    warned++
  }

  // ── 3. Expire invitations pending 7+ days ────────────────────────────────
  const { data: expired, error: expireError } = await service
    .from('invitations')
    .update({ status: 'פגה תוקף' })
    .eq('status', 'ממתינה')
    .lt('created_at', sevenDaysAgo.toISOString())
    .select('id')

  if (expireError) {
    console.error('[CRON] invitation-reminders expire error:', expireError)
  }

  return NextResponse.json({ ok: true, reminded, warned, expired: expired?.length ?? 0 })
}
