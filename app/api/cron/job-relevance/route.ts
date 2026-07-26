import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

export const maxDuration = 300

// Vercel Cron — runs every Sunday at 08:45 Israel time (05:45 UTC)
// Asks each institution whether its open jobs are still relevant.
// Reply flows through the WhatsApp webhook (session_type 'relevance_check',
// user_type 'institution') — replying "לא" lets the principal close jobs.
// An institution is asked at most once every 14 days, about jobs open 14+ days.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs, error } = await service
    .from('jobs')
    .select('id, title, city, created_at, institution_id, institutions(id, institution_name, principal_name, phone, whatsapp_preference, profile_id)')
    .eq('status', 'פעילה')
    .lt('created_at', fourteenDaysAgo)

  if (error) {
    console.error('[CRON] job-relevance error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!jobs?.length) return NextResponse.json({ ok: true, asked: 0 })

  // group open jobs by institution
  type Inst = { name: string; principal: string | null; phone: string | null; waPref: boolean | null; profileId: string | null; jobs: { title: string; city: string | null }[] }
  const byInst = new Map<string, Inst>()
  for (const job of jobs) {
    const inst = job.institutions as unknown as { id: string; institution_name: string; principal_name: string | null; phone: string | null; whatsapp_preference: boolean | null; profile_id: string | null } | null
    if (!inst) continue
    if (!byInst.has(inst.id)) {
      byInst.set(inst.id, { name: inst.institution_name, principal: inst.principal_name, phone: inst.phone, waPref: inst.whatsapp_preference, profileId: inst.profile_id, jobs: [] })
    }
    byInst.get(inst.id)!.jobs.push({ title: job.title, city: job.city })
  }

  let asked = 0
  let skipped = 0

  for (const [instId, inst] of byInst) {
    if (!inst.phone) { skipped++; continue }

    // skip if an open relevance session exists, or one was already created in
    // the last 13 days (either phone format) — ask at most every 14 days
    const intlFormat = inst.phone.replace(/\D/g, '').replace(/^0/, '972')
    const { data: existingSession } = await service
      .from('wa_sessions')
      .select('id')
      .or(`phone.eq.${inst.phone},phone.eq.${intlFormat}`)
      .eq('session_type', 'relevance_check')
      .or(`expires_at.gt.${now.toISOString()},created_at.gte.${new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString()}`)
      .limit(1)
      .maybeSingle()
    if (existingSession) { skipped++; continue }

    const firstName = (inst.principal ?? inst.name).split(' ')[0]
    const jobLines = inst.jobs
      .map((j, i) => `${i + 1}. *${j.title}*${j.city ? ` — ${j.city}` : ''}`)
      .join('\n')

    const waMessage =
      `שבוע טוב ${firstName}! 🌷\n\n` +
      `רצינו לוודא שהכל מעודכן — ${inst.jobs.length === 1 ? 'יש לך משרה פתוחה' : `יש לך ${inst.jobs.length} משרות פתוחות`} במערכת "השביל":\n\n` +
      `${jobLines}\n\n` +
      `*האם ${inst.jobs.length === 1 ? 'המשרה עדיין רלוונטית' : 'המשרות עדיין רלוונטיות'}?*\n` +
      `ענו *כן* — אם עדיין מחפשים 🙂\n` +
      `ענו *לא* — ונעזור לסגור את מה שכבר לא רלוונטי\n\n` +
      `בברכה 💜\n*השביל — רשת חינוך חב"ד*`

    await service.from('wa_sessions').insert({
      phone: intlFormat,
      session_type: 'relevance_check',
      state: 'awaiting_reply',
      data: { profile_id: inst.profileId, institution_id: instId, institution_name: inst.name, user_type: 'institution' },
      expires_at: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    })

    await sendExternal({
      phone: inst.phone,
      whatsapp_preference: inst.waPref,
      waMessage,
      smsMessage: `שבוע טוב! יש לך ${inst.jobs.length} משרות פתוחות בהשביל. עדיין רלוונטיות? ענו כן/לא.`,
    }).catch(err => console.error('[CRON] job-relevance send failed:', inst.phone, err))

    // marker so we don't re-ask within 14 days
    if (inst.profileId) {
      await service.from('notifications').insert({
        profile_id: inst.profileId,
        type: 'job_relevance_ask',
        title: 'בדיקת רלוונטיות משרות',
        body: `נשלחה אליך בדיקה האם ${inst.jobs.length === 1 ? 'המשרה הפתוחה' : `${inst.jobs.length} המשרות הפתוחות`} עדיין רלוונטיות`,
        related_id: instId,
        url: '/institution/jobs',
      })
    }

    asked++
    await new Promise(r => setTimeout(r, 400))
  }

  return NextResponse.json({ ok: true, asked, skipped })
}
