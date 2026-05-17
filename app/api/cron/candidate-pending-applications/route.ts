import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

// Vercel Cron — daily at 09:00 Israel time (06:00 UTC)
// Notifies candidates whose applications have been pending for 5+ days with no institution response
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  // Applications pending for 5+ days — get candidate profile
  const { data: apps, error } = await service
    .from('applications')
    .select('id, job_id, jobs(title, institutions(institution_name)), candidates(profile_id, profiles(full_name, phone, whatsapp_preference))')
    .eq('status', 'ממתינה')
    .lt('applied_at', cutoff)

  if (error) {
    console.error('[CRON] candidate-pending-applications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let notified = 0
  for (const app of apps ?? []) {
    type CandFields = { profile_id: string | null; profiles: { full_name: string | null; phone: string | null; whatsapp_preference?: boolean | null } | null }
    const cand = app.candidates as unknown as CandFields | null
    const candidateProfileId = cand?.profile_id
    if (!candidateProfileId) continue

    // dedup — only once per application
    const { data: existing } = await service
      .from('notifications')
      .select('id')
      .eq('profile_id', candidateProfileId)
      .eq('type', 'candidate_pending_reminder')
      .eq('related_id', app.id)
      .limit(1)
    if (existing?.length) continue

    const jobTitle = (app.jobs as unknown as { title: string } | null)?.title ?? ''
    const institutionName = (app.jobs as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''

    await service.from('notifications').insert({
      profile_id: candidateProfileId,
      type: 'candidate_pending_reminder',
      title: 'הגשתך עדיין בטיפול',
      body: `הגשתך למשרת "${jobTitle}"${institutionName ? ' ב' + institutionName : ''} ממתינה לתגובת המוסד. נעדכן אותך ברגע שיהיה עדכון.`,
      related_id: app.id,
    })

    const phone = cand?.profiles?.phone
    if (phone) {
      void sendSms(phone, `שלום ${cand?.profiles?.full_name ?? ''}! הגשתך למשרת "${jobTitle}"${institutionName ? ' ב' + institutionName : ''} עדיין בטיפול. נעדכן אותך ברגע שיהיה עדכון 🙏`).catch(() => null)
    }

    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
