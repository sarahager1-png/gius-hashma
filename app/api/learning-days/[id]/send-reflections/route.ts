import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendToCandidate } from '@/lib/communication'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Load learning day
  const { data: day } = await service
    .from('learning_days')
    .select('*')
    .eq('id', id)
    .single()

  if (!day) return NextResponse.json({ error: 'Learning day not found' }, { status: 404 })

  // Load attendees with profile info
  const { data: attendees } = await service
    .from('learning_day_attendees')
    .select('candidate_id, candidates(profile_id, profiles(full_name, phone))')
    .eq('learning_day_id', id)
    .eq('attended', true)

  if (!attendees?.length)
    return NextResponse.json({ error: 'אין משתתפות לשליחה' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'
  const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')

  // Create reflection rows (ממתין לשיקוף) and send messages
  let sent = 0
  for (const att of attendees) {
    const cand = att.candidates as unknown as {
      profile_id: string
      profiles: { full_name: string | null; phone: string | null } | null
    } | null

    if (!cand?.profile_id) continue

    // Upsert reflection row
    await service.from('learning_day_reflections').upsert({
      learning_day_id: id,
      candidate_id: att.candidate_id,
      status: 'ממתין לשיקוף',
    }, { onConflict: 'learning_day_id,candidate_id', ignoreDuplicates: false })

    const name = cand.profiles?.full_name ?? 'מועמדת'
    const reflectionLink = `${appUrl}/reflection/${id}`

    await sendToCandidate({
      profileId: cand.profile_id,
      templateKey: 'learning_day_reflection',
      vars: {
        name,
        day_title: day.title,
        reflection_prompt: day.reflection_prompt ?? 'שלחי שיקוף קצר על יום הלימוד',
        reflection_link: reflectionLink,
        deadline,
      },
      inAppTitle: `שיקוף יום לימוד: ${day.title}`,
      inAppBody: day.reflection_prompt ?? 'נשמח לשמוע את חוויתך מיום הלימוד',
      contextType: 'learning_day',
      contextId: id,
      sentBy: user.id,
    })

    sent++
  }

  // Update reflection_sent_at on the day
  await service
    .from('learning_days')
    .update({ reflection_sent_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, sent })
}
