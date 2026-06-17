import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron — every Sunday 06:40 Israel time.
// Sends the network manager a weekly pipeline snapshot: how many candidates sit
// at each recruitment stage, with a one-click link to the live /admin/pipeline page.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = Date.now()
  const weekAgoIso = new Date(now - 7 * 86400_000).toISOString()

  // pull lightweight application rows + interviews to derive each candidate's current stage
  const { data: apps } = await service
    .from('applications')
    .select('id, status, updated_at')

  const rows = apps ?? []
  const interviewed = new Set<string>()
  if (rows.length) {
    const { data: ivs } = await service
      .from('interviews')
      .select('application_id')
      .in('application_id', rows.map(r => r.id))
    for (const iv of ivs ?? []) interviewed.add(iv.application_id)
  }

  let pending = 0, viewed = 0, interview = 0, placedWeek = 0, rejectedWeek = 0
  for (const r of rows) {
    const hasInterview = interviewed.has(r.id)
    const recent = r.updated_at ? r.updated_at >= weekAgoIso : false
    if (r.status === 'התקבלה') { if (recent) placedWeek++ }
    else if (r.status === 'נדחתה' || r.status === 'בוטלה') { if (recent) rejectedWeek++ }
    else if (hasInterview) interview++
    else if (r.status === 'נצפתה') viewed++
    else pending++
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://giuus.vercel.app'
  const link = `${appUrl}/admin/pipeline`

  const waMessage =
    `📊 *מסלול מועמדות — סיכום שבועי*\n\n` +
    `⏳ ממתינות לצפייה: ${pending}\n` +
    `👁️ נצפו, לפני ראיון: ${viewed}\n` +
    `🗓️ בשלב ראיון: ${interview}\n` +
    `✅ שובצו השבוע: ${placedWeek}\n` +
    `❌ נסגרו השבוע: ${rejectedWeek}\n\n` +
    `לפירוט מלא — איפה כל מועמדת עומדת:\n${link}`

  // recipients: network manager + system admins
  const { data: managers } = await service
    .from('profiles')
    .select('id, full_name, phone')
    .in('role', ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'])

  let sent = 0
  for (const m of managers ?? []) {
    // in-app notification (always)
    await service.from('notifications').insert({
      profile_id: m.id,
      type: 'pipeline_snapshot',
      title: 'סיכום מסלול מועמדות שבועי',
      body: `ממתינות: ${pending} · לפני ראיון: ${viewed} · בראיון: ${interview} · שובצו השבוע: ${placedWeek}`,
      related_id: null,
      url: '/admin/pipeline',
    })
    // WhatsApp (default channel for managers — profiles has no whatsapp_preference, so null → WA)
    if (m.phone) {
      await sendExternal({ phone: m.phone, whatsapp_preference: null, waMessage, smsMessage: waMessage })
      sent++
    }
  }

  return NextResponse.json({
    ok: true,
    stages: { pending, viewed, interview, placedWeek, rejectedWeek },
    notified: managers?.length ?? 0,
    waSent: sent,
  })
}
