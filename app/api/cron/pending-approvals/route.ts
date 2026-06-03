import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'

// Runs every morning at 08:00 Israel time (05:00 UTC)
// Sends pending candidate approvals to the admin via WhatsApp
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: setting } = await service
    .from('system_settings').select('value').eq('key', 'admin_approval_phone').single()
  const adminPhone = setting?.value?.trim()
  if (!adminPhone) return NextResponse.json({ error: 'no admin phone configured' }, { status: 500 })

  const { data: pending } = await service
    .from('candidate_requests')
    .select('id, full_name, city, district, specialization, phone')
    .eq('status', 'ממתינה')
    .order('created_at', { ascending: true })
    .limit(20)

  if (!pending?.length) return NextResponse.json({ ok: true, sent: false, reason: 'no pending' })

  const lines = pending.map((r, i) =>
    `${i + 1}. *${r.full_name}* — ${[r.city, r.specialization].filter(Boolean).join(', ')}`
  ).join('\n')

  const msg =
    `📋 *מועמדות ממתינות לאישור* (${pending.length})\n\n` +
    `${lines}\n\n` +
    `לאישור: שלחי *אשר [מספר]*\n` +
    `לדחייה: שלחי *דחה [מספר]* או *דחה [מספר] [סיבה]*\n\n` +
    `לדוגמה: _אשר 1_ או _דחה 2 פרטים חסרים_`

  await sendWA(adminPhone, msg)

  // Store pending list in session so webhook can resolve by number
  await service.from('wa_sessions').upsert({
    phone: adminPhone,
    session_type: 'admin_approvals',
    state: 'awaiting_reply',
    data: { candidates: pending.map((r, i) => ({ index: i + 1, id: r.id, name: r.full_name })) },
    expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'phone' })

  return NextResponse.json({ ok: true, sent: true, count: pending.length })
}
