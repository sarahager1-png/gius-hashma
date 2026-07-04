import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'
import { notify } from '@/lib/notify'

export const maxDuration = 300

const DAY_MS = 24 * 60 * 60 * 1000

// Vercel Cron — runs daily at 09:15 Israel time (06:15 UTC)
// Warm reminder to institutions about applications waiting 3+ days without a
// response, including how many days each candidate has been waiting.
// Repeats every 4 days per application; after 14 days without a response the
// relevance-enforce cron closes the application.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  const now = new Date()

  const threeDaysAgo = new Date(now.getTime() - 3 * DAY_MS).toISOString()

  const { data: applications, error } = await service
    .from('applications')
    .select('id, applied_at, jobs(title, institution_id, institutions(id, institution_name, principal_name, phone, whatsapp_preference, profile_id)), candidates(profiles(full_name))')
    .in('status', ['ממתינה', 'נצפתה'])
    .lt('applied_at', threeDaysAgo)

  if (error) {
    console.error('[CRON] pending-applications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!applications?.length) return NextResponse.json({ ok: true, notified: 0 })

  // remind at most once per 4 days per application
  const appIds = applications.map((a: { id: string }) => a.id)
  const { data: recentReminders } = await service
    .from('notifications')
    .select('related_id')
    .eq('type', 'pending_app_reminder')
    .in('related_id', appIds)
    .gte('created_at', new Date(now.getTime() - 4 * DAY_MS).toISOString())

  const recentSet = new Set((recentReminders ?? []).map((n: { related_id: string | null }) => n.related_id))
  const fresh = applications.filter((a: { id: string }) => !recentSet.has(a.id))
  if (!fresh.length) return NextResponse.json({ ok: true, notified: 0 })

  // Group by institution
  type AppEntry = { appId: string; candidateName: string; jobTitle: string; days: number }
  type InstData = {
    name: string
    principal: string | null
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
      institutions: { id: string; institution_name: string; principal_name: string | null; phone: string | null; whatsapp_preference: boolean | null; profile_id: string | null }
    } | null
    if (!job?.institutions) continue
    const cand = app.candidates as unknown as { profiles: { full_name: string | null } | null } | null
    const candidateName = cand?.profiles?.full_name ?? 'מועמדת'
    const days = Math.max(1, Math.floor((now.getTime() - new Date(app.applied_at).getTime()) / DAY_MS))
    const instId = job.institution_id
    if (!byInst.has(instId)) {
      byInst.set(instId, {
        name: job.institutions.institution_name,
        principal: job.institutions.principal_name,
        phone: job.institutions.phone,
        whatsappPreference: job.institutions.whatsapp_preference,
        profileId: job.institutions.profile_id,
        apps: [],
      })
    }
    byInst.get(instId)!.apps.push({ appId: app.id, candidateName, jobTitle: job.title, days })
  }

  // Sunday in Israel → open with שבוע טוב
  const israelDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' }).format(now)
  const greeting = israelDay === 'Sun' ? 'שבוע טוב ומבורך' : 'בוקר טוב'

  let notified = 0

  for (const inst of byInst.values()) {
    const count = inst.apps.length
    const firstName = (inst.principal ?? inst.name).split(' ')[0]
    const lines = inst.apps
      .map((a, i) => `${i + 1}. *${a.candidateName}* — "${a.jobTitle}" — ממתינה כבר ${a.days === 1 ? 'יום' : `${a.days} ימים`} ⏳`)
      .join('\n')

    const waMessage = [
      `${greeting} ${firstName}! 🌷`,
      '',
      count > 1
        ? `תזכורת קטנה מ"השביל" — ${count} מועמדות מחכות לשמוע ממך:`
        : `תזכורת קטנה מ"השביל" — מועמדת אחת מחכה לשמוע ממך:`,
      '',
      lines,
      '',
      `מענה קצר ממך עושה להן את היום 💜`,
      `לצפייה ומענה: ${appUrl}/institution/applications`,
      '',
      `💡 הגשה ללא מענה במשך 14 יום נסגרת אוטומטית, כדי לאפשר למועמדת להתקדם.`,
    ].join('\n')

    if (inst.phone) {
      await sendExternal({
        phone: inst.phone,
        whatsapp_preference: inst.whatsappPreference,
        waMessage,
        smsMessage: `${count} הגשות ממתינות לתשובתך בהשביל. ${appUrl}/institution/applications`,
      }).catch(err => console.error('[CRON] pending-applications send failed:', inst.phone, err))
      await new Promise(r => setTimeout(r, 400))
    }

    // In-app + push notification, and the per-application reminder marker
    if (inst.profileId) {
      for (const a of inst.apps) {
        await notify({
          profile_id: inst.profileId,
          type: 'pending_app_reminder',
          title: `הגשה ממתינה — ${a.candidateName}`,
          body: `${a.candidateName} ממתינה למענה על "${a.jobTitle}" כבר ${a.days} ימים`,
          related_id: a.appId,
          url: '/institution/applications',
        })
      }
    } else {
      // no linked profile — still record the reminder for the 4-day dedup and 14-day closure flow
      const { data: admins } = await service
        .from('profiles')
        .select('id')
        .in('role', ['מנהלת מערכת', 'אדמין מערכת'])
        .limit(1)
      const holder = admins?.[0]?.id
      if (holder) {
        await service.from('notifications').insert(
          inst.apps.map(a => ({
            profile_id: holder,
            type: 'pending_app_reminder',
            title: `הגשה ממתינה — ${a.candidateName} (${inst.name})`,
            body: `${a.candidateName} ממתינה למענה על "${a.jobTitle}" כבר ${a.days} ימים`,
            related_id: a.appId,
            url: '/institution/applications',
            read: true,
          }))
        )
      }
    }

    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
