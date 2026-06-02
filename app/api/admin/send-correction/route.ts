import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// One-time correction: apology + relevant jobs per candidate
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  // All active candidates
  const { data: candidates } = await service
    .from('candidates')
    .select('profile_id, specialization, district, city, work_cities, whatsapp_preference, profiles(full_name, phone)')
    .not('availability_status', 'in', '("משובצת","לא פעילה")')

  // All active jobs
  const { data: jobs } = await service
    .from('jobs')
    .select('id, title, city, district, specialization, institutions(institution_name)')
    .eq('status', 'פעילה')

  let sent = 0; let skipped = 0

  for (const c of candidates ?? []) {
    const cand = c as unknown as {
      profile_id: string
      specialization: string | null
      district: string | null
      city: string | null
      work_cities: string[] | null
      whatsapp_preference: boolean | null
      profiles: { full_name: string | null; phone: string | null }
    }

    const phone = cand.profiles?.phone
    if (!phone) { skipped++; continue }

    const firstName = (cand.profiles?.full_name ?? '').split(' ')[0] || 'שלום'
    const candSpecs = (cand.specialization ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
    const workCities: string[] = cand.work_cities ?? []

    // Filter matching jobs
    const matching = (jobs ?? []).filter(j => {
      const job = j as unknown as { id: string; title: string; city: string | null; district: string | null; specialization: string | null; institutions: { institution_name: string } | null }

      // specialization
      if (job.specialization && job.specialization !== 'שניהם' && job.specialization !== 'אחר') {
        if (candSpecs.length && !candSpecs.some(s => s === job.specialization || s === 'שניהם')) return false
      }

      // location
      const jCity = job.city ?? ''
      const jDistrict = job.district ?? ''
      if (jCity || jDistrict) {
        const matchCity = jCity && (cand.city === jCity || workCities.includes(jCity))
        const matchDistrict = jDistrict && cand.district === jDistrict
        if (!matchCity && !matchDistrict) return false
      }

      return true
    })

    if (!matching.length) { skipped++; continue }

    const jobLines = matching.slice(0, 5).map(j => {
      const job = j as unknown as { id: string; title: string; city: string | null; institutions: { institution_name: string } | null }
      const inst = job.institutions?.institution_name ?? ''
      return `• *${job.title}*${inst ? ` — ${inst}` : ''}${job.city ? ` · ${job.city}` : ''}\n  ${appUrl}/jobs/${job.id}`
    }).join('\n')

    const msg =
      `שלום ${firstName} 👋\n\n` +
      `שלחנו לך קודם כמה הודעות על משרות — מתנצלים! הייתה תקלה טכנית.\n\n` +
      `הנה המשרות שבאמת מתאימות לך:\n\n` +
      `${jobLines}\n\n` +
      `בהצלחה! 💙\n*מערכת השביל — רשת חינוך חב"ד*`

    const sms =
      `מצטערים על הודעות קודמות — תקלה טכנית. ` +
      `המשרות המתאימות לך: ${appUrl}/jobs`

    void sendExternal({ phone, whatsapp_preference: cand.whatsapp_preference, waMessage: msg, smsMessage: sms })
    sent++

    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ ok: true, sent, skipped })
}
