import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type EventColor = 'green' | 'purple' | 'teal' | 'amber' | 'red'
type EventIcon = 'check' | 'user' | 'briefcase' | 'clock' | 'file' | 'x'


function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דקות`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs > 1 ? hrs + ' שעות' : 'שעה'}`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')
  const until = searchParams.get('until')

  const service = createServiceClient()

  let appsQ = service.from('applications')
    .select('id, status, applied_at, updated_at, candidates(profiles(full_name)), jobs(title, institutions(institution_name))')
    .order('updated_at', { ascending: false }).limit(30)
  let ivsQ = service.from('interviews')
    .select('id, scheduled_at, candidate_confirmed, created_at, applications(candidates(profiles(full_name)), jobs(title, institutions(institution_name)))')
    .order('created_at', { ascending: false }).limit(15)
  let invitsQ = service.from('invitations')
    .select('id, status, created_at, candidates(profiles(full_name)), jobs(title), institutions(institution_name)')
    .order('created_at', { ascending: false }).limit(15)

  if (since) {
    appsQ  = appsQ.gte('updated_at', since)
    ivsQ   = ivsQ.gte('created_at', since)
    invitsQ = invitsQ.gte('created_at', since)
  }
  if (until) {
    appsQ  = appsQ.lte('updated_at', until)
    ivsQ   = ivsQ.lte('created_at', until)
    invitsQ = invitsQ.lte('created_at', until)
  }

  // Recent application events
  const { data: apps } = await appsQ

  // Recent interviews
  const { data: ivs } = await ivsQ

  // Recent invitations
  const { data: invits } = await invitsQ

  const events: { ts: string; id: string; color: EventColor; icon: EventIcon; text: string; time: string; type: string }[] = []
  let seq = 0

  for (const a of apps ?? []) {
    const cand = (a.candidates as unknown as { profiles: { full_name: string | null } } | null)?.profiles?.full_name ?? 'מועמדת'
    const job = (a.jobs as unknown as { title: string } | null)?.title ?? '—'
    const inst = (a.jobs as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''

    const isNew = a.status === 'ממתינה' && Math.abs(new Date(a.updated_at).getTime() - new Date(a.applied_at).getTime()) < 60_000

    if (isNew) {
      events.push({ ts: a.applied_at, id: `app-new-${a.id}`, color: 'purple', icon: 'user', type: 'application',
        text: `<b>${cand}</b> הגישה מועמדות למשרת <b>${job}${inst ? ' · ' + inst : ''}</b>`,
        time: timeAgo(a.applied_at) })
    } else if (a.status === 'נצפתה') {
      events.push({ ts: a.updated_at, id: `app-view-${a.id}`, color: 'teal', icon: 'briefcase', type: 'application',
        text: `<b>${inst}</b> צפתה בפרטי מועמדת <b>${cand}</b> — <b>${job}</b>`,
        time: timeAgo(a.updated_at) })
    } else if (a.status === 'התקבלה') {
      events.push({ ts: a.updated_at, id: `app-acc-${a.id}`, color: 'green', icon: 'check', type: 'placement',
        text: `<b>${cand}</b> התקבלה למשרת <b>${job}</b> ב<b>${inst}</b>`,
        time: timeAgo(a.updated_at) })
    } else if (a.status === 'נדחתה') {
      events.push({ ts: a.updated_at, id: `app-rej-${a.id}`, color: 'red', icon: 'x', type: 'rejection',
        text: `בקשת <b>${cand}</b> ל<b>${job}</b> נדחתה ע"י <b>${inst}</b>`,
        time: timeAgo(a.updated_at) })
    }
  }

  for (const iv of ivs ?? []) {
    const app = iv.applications as unknown as { candidates: { profiles: { full_name: string | null } } | null; jobs: { title: string; institutions: { institution_name: string } } | null } | null
    const cand = app?.candidates?.profiles?.full_name ?? 'מועמדת'
    const job = app?.jobs?.title ?? '—'
    const inst = app?.jobs?.institutions?.institution_name ?? ''
    const dt = new Date(iv.scheduled_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })

    if (iv.candidate_confirmed === true) {
      events.push({ ts: iv.created_at, id: `iv-conf-${iv.id}`, color: 'green', icon: 'check', type: 'interview',
        text: `<b>${cand}</b> אישרה ראיון ב<b>${inst}</b> — ${dt}`,
        time: timeAgo(iv.created_at) })
    } else if (iv.candidate_confirmed === false) {
      events.push({ ts: iv.created_at, id: `iv-dec-${iv.id}`, color: 'amber', icon: 'clock', type: 'interview',
        text: `<b>${cand}</b> ביטלה ראיון ב<b>${inst}</b> — ${dt}`,
        time: timeAgo(iv.created_at) })
    } else {
      events.push({ ts: iv.created_at, id: `iv-sched-${iv.id}`, color: 'teal', icon: 'clock', type: 'interview',
        text: `ראיון נקבע עם <b>${cand}</b> ב<b>${inst}</b> — ${dt} · ממתין לאישור`,
        time: timeAgo(iv.created_at) })
    }
  }

  for (const inv of invits ?? []) {
    const cand = (inv.candidates as unknown as { profiles: { full_name: string | null } } | null)?.profiles?.full_name ?? 'מועמדת'
    const job = (inv.jobs as unknown as { title: string } | null)?.title ?? '—'
    const inst = (inv.institutions as unknown as { institution_name: string } | null)?.institution_name ?? ''

    if (inv.status === 'ממתינה') {
      events.push({ ts: inv.created_at, id: `inv-${inv.id}`, color: 'purple', icon: 'file', type: 'invitation',
        text: `<b>${inst}</b> שלחה הזמנת ראיון ל<b>${cand}</b> למשרת <b>${job}</b>`,
        time: timeAgo(inv.created_at) })
    } else if (inv.status === 'התקבלה') {
      events.push({ ts: inv.created_at, id: `inv-acc-${inv.id}`, color: 'green', icon: 'check', type: 'invitation',
        text: `<b>${cand}</b> קיבלה הזמנה מ<b>${inst}</b> — <b>${job}</b>`,
        time: timeAgo(inv.created_at) })
    } else if (inv.status === 'נדחתה') {
      events.push({ ts: inv.created_at, id: `inv-rej-${inv.id}`, color: 'red', icon: 'x', type: 'invitation',
        text: `<b>${cand}</b> דחתה הזמנה מ<b>${inst}</b> — <b>${job}</b>`,
        time: timeAgo(inv.created_at) })
    }
  }

  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  const result = events.slice(0, 20).map((e, i) => ({ ...e, id: i + 1 }))

  return NextResponse.json(result)
}
