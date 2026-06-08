import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

// Vercel Cron — runs daily at 09:15 Israel time (06:15 UTC)
// Sends ONE WhatsApp per institution for applications that have been pending for 3 days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  // Window: 72–96 hours ago (≈3 days, daily cron avoids re-triggering)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const fourDaysAgo  = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()

  const { data: applications, error } = await service
    .from('applications')
    .select('id, job_id, jobs(title, institution_id, institutions(id, institution_name, phone, whatsapp_preference, profile_id)), candidates(profiles(full_name))')
    .eq('status', 'ממתינה')
    .lt('applied_at', threeDaysAgo)
    .gte('applied_at', fourDaysAgo)

  if (error) {
    console.error('[CRON] pending-applications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!applications?.length) return NextResponse.json({ ok: true, notified: 0 })

  // Dedup — skip apps already reminded
  const appIds = applications.map((a: { id: string }) => a.id)
  const { data: alreadySent } = await service
    .from('notifications')
    .select('related_id')
    .eq('type', 'pending_app_reminder')
    .in('related_id', appIds)

  const sentSet = new Set((alreadySent ?? []).map((n: { related_id: string | null }) => n.related_id))
  const fresh = applications.filter((a: { id: string }) => !sentSet.has(a.id))
  if (!fresh.length) return NextResponse.json({ ok: true, notified: 0 })

  // Group by institution
  type AppEntry = { appId: string; candidateName: string; jobTitle: string }
  type InstData = {
    name: string
    phone: string | null
    whatsappPreference: boolean | null
    profileId: string | null
    apps: AppEntry[]
  }

  const byInst = new Map<string, InstData>()

  for (const app of fresh) {
    const job = app.jobs as unknown as {
      title: string
      institution_id: string
      institutions: { id: string; institution_name: string; phone: string | null; whatsapp_preference: boolean | null; profile_id: string | null }
    } | null
    if (!job) continue
    const cand = app.candidates as unknown as { profiles: { full_name: string | null } | null } | null
    const candidateName = cand?.profiles?.full_name ?? 'מועמדת'
    const instId = job.institution_id
    if (!byInst.has(instId)) {
      byInst.set(instId, {
        name: job.institutions.institution_name,
        phone: job.institutions.phone,
        whatsappPreference: job.institutions.whatsapp_preference,
        profileId: job.institutions.profile_id,
        apps: [],
      })
    }
    byInst.get(instId)!.apps.push({ appId: app.id, candidateName, jobTitle: job.title })
  }

  let notified = 0

  for (const inst of byInst.values()) {
    const count = inst.apps.length
    const lines = inst.apps
      .map((a, i) => `${i + 1}. *${a.candidateName}* — ${a.jobTitle}`)
      .join('\n')

    const waMessage = [
      `📋 *שלום ${inst.name}!*`,
      `${count > 1 ? `${count} מועמדות מגישות מועמדותן` : 'מועמדת אחת הגישה מועמדותה'} מזה 3 ימים וממתינות לתגובתך:`,
      '',
      lines,
      '',
      `לצפייה בפרטים, אישור או דחייה:`,
      `${appUrl}/institution/applications`,
    ].join('\n')

    if (inst.phone) {
      void sendExternal({
        phone: inst.phone,
        whatsapp_preference: inst.whatsappPreference,
        waMessage,
        smsMessage: `${count} הגשות ממתינות לטיפולך. ${appUrl}/institution/applications`,
      })
    }

    // In-app notification + dedup marker (one per application)
    if (inst.profileId) {
      void service.from('notifications').insert(
        inst.apps.map(a => ({
          profile_id: inst.profileId!,
          type: 'pending_app_reminder',
          title: `הגשה ממתינה — ${a.candidateName}`,
          body: `${a.candidateName} הגישה מועמדות למשרת “${a.jobTitle}”`,
          related_id: a.appId,
          url: '/institution/applications',
        }))
      )
    }

    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
