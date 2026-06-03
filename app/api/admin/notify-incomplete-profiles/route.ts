import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // candidates missing city, district, or work_cities
  const { data: candidates } = await service
    .from('candidates')
    .select('profile_id, city, district, work_cities, whatsapp_preference, profiles(full_name, phone)')
    .not('availability_status', 'in', '("משובצת","לא פעילה")')

  const incomplete = (candidates ?? []).filter(c => {
    const cand = c as unknown as {
      city: string | null; district: string | null; work_cities: string[] | null
    }
    const hasCity = !!(cand.city?.trim())
    const hasDistrict = !!(cand.district?.trim())
    const hasWorkCities = (cand.work_cities ?? []).filter(Boolean).length > 0
    return !hasCity || !hasDistrict || !hasWorkCities
  })

  let sent = 0; let skipped = 0

  for (const c of incomplete) {
    const cand = c as unknown as {
      profile_id: string; city: string | null; district: string | null
      work_cities: string[] | null; whatsapp_preference: boolean | null
      profiles: { full_name: string | null; phone: string | null }
    }
    const phone = cand.profiles?.phone
    if (!phone) { skipped++; continue }

    const firstName = (cand.profiles?.full_name ?? '').split(' ')[0] || 'שלום'
    const missing: string[] = []
    if (!cand.city?.trim()) missing.push('עיר מגורים')
    if (!cand.district?.trim()) missing.push('מחוז')
    if (!(cand.work_cities ?? []).filter(Boolean).length) missing.push('ערים לעבודה')

    const msg =
      `שלום ${firstName} 👋\n\n` +
      `כדי שנוכל לשלוח לך משרות שמתאימות לאזורך — נשמח שתשלימי:\n` +
      `${missing.map(m => `• ${m}`).join('\n')}\n\n` +
      `עדכון לוקח דקה בלבד 👇\n` +
      `${APP_URL}/profile\n\n` +
      `תודה! 💙\n*מערכת השביל*`

    const sms = `שלום ${firstName}, עדכני פרטי מיקום בפרופיל כדי לקבל משרות מתאימות: ${APP_URL}/profile`

    void sendExternal({ phone, whatsapp_preference: cand.whatsapp_preference, waMessage: msg, smsMessage: sms })
    sent++

    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ ok: true, sent, skipped, total_incomplete: incomplete.length })
}
