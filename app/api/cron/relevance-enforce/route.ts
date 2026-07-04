import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'
import { notifyMany, notify } from '@/lib/notify'

export const maxDuration = 300

const DAY_MS = 24 * 60 * 60 * 1000

// Vercel Cron — runs daily at 09:45 Israel time (06:45 UTC)
// 1. Candidates who were asked the weekly relevance question and did not
//    reply by the deadline (Tuesday night) → deactivated ('לא פעילה'),
//    their pending applications cancelled, and a gentle notice sent.
// 2. Applications the institution left unanswered for 14+ days (and that got
//    at least one reminder 3+ days ago) → closed so the candidate can move on.
// Everything is recorded in the system: candidate row, notifications, admin summary.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const nowIso = now.toISOString()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  // ── Part 1: expired relevance sessions with a deadline ─────────────────
  const { data: expiredSessions } = await service
    .from('wa_sessions')
    .select('id, phone, data, created_at, expires_at')
    .eq('session_type', 'relevance_check')
    .lt('expires_at', nowIso)

  const removedNames: string[] = []

  for (const session of expiredSessions ?? []) {
    const data = session.data as { profile_id?: string; user_type?: string; enforce_deadline?: string } | null

    const isEnforced = data?.enforce_deadline === 'true' && data?.user_type === 'candidate' && data?.profile_id
    if (!isEnforced) {
      // stale non-binding session (e.g. old job-alert piggyback) — clean up after 14 days
      if (new Date(session.created_at as string).getTime() < now.getTime() - 14 * DAY_MS) {
        await service.from('wa_sessions').delete().eq('id', session.id)
      }
      continue
    }

    const profileId = data!.profile_id!

    const { data: candidate } = await service
      .from('candidates')
      .select('id, whatsapp_preference, availability_status, profiles(full_name, phone)')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (candidate && candidate.availability_status !== 'לא פעילה') {
      await service.from('candidates').update({
        availability_status: 'לא פעילה',
        relevance_response: 'לא ענתה',
        relevance_checked_at: nowIso,
      }).eq('id', candidate.id)

      // cancel her pending applications
      await service.from('applications')
        .update({ status: 'בוטלה' })
        .eq('candidate_id', candidate.id)
        .in('status', ['ממתינה', 'נצפתה'])

      const prof = candidate.profiles as unknown as { full_name: string | null; phone: string | null } | null
      const name = prof?.full_name ?? 'מועמדת'
      removedNames.push(name)

      // gentle notice — easy way back
      await notify({
        profile_id: profileId,
        type: 'relevance_removed',
        title: 'הוסרת זמנית מהרשימה הפעילה',
        body: 'לא קיבלנו ממך תשובה לבדיקת הרלוונטיות. אפשר לחזור בכל רגע דרך הפרופיל.',
        url: '/profile',
      })
      if (prof?.phone) {
        const msg = `שלום ${name.split(' ')[0]} 💜\nלא שמענו ממך, אז הסרנו אותך זמנית מהרשימה הפעילה של "השביל".\nרוצה לחזור? זה לוקח רגע: ${appUrl}/profile\nאנחנו כאן בשבילך תמיד 🌷`
        await sendExternal({
          phone: prof.phone,
          whatsapp_preference: candidate.whatsapp_preference,
          waMessage: msg,
          smsMessage: msg,
        }).catch(() => null)
        await new Promise(r => setTimeout(r, 400))
      }
    }

    await service.from('wa_sessions').delete().eq('id', session.id)
  }

  // ── Part 2: applications unanswered by the institution for 14+ days ────
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS).toISOString()
  const { data: staleApps } = await service
    .from('applications')
    .select('id, applied_at, jobs(title, institutions(institution_name, profile_id)), candidates(id, profile_id, whatsapp_preference, profiles(full_name, phone))')
    .in('status', ['ממתינה', 'נצפתה'])
    .lt('applied_at', fourteenDaysAgo)

  const closedApps: string[] = []

  for (const app of staleApps ?? []) {
    // close only after the institution got a reminder at least 3 days ago
    const { data: reminded } = await service
      .from('notifications')
      .select('id')
      .eq('type', 'pending_app_reminder')
      .eq('related_id', app.id)
      .lt('created_at', new Date(now.getTime() - 3 * DAY_MS).toISOString())
      .limit(1)
      .maybeSingle()
    if (!reminded) continue

    await service.from('applications').update({ status: 'בוטלה' }).eq('id', app.id)

    const job = app.jobs as unknown as { title: string; institutions: { institution_name: string; profile_id: string | null } | null } | null
    const cand = app.candidates as unknown as { id: string; profile_id: string | null; whatsapp_preference: boolean | null; profiles: { full_name: string | null; phone: string | null } | null } | null
    const jobTitle = job?.title ?? ''
    const instName = job?.institutions?.institution_name ?? ''
    const candName = cand?.profiles?.full_name ?? 'מועמדת'
    const days = Math.floor((now.getTime() - new Date(app.applied_at).getTime()) / DAY_MS)
    closedApps.push(`${candName} — "${jobTitle}"${instName ? ` (${instName})` : ''} — ${days} ימים`)

    // tell the candidate, warmly, and point her onward
    if (cand?.profile_id) {
      await notify({
        profile_id: cand.profile_id,
        type: 'application_auto_closed',
        title: 'ההגשה נסגרה — אפשר להתקדם הלאה',
        body: `המוסד לא הגיב להגשתך למשרת "${jobTitle}"${instName ? ` ב${instName}` : ''}, ולכן סגרנו אותה. יש עוד משרות שמחכות לך!`,
        related_id: app.id,
        url: '/jobs',
      })
    }
    if (cand?.profiles?.phone) {
      const msg = `שלום ${candName.split(' ')[0]} 💜\nהמוסד לא הספיק להגיב להגשתך למשרת "${jobTitle}"${instName ? ` ב${instName}` : ''}, ולכן סגרנו אותה כדי שתוכלי להתקדם.\nיש עוד משרות שמחכות בדיוק לך: ${appUrl}/jobs 🌟`
      await sendExternal({
        phone: cand.profiles.phone,
        whatsapp_preference: cand.whatsapp_preference,
        waMessage: msg,
        smsMessage: msg,
      }).catch(() => null)
      await new Promise(r => setTimeout(r, 400))
    }

    // tell the institution in-app
    if (job?.institutions?.profile_id) {
      await notify({
        profile_id: job.institutions.profile_id,
        type: 'application_auto_closed',
        title: `הגשה נסגרה אוטומטית — ${candName}`,
        body: `ההגשה למשרת "${jobTitle}" נסגרה לאחר ${days} ימים ללא מענה.`,
        related_id: app.id,
        url: '/institution/applications',
      })
    }
  }

  // ── Admin summary — the answers land in the system ─────────────────────
  if (removedNames.length || closedApps.length) {
    const { data: admins } = await service
      .from('profiles')
      .select('id')
      .in('role', ['מנהלת מערכת', 'אדמין מערכת'])

    if (admins?.length) {
      const parts: string[] = []
      if (removedNames.length) parts.push(`הוסרו ${removedNames.length} מועמדות שלא ענו: ${removedNames.join(', ')}`)
      if (closedApps.length) parts.push(`נסגרו ${closedApps.length} הגשות ללא מענה: ${closedApps.join(' | ')}`)
      await notifyMany(admins.map(a => a.id), {
        type: 'relevance_enforce_summary',
        title: '🧹 סיכום ניקיון אוטומטי',
        body: parts.join(' • ').slice(0, 900),
        url: '/candidates',
      })
    }
  }

  return NextResponse.json({ ok: true, removed: removedNames.length, closed: closedApps.length })
}
