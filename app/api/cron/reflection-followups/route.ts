// Cron: daily — mark non-responders & re-send follow-up after 3 days
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendToCandidate } from '@/lib/communication'

export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // 1. Mark as 'לא השיב' if still 'ממתין לשיקוף' and reflection was sent 3+ days ago
  const { data: overdue } = await service
    .from('learning_day_reflections')
    .select('id, learning_day_id, candidate_id, learning_days(reflection_sent_at, title)')
    .eq('status', 'ממתין לשיקוף')
    .not('learning_days.reflection_sent_at', 'is', null)

  let marked = 0
  const toFollowUp: typeof overdue = []

  for (const r of overdue ?? []) {
    const day = r.learning_days as unknown as { reflection_sent_at: string | null; title: string } | null
    if (!day?.reflection_sent_at) continue
    const sentAt = new Date(day.reflection_sent_at)
    if (sentAt <= threeDaysAgo) {
      await service
        .from('learning_day_reflections')
        .update({ status: 'לא השיב' })
        .eq('id', r.id)
      marked++
      toFollowUp.push(r)
    }
  }

  // 2. Send a follow-up message to non-responders (once — check not already sent today)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'
  let followUpSent = 0

  for (const r of toFollowUp) {
    const day = r.learning_days as unknown as { title: string } | null
    const { data: candidate } = await service
      .from('candidates')
      .select('profile_id')
      .eq('id', r.candidate_id)
      .single()

    if (!candidate?.profile_id) continue

    await sendToCandidate({
      profileId: candidate.profile_id,
      waText: `שלום,\n\nעדיין לא קיבלנו את השיקוף שלך על יום הלימוד *${day?.title ?? ''}*.\n\nנשמח מאוד שתשלחי אותו: ${appUrl}/reflection/${r.learning_day_id}\n\nתודה 🙏`,
      smsText: `תזכורת: שיקוף יום לימוד ${day?.title ?? ''} עדיין ממתין — ${appUrl}/reflection/${r.learning_day_id}`,
      inAppTitle: `תזכורת: שיקוף יום לימוד ${day?.title ?? ''}`,
      contextType: 'learning_day',
      contextId: r.learning_day_id,
    })
    followUpSent++
  }

  return NextResponse.json({ marked, followUpSent })
}
