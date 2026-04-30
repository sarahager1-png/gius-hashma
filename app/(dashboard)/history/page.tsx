import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import HistoryClient from './history-client'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const events: HistoryEvent[] = []

  /* ── מועמדת ── */
  if (profile.role === 'מועמדת') {
    const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
    if (!cand) redirect('/dashboard')

    const [appsRes, invRes, ivRes] = await Promise.all([
      service.from('applications')
        .select('id, status, applied_at, updated_at, jobs(title, institution_id, institutions(institution_name))')
        .eq('candidate_id', cand.id)
        .order('updated_at', { ascending: false }),
      service.from('invitations')
        .select('id, status, created_at, scheduled_at, jobs(title), institutions(institution_name)')
        .eq('candidate_id', cand.id)
        .order('created_at', { ascending: false }),
      service.from('interviews')
        .select('id, scheduled_at, candidate_confirmed, created_at, applications!inner(candidate_id, jobs(title, institutions(institution_name)))')
        .eq('applications.candidate_id', cand.id)
        .order('created_at', { ascending: false }),
    ])

    for (const a of appsRes.data ?? []) {
      const job = (a.jobs as any)
      const inst = job?.institutions?.institution_name ?? ''
      events.push({
        id: `app-${a.id}`, ts: a.updated_at,
        type: a.status === 'התקבלה' ? 'success' : a.status === 'נדחתה' ? 'rejection' : a.status === 'נצפתה' ? 'view' : 'application',
        title: statusLabel(a.status, 'cand'),
        subtitle: `${job?.title ?? '—'}${inst ? ' · ' + inst : ''}`,
        tag: a.status,
      })
    }

    for (const inv of invRes.data ?? []) {
      const job = (inv.jobs as any)
      const inst = (inv.institutions as any)?.institution_name ?? ''
      events.push({
        id: `inv-${inv.id}`, ts: inv.created_at,
        type: 'invite',
        title: inv.status === 'ממתינה' ? 'הוזמנת לראיון' : inv.status === 'התקבלה' ? 'קיבלת הזמנה לראיון' : 'דחית הזמנה',
        subtitle: `${job?.title ?? '—'}${inst ? ' · ' + inst : ''}${inv.scheduled_at ? ' · ' + fmtDt(inv.scheduled_at) : ''}`,
        tag: inv.status,
        invitationId: inv.status === 'ממתינה' ? inv.id : undefined,
      })
    }

    for (const iv of ivRes.data ?? []) {
      const app = (iv.applications as any)
      const job = app?.jobs
      const inst = job?.institutions?.institution_name ?? ''
      const pending = iv.candidate_confirmed === null || iv.candidate_confirmed === undefined
      events.push({
        id: `iv-${iv.id}`, ts: iv.created_at,
        type: iv.candidate_confirmed === true ? 'success' : iv.candidate_confirmed === false ? 'rejection' : 'interview',
        title: iv.candidate_confirmed === true ? 'אישרת ראיון' : iv.candidate_confirmed === false ? 'ביטלת ראיון' : 'ראיון נקבע',
        subtitle: `${job?.title ?? '—'}${inst ? ' · ' + inst : ''} · ${fmtDt(iv.scheduled_at)}`,
        tag: iv.candidate_confirmed === true ? 'אושר' : iv.candidate_confirmed === false ? 'בוטל' : 'ממתין',
        interviewId: pending ? iv.id : undefined,
      })
    }
  }

  /* ── מוסד ── */
  if (profile.role === 'מוסד') {
    const { data: inst } = await service.from('institutions').select('id, is_approved').eq('profile_id', user.id).single()
    if (!inst?.is_approved) redirect('/dashboard')

    const [appsRes, invRes, ivRes] = await Promise.all([
      service.from('applications')
        .select('id, status, applied_at, updated_at, candidates(profiles(full_name)), jobs!inner(title, institution_id)')
        .eq('jobs.institution_id', inst.id)
        .order('updated_at', { ascending: false }),
      service.from('invitations')
        .select('id, status, created_at, scheduled_at, candidates(profiles(full_name)), jobs(title)')
        .eq('institution_id', inst.id)
        .order('created_at', { ascending: false }),
      service.from('interviews')
        .select('id, scheduled_at, candidate_confirmed, created_at, applications!inner(jobs!inner(institution_id), candidates(profiles(full_name)), jobs(title))')
        .eq('applications.jobs.institution_id', inst.id)
        .order('created_at', { ascending: false }),
    ])

    for (const a of appsRes.data ?? []) {
      const candName = (a.candidates as any)?.profiles?.full_name ?? 'מועמדת'
      const jobTitle = (a.jobs as any)?.title ?? '—'
      events.push({
        id: `app-${a.id}`, ts: a.updated_at,
        type: a.status === 'התקבלה' ? 'success' : a.status === 'נדחתה' ? 'rejection' : a.status === 'נצפתה' ? 'view' : 'application',
        title: statusLabel(a.status, 'inst'),
        subtitle: `${candName} · ${jobTitle}`,
        tag: a.status,
      })
    }

    for (const inv of invRes.data ?? []) {
      const candName = (inv.candidates as any)?.profiles?.full_name ?? 'מועמדת'
      const jobTitle = (inv.jobs as any)?.title ?? '—'
      events.push({
        id: `inv-${inv.id}`, ts: inv.created_at,
        type: 'invite',
        title: inv.status === 'ממתינה' ? 'שלחת הזמנה לראיון' : inv.status === 'התקבלה' ? 'ההזמנה התקבלה' : 'ההזמנה נדחתה',
        subtitle: `${candName} · ${jobTitle}${inv.scheduled_at ? ' · ' + fmtDt(inv.scheduled_at) : ''}`,
        tag: inv.status,
      })
    }

    for (const iv of ivRes.data ?? []) {
      const app = (iv.applications as any)
      const candName = app?.candidates?.profiles?.full_name ?? 'מועמדת'
      const jobTitle = app?.jobs?.title ?? '—'
      events.push({
        id: `iv-${iv.id}`, ts: iv.created_at,
        type: iv.candidate_confirmed === true ? 'success' : iv.candidate_confirmed === false ? 'rejection' : 'interview',
        title: iv.candidate_confirmed === true ? 'ראיון אושר ע"י המועמדת' : iv.candidate_confirmed === false ? 'ראיון בוטל ע"י המועמדת' : 'ראיון נקבע',
        subtitle: `${candName} · ${jobTitle} · ${fmtDt(iv.scheduled_at)}`,
        tag: iv.candidate_confirmed === true ? 'אושר' : iv.candidate_confirmed === false ? 'בוטל' : 'ממתין',
      })
    }
  }

  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  return <HistoryClient events={events} role={profile.role} />
}

function statusLabel(status: string, side: 'cand' | 'inst') {
  const map: Record<string, { cand: string; inst: string }> = {
    'ממתינה': { cand: 'הגשת מועמדות',         inst: 'הגשה חדשה התקבלה' },
    'נצפתה':  { cand: 'המוסד צפה בפרופיל',    inst: 'צפית בפרופיל המועמדת' },
    'התקבלה': { cand: 'התקבלת למשרה!',        inst: 'קיבלת מועמדת למשרה' },
    'נדחתה':  { cand: 'הבקשה לא אושרה',       inst: 'דחית מועמדת' },
    'בוטלה':  { cand: 'הגשה בוטלה',           inst: 'הגשה בוטלה' },
  }
  return map[status]?.[side] ?? status
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export type HistoryEvent = {
  id: string
  ts: string
  type: 'application' | 'view' | 'invite' | 'interview' | 'success' | 'rejection'
  title: string
  subtitle: string
  tag: string
  invitationId?: string
  interviewId?: string
}
