import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

export const maxDuration = 300

// Vercel Cron — runs every Sunday at 08:50 Israel time (05:50 UTC)
// Asks every active candidate whether her registration is still relevant.
// Reply flows through the WhatsApp webhook (session_type 'relevance_check').
// No reply by Tuesday night → relevance-enforce cron deactivates her.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: candidates, error } = await service
    .from('candidates')
    .select('id, profile_id, whatsapp_preference, profiles(full_name, phone)')
    .not('availability_status', 'in', '("משובצת","לא פעילה")')

  if (error) {
    console.error('[CRON] candidate-relevance error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!candidates?.length) return NextResponse.json({ ok: true, asked: 0 })

  // pending applications per candidate — mentioned in the message
  const candidateIds = candidates.map(c => c.id)
  const { data: pendingApps } = await service
    .from('applications')
    .select('candidate_id')
    .in('candidate_id', candidateIds)
    .in('status', ['ממתינה', 'נצפתה'])

  const pendingCount = new Map<string, number>()
  for (const a of pendingApps ?? []) {
    pendingCount.set(a.candidate_id, (pendingCount.get(a.candidate_id) ?? 0) + 1)
  }

  // deadline: replies accepted until Wednesday 08:30 Israel (05:30 UTC);
  // the message says "עד יום שלישי" and enforcement runs Wednesday morning.
  const now = new Date()
  let addDays = (3 - now.getUTCDay() + 7) % 7 // 3 = Wednesday
  if (addDays === 0) addDays = 7
  const expiresAt = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + addDays, 5, 30,
  )).toISOString()

  let asked = 0
  let skipped = 0

  for (const c of candidates) {
    const prof = c.profiles as unknown as { full_name: string | null; phone: string | null } | null
    const phone = prof?.phone
    if (!phone) { skipped++; continue }

    // don't stack a second open relevance session on the same phone (either format)
    const intlFormat = phone.replace(/\D/g, '').replace(/^0/, '972')
    const { data: existingSession } = await service
      .from('wa_sessions')
      .select('id')
      .or(`phone.eq.${phone},phone.eq.${intlFormat}`)
      .eq('session_type', 'relevance_check')
      .gt('expires_at', now.toISOString())
      .limit(1)
      .maybeSingle()
    if (existingSession) { skipped++; continue }

    const firstName = (prof?.full_name ?? 'מועמדת יקרה').split(' ')[0]
    const pending = pendingCount.get(c.id) ?? 0
    const pendingLine = pending > 0
      ? (pending === 1 ? `יש לך הגשה אחת שממתינה למענה 🤞\n` : `יש לך ${pending} הגשות שממתינות למענה 🤞\n`)
      : ''

    const waMessage =
      `שבוע טוב ${firstName}! 🌷\n\n` +
      `רצינו לוודא שאנחנו מעודכנות — *האם את עדיין מחפשת משרה דרך "השביל"?*\n` +
      pendingLine +
      `\nעני לנו כאן:\n` +
      `*1* — כן, עדיין רלוונטי ✅\n` +
      `*2* — לא, אפשר להסיר אותי\n\n` +
      `💡 אם לא נקבל תשובה עד יום שלישי — נסיר אותך זמנית מהרשימה הפעילה (תמיד אפשר לחזור!).\n\n` +
      `בברכה 💜\n*השביל — רשת חינוך חב"ד*`

    await service.from('wa_sessions').insert({
      phone: intlFormat,
      session_type: 'relevance_check',
      state: 'awaiting_reply',
      data: { profile_id: c.profile_id, user_type: 'candidate', enforce_deadline: 'true' },
      expires_at: expiresAt,
    })

    await sendExternal({
      phone,
      whatsapp_preference: c.whatsapp_preference,
      waMessage,
      smsMessage: `שבוע טוב ${firstName}! עדיין מחפשת משרה דרך השביל? עני 1=כן 2=להסרה. ללא תשובה עד יום שלישי נסיר אותך זמנית מהרשימה.`,
    }).catch(err => console.error('[CRON] candidate-relevance send failed:', phone, err))

    asked++
    await new Promise(r => setTimeout(r, 400))
  }

  return NextResponse.json({ ok: true, asked, skipped })
}
