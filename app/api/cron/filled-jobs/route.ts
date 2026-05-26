import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

// Vercel Cron — runs every Sunday at 09:20 Israel time (07:20 UTC)
// Notifies institutions and candidates about jobs that were filled in the last 7 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: filledJobs, error } = await service
    .from('jobs')
    .select('id, title, institutions(profile_id, institution_name, phone, whatsapp_preference)')
    .eq('status', 'אוישה')
    .gte('updated_at', sevenDaysAgo)

  if (error) {
    console.error('[CRON] filled-jobs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let instSent = 0
  let candSent = 0

  for (const job of filledJobs ?? []) {
    const inst = job.institutions as unknown as {
      profile_id: string | null
      institution_name: string
      phone: string | null
      whatsapp_preference: boolean | null
    } | null

    // ── Notify institution ────────────────────────────────────────────────────
    if (inst?.profile_id && inst.phone) {
      const { data: alreadySent } = await service
        .from('notifications')
        .select('id')
        .eq('profile_id', inst.profile_id)
        .eq('type', 'job_filled_ext')
        .eq('related_id', job.id)
        .limit(1)

      if (!alreadySent?.length) {
        const instMsg =
          `📋 המשרה "${job.title}" אוישה בהצלחה השבוע 🎉\n` +
          `אם ברצונכם לפרסם משרה נוספת, נשמח לעזור:\n` +
          `${APP_URL}/institution/jobs`

        void sendExternal({ phone: inst.phone, whatsapp_preference: inst.whatsapp_preference, waMessage: instMsg, smsMessage: instMsg })

        await service.from('notifications').insert({
          profile_id: inst.profile_id,
          type: 'job_filled_ext',
          title: `המשרה "${job.title}" אוישה`,
          body: 'נשלחה הודעה שבועית',
          related_id: job.id,
        })
        instSent++
      }
    }

    // ── Notify candidates with rejected applications on this job ──────────────
    const { data: rejectedApps } = await service
      .from('applications')
      .select('id, candidates(profile_id, whatsapp_preference, profiles(full_name, phone))')
      .eq('job_id', job.id)
      .eq('status', 'נדחתה')

    for (const app of rejectedApps ?? []) {
      type CandFields = {
        profile_id: string | null
        whatsapp_preference: boolean | null
        profiles: { full_name: string | null; phone: string | null } | null
      }
      const cand = app.candidates as unknown as CandFields | null
      if (!cand?.profile_id || !cand.profiles?.phone) continue

      const { data: alreadySent } = await service
        .from('notifications')
        .select('id')
        .eq('profile_id', cand.profile_id)
        .eq('type', 'job_filled_ext_cand')
        .eq('related_id', job.id)
        .limit(1)

      if (alreadySent?.length) continue

      const firstName = (cand.profiles.full_name ?? '').split(' ')[0]
      const instSuffix = inst?.institution_name ? ` ב${inst.institution_name}` : ''
      const candMsg =
        `שלום ${firstName} 👋\n` +
        `המשרה "${job.title}"${instSuffix} נסגרה השבוע לאחר שאוישה.\n` +
        `ממשיכים לחפש — יש עוד משרות מתאימות:\n` +
        `${APP_URL}/jobs`

      void sendExternal({ phone: cand.profiles.phone, whatsapp_preference: cand.whatsapp_preference, waMessage: candMsg, smsMessage: candMsg })

      await service.from('notifications').insert({
        profile_id: cand.profile_id,
        type: 'job_filled_ext_cand',
        title: `המשרה "${job.title}" נסגרה`,
        body: 'נשלחה הודעה שבועית',
        related_id: job.id,
      })
      candSent++
    }
  }

  return NextResponse.json({ ok: true, inst_sent: instSent, cand_sent: candSent })
}
