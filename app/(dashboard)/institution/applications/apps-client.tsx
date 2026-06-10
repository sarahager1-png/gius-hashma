'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Calendar, MessageCircle, Clock,
  Eye, ChevronDown, MapPin, GraduationCap, Briefcase,
  X, Phone, FileText, Search, Sparkles, StickyNote, Check, Star, History, Trash2,
} from 'lucide-react'

type AppStatus = 'ממתינה' | 'נצפה' | 'התקבלה' | 'נדחתה' | 'בוטלה'

export interface AppRow {
  id: string
  status: AppStatus
  applied_at: string
  cover_letter: string | null
  institution_notes: string | null
  job_id: string
  candidate_id: string
  survey_token?: string | null
  jobs: { id: string; title: string; city: string | null } | null
  candidates: {
    id: string
    city: string | null
    specialization: string | null
    academic_level: string | null
    cv_url: string | null
    profile_id: string
    profiles: { full_name: string | null; phone: string | null } | null
  } | null
}

const STATUS_CFG: Record<AppStatus, { label: string; bg: string; color: string; dot: string; icon: React.ElementType }> = {
  'ממתינה': { label: 'ממתינה',  bg: '#EDE9FE', color: '#5B3E9E', dot: '#8B5CF6', icon: Clock        },
  'נצפה':  { label: 'נצפה',   bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', icon: Eye          },
  'התקבלה': { label: 'התקבלה',  bg: '#E4F6ED', color: '#1A7A4A', dot: '#22C55E', icon: CheckCircle2 },
  'נדחתה':  { label: 'נדחתה',   bg: '#F4F4F5', color: '#71717A', dot: '#9CA3AF', icon: XCircle      },
  'בוטלה':  { label: 'בוטלה',   bg: '#F4F4F5', color: '#71717A', dot: '#9CA3AF', icon: XCircle      },
}

const GRADIENTS = [
  'linear-gradient(135deg,#5B3E9E,#2DD4D4)',
  'linear-gradient(135deg,#C2185B,#FF8A65)',
  'linear-gradient(135deg,#1565C0,#42A5F5)',
  'linear-gradient(135deg,#2E7D32,#66BB6A)',
  'linear-gradient(135deg,#B45309,#F59E0B)',
]

const TABS: { key: AppStatus | 'הכל'; label: string }[] = [
  { key: 'הכל',    label: 'הכל'      },
  { key: 'ממתינה', label: 'ממתינות'  },
  { key: 'נצפה',  label: 'נצפו'     },
  { key: 'התקבלה', label: 'התקבלו'   },
  { key: 'נדחתה',  label: 'נדחו'     },
]

function fmtDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

function waitingDays(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
}

interface Props {
  apps: AppRow[]
  institutionId: string
  institutionName: string
}

export default function AppsAllClient({ apps: initial, institutionName }: Props) {
  const [apps, setApps]           = useState<AppRow[]>(initial)
  const [tab, setTab]             = useState<AppStatus | 'הכל'>('הכל')
  const [jobFilter, setJobFilter] = useState('הכל')
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState<string | null>(null)
  const [interview, setInterview] = useState<{
    appId: string; name: string; phone: string | null; jobTitle: string
  } | null>(null)
  const [intDate, setIntDate]         = useState('')
  const [intTime, setIntTime]         = useState('09:00')
  const [intLocation, setIntLocation] = useState('')
  const [savingInt, setSavingInt]     = useState(false)
  const [notes, setNotes]             = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map(a => [a.id, a.institution_notes ?? '']))
  )
  const [notesOpen, setNotesOpen]     = useState<Set<string>>(new Set())
  const [savingNote, setSavingNote]   = useState<string | null>(null)
  const [savedNote, setSavedNote]     = useState<Set<string>>(new Set())

  type LogEntry = { id: string; from_status: string | null; to_status: string; changed_at: string }
  const [historyOpen, setHistoryOpen] = useState<Set<string>>(new Set())
  const [historyData, setHistoryData] = useState<Record<string, LogEntry[]>>({})
  const [historyLoading, setHistoryLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ appId: string; name: string; phone: string | null } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function toggleHistory(appId: string) {
    if (historyOpen.has(appId)) {
      setHistoryOpen(prev => { const s = new Set(prev); s.delete(appId); return s })
      return
    }
    setHistoryOpen(prev => new Set([...prev, appId]))
    if (historyData[appId]) return
    setHistoryLoading(appId)
    const res = await fetch(`/api/applications/${appId}/history`)
    const data = await res.json()
    setHistoryData(prev => ({ ...prev, [appId]: Array.isArray(data) ? data : [] }))
    setHistoryLoading(null)
  }

  const counts = {
    'הכל':    apps.length,
    'ממתינה': apps.filter(a => a.status === 'ממתינה').length,
    'נצפה':  apps.filter(a => a.status === 'נצפה').length,
    'התקבלה': apps.filter(a => a.status === 'התקבלה').length,
    'נדחתה':  apps.filter(a => a.status === 'נדחתה').length,
  }

  const filtered = apps.filter(a => {
    if (tab !== 'הכל' && a.status !== tab) return false
    if (jobFilter !== 'הכל' && a.job_id !== jobFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = a.candidates?.profiles?.full_name?.toLowerCase() ?? ''
      const city = a.candidates?.city?.toLowerCase() ?? ''
      const job  = a.jobs?.title?.toLowerCase() ?? ''
      if (!name.includes(q) && !city.includes(q) && !job.includes(q)) return false
    }
    return true
  }).sort((a, b) => {
    if (a.status === 'ממתינה' && b.status === 'ממתינה')
      return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
    return 0
  })

  const jobSeen = new Set<string>()
  const uniqueJobs = apps
    .map(a => a.jobs)
    .filter((j): j is { id: string; title: string; city: string | null } => !!j && !jobSeen.has(j.id) && jobSeen.add(j.id) !== undefined)

  async function updateStatus(appId: string, newStatus: AppStatus, rejection_reason?: string) {
    setLoading(appId)
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...(rejection_reason ? { rejection_reason } : {}) }),
    })
    setLoading(null)
    if (!res.ok) {
      const orig = initial.find(a => a.id === appId)
      if (orig) setApps(prev => prev.map(a => a.id === appId ? { ...a, status: orig.status } : a))
    }
  }

  async function deleteApp(appId: string) {
    setDeleting(appId)
    const res = await fetch(`/api/applications/${appId}`, { method: 'DELETE' })
    setDeleting(null)
    setDeleteConfirm(null)
    if (res.ok) setApps(prev => prev.filter(a => a.id !== appId))
  }

  async function scheduleInterview() {
    if (!interview || !intDate) return
    setSavingInt(true)
    const scheduledAt = new Date(`${intDate}T${intTime || '09:00'}`).toISOString()
    await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: interview.appId, scheduled_at: scheduledAt, location: intLocation || null }),
    })
    const app = apps.find(a => a.id === interview.appId)
    if (app?.status === 'ממתינה') await updateStatus(interview.appId, 'נצפה')
    setSavingInt(false)
    setInterview(null)
    setIntDate(''); setIntTime('09:00'); setIntLocation('')
  }

  async function saveNote(appId: string) {
    setSavingNote(appId)
    await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_notes: notes[appId] }),
    })
    setSavingNote(null)
    setSavedNote(prev => new Set([...prev, appId]))
    setNotesOpen(prev => { const s = new Set(prev); s.delete(appId); return s })
    setTimeout(() => setSavedNote(prev => { const s = new Set(prev); s.delete(appId); return s }), 2500)
  }

  function waLink(phone: string | null, msg: string) {
    if (!phone) return '#'
    const n = phone.replace(/\D/g, '').replace(/^0/, '972')
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`
  }

  function waMsg(a: AppRow, type: 'accept' | 'reject' | 'interview') {
    const first = a.candidates?.profiles?.full_name?.split(' ')[0] ?? 'שלום'
    const job   = a.jobs?.title ?? 'המשרה'
    if (type === 'accept')    return `שלום ${first},\nאנחנו מ${institutionName} ושמחים לבשר לך שהתקבלת למשרת "${job}"! נשמח לתאם את המשך התהליך.\nבברכה`
    if (type === 'reject')    return `שלום ${first},\nתודה על הגשתך למשרת "${job}" ב${institutionName}. לאחר בחינה מעמיקה, החלטנו להמשיך עם מועמדים אחרים. מאחלים לך הצלחה!\nבברכה`
    return `שלום ${first},\nמ${institutionName}. נשמח להזמין אותך לראיון למשרת "${job}". מה הזמינות שלך?\nבברכה`
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] mb-1.5" style={{ color: 'var(--teal-600)' }}>
            ניהול הגשות
          </p>
          <h1 className="text-[30px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
            הגשות למשרות שלי
          </h1>
          <p className="text-[14px] font-medium mt-1.5" style={{ color: 'var(--ink-3)' }}>
            {apps.length} הגשות סה&quot;כ
            {counts['ממתינה'] > 0 && (
              <span className="ms-2 text-[12px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#EDE9FE', color: '#5B3E9E' }}>
                {counts['ממתינה']} ממתינות
              </span>
            )}
          </p>
        </div>
        <Link href="/institution/jobs/new"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white no-underline"
          style={{ background: 'var(--purple)', boxShadow: '0 3px 10px rgba(75,46,131,.3)' }}>
          + משרה חדשה
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
            style={{ color: 'var(--ink-4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חפשי לפי שם, עיר, משרה..."
            className="h-9 rounded-[10px] border text-[13px] font-medium outline-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineEnd: '34px', paddingInlineStart: '12px', minWidth: 200 }} />
        </div>

        <select
          value={tab} onChange={e => setTab(e.target.value as AppStatus | 'הכל')}
          className="md:hidden h-9 rounded-[10px] border text-[13px] font-medium outline-none px-3"
          style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)' }}>
          {TABS.map(t => {
            const cnt = counts[t.key as keyof typeof counts] ?? 0
            return <option key={t.key} value={t.key}>{t.label}{cnt > 0 ? ` (${cnt})` : ''}</option>
          })}
        </select>
        <div className="hidden md:flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
          {TABS.map(t => {
            const cnt = counts[t.key as keyof typeof counts] ?? 0
            return (
              <button key={t.key} onClick={() => setTab(t.key as AppStatus | 'הכל')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
                style={tab === t.key
                  ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }
                  : { color: 'var(--ink-3)' }}>
                {t.label}
                {cnt > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={tab === t.key
                      ? { background: 'var(--purple)', color: '#fff' }
                      : { background: 'var(--bg-3)', color: 'var(--ink-4)' }}>
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {uniqueJobs.length > 1 && (
          <div className="relative">
            <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
              className="h-9 rounded-[10px] border text-[13px] font-medium outline-none appearance-none"
              style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
                paddingInlineStart: '12px', paddingInlineEnd: '32px' }}>
              <option value="הכל">כל המשרות ({apps.length})</option>
              {uniqueJobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({apps.filter(a => a.job_id === j.id).length})
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ insetInlineEnd: 10, color: 'var(--ink-4)' }} />
          </div>
        )}
      </div>

      {/* ── Stale pending banner ── */}
      {(() => {
        const stale = apps.filter(a => a.status === 'ממתינה' && waitingDays(a.applied_at) >= 3)
        if (!stale.length) return null
        return (
          <div className="mb-5 px-4 py-3 rounded-[14px] flex items-center gap-3"
            style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
            <span style={{ fontSize: 20 }}>🙏</span>
            <p className="text-[13px] font-medium leading-snug" style={{ color: '#92400E' }}>
              {stale.length === 1
                ? 'יש מועמדת אחת שמחכה לתשובתך כבר יותר מ-3 ימים — תגובה מהירה שלך חשובה לה מאוד.'
                : `יש ${stale.length} מועמדות שמחכות לתשובתך יותר מ-3 ימים — כל תגובה מהירה עוזרת להן מאוד.`}
            </p>
          </div>
        )
      })()}

      {/* ── Empty ── */}
      {filtered.length === 0 ? (
        <div className="rounded-[20px] border p-16 text-center"
          style={{ background: 'linear-gradient(135deg, #FDFCFF 0%, #FAF8FE 100%)', borderColor: 'var(--line)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--purple-050)' }}>
            <Sparkles size={24} style={{ color: 'var(--purple)' }} />
          </div>
          <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink)' }}>
            {tab !== 'הכל' ? `אין הגשות בסטטוס "${tab}"` : 'עדיין אין הגשות'}
          </p>
          <p className="text-[13px] mb-4" style={{ color: 'var(--ink-3)' }}>
            שלחו הזמנות למועמדות מתאימות
          </p>
          <Link href="/institution/candidates"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold text-white no-underline"
            style={{ background: 'var(--purple)' }}>
            חפשו מועמדות ←
          </Link>
        </div>
      ) : (

        /* ── Cards ── */
        <div className="space-y-3">
          {filtered.map((app, idx) => {
            const sc       = STATUS_CFG[app.status] ?? STATUS_CFG['בוטלה']
            const SIcon    = sc.icon
            const prof     = app.candidates?.profiles
            const name     = prof?.full_name ?? '—'
            const phone    = prof?.phone ?? null
            const initials = name !== '—' ? name.split(' ').slice(0, 2).map(w => w[0]).join('') : '?'
            const grad     = GRADIENTS[idx % GRADIENTS.length]
            const isLoad   = loading === app.id
            const canAct   = !['התקבלה', 'נדחתה', 'בוטלה'].includes(app.status)
            const daysWaiting = waitingDays(app.applied_at)

            return (
              <div key={app.id}
                className="rounded-[18px] border overflow-hidden transition-all duration-200"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: '0 1px 4px rgba(75,46,131,.06)' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 8px 28px rgba(75,46,131,.13)'
                  el.style.borderColor = 'var(--purple-200)'
                  el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 1px 4px rgba(75,46,131,.06)'
                  el.style.borderColor = 'var(--line)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                {/* Status strip */}
                <div className="h-[3.5px]" style={{ background: `linear-gradient(90deg, ${sc.dot}, ${sc.dot}88)` }} />

                <div className="p-5">
                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-extrabold text-white shrink-0 shadow-sm"
                      style={{ background: grad }}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">

                        {/* Left: candidate info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {app.candidates?.id ? (
                              <Link href={`/candidates/${app.candidates.id}`}
                                className="text-[16px] font-extrabold no-underline leading-tight"
                                style={{ color: 'var(--ink)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--purple)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}>
                                {name}
                              </Link>
                            ) : (
                              <span className="text-[16px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>{name}</span>
                            )}
                            {app.candidates?.cv_url && (
                              <a href={app.candidates.cv_url} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full no-underline"
                                style={{ background: '#CCFBF1', color: '#0F766E' }}>
                                <FileText size={9} />ק&quot;ח
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 flex-wrap text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                            {app.candidates?.specialization && (
                              <span className="flex items-center gap-1">
                                <GraduationCap size={11} />{app.candidates.specialization}
                              </span>
                            )}
                            {app.candidates?.city && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />{app.candidates.city}
                              </span>
                            )}
                            {phone && (
                              <a href={`tel:${phone}`} className="flex items-center gap-1 no-underline font-semibold"
                                style={{ color: 'var(--teal-600)' }}>
                                <Phone size={11} />{phone}
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5 text-[12px]">
                            <Briefcase size={11} style={{ color: 'var(--ink-4)' }} />
                            <span className="font-bold" style={{ color: 'var(--purple)' }}>
                              {app.jobs?.title ?? '—'}
                            </span>
                            {app.jobs?.city && (
                              <span style={{ color: 'var(--ink-4)' }}>· {app.jobs.city}</span>
                            )}
                          </div>
                        </div>

                        {/* Right: status + date + waiting badge */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: sc.bg, color: sc.color }}>
                            <SIcon size={11} />{sc.label}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                            {fmtDate(app.applied_at)}
                          </span>
                          {app.status === 'ממתינה' && daysWaiting >= 2 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#FEF3C7', color: '#B45309' }}>
                              <Clock size={9} />
                              {daysWaiting === 2 ? 'יומיים' : `${daysWaiting} ימים`} בהמתנה
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cover letter */}
                      {app.cover_letter && (
                        <div className="mt-3 px-3 py-2 rounded-[10px] text-[12.5px] leading-relaxed"
                          style={{ background: 'var(--bg)', color: 'var(--ink-2)',
                            borderInlineStart: '3px solid var(--purple-200)' }}>
                          {app.cover_letter.length > 130
                            ? app.cover_letter.slice(0, 130) + '…'
                            : app.cover_letter}
                        </div>
                      )}

                      {/* Action buttons */}
                      {canAct ? (
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <ActionBtn
                            onClick={() => {
                              updateStatus(app.id, 'התקבלה')
                              if (phone) window.open(waLink(phone, waMsg(app, 'accept')), '_blank')
                            }}
                            disabled={isLoad}
                            style={{ background: '#E4F6ED', color: '#1A7A4A', border: '1px solid #86EFAC' }}
                            hoverStyle={{ background: '#BBF7D0' }}
                          >
                            <CheckCircle2 size={14} />
                            {isLoad ? '...' : 'אשרי'}
                          </ActionBtn>

                          <ActionBtn
                            onClick={() => setRejectModal({ appId: app.id, name, phone })}
                            disabled={isLoad}
                            style={{ background: '#F4F4F5', color: '#71717A', border: '1px solid #E4E4E7' }}
                            hoverStyle={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            <XCircle size={14} />דחי
                          </ActionBtn>

                          <ActionBtn
                            onClick={() => setInterview({
                              appId: app.id,
                              name,
                              phone,
                              jobTitle: app.jobs?.title ?? '',
                            })}
                            style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid var(--purple-200)' }}
                            hoverStyle={{ background: 'var(--purple-100)' }}
                          >
                            <Calendar size={14} />קבעי ראיון
                          </ActionBtn>

                          {phone && (
                            <a href={waLink(phone, waMsg(app, 'interview'))}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-bold no-underline transition-all"
                              style={{ background: '#E7FBF0', color: '#25D366', border: '1px solid #BBF7D0' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#BBF7D0'}
                              onMouseLeave={e => e.currentTarget.style.background = '#E7FBF0'}>
                              <MessageCircle size={14} />וואצאפ
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 mt-3">
                          {phone && (
                            <a href={waLink(phone, waMsg(app, app.status === 'התקבלה' ? 'accept' : 'reject'))}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-[12.5px] font-semibold no-underline"
                              style={{ color: 'var(--teal-600)' }}>
                              <MessageCircle size={13} />שלח הודעה
                            </a>
                          )}
                          {app.candidates?.id && (
                            <Link href={`/candidates/${app.candidates.id}`}
                              className="text-[12.5px] font-semibold no-underline"
                              style={{ color: 'var(--ink-3)' }}>
                              פרופיל מלא →
                            </Link>
                          )}
                          {app.status === 'התקבלה' && app.survey_token && (
                            <a
                              href={`/survey?t=${app.survey_token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[12.5px] font-semibold no-underline"
                              style={{ color: '#B45309' }}
                            >
                              <Star size={13} />תני משוב
                            </a>
                          )}
                        </div>
                      )}

                      {/* Delete */}
                      <div className="mt-3 flex justify-end">
                        {deleteConfirm === app.id ? (
                          <div className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5"
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                            <span className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>למחוק הגשה זו?</span>
                            <button
                              onClick={() => deleteApp(app.id)}
                              disabled={deleting === app.id}
                              className="h-6 px-2.5 rounded-[6px] text-[11.5px] font-bold text-white"
                              style={{ background: '#DC2626', opacity: deleting === app.id ? 0.6 : 1 }}>
                              {deleting === app.id ? '...' : 'כן, מחקי'}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="h-6 px-2 rounded-[6px] text-[11.5px] font-semibold"
                              style={{ color: 'var(--ink-3)', background: '#fff', border: '1px solid var(--line)' }}>
                              ביטול
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(app.id)}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-[7px] text-[11.5px] font-semibold transition-all"
                            style={{ color: 'var(--ink-4)', background: 'transparent', border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-4)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
                            <Trash2 size={12} />מחקי הגשה
                          </button>
                        )}
                      </div>

                      {/* Notes + History */}
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                        <div className="flex items-start gap-2">
                          {/* Notes */}
                          <div className="flex-1 min-w-0">
                            {!notesOpen.has(app.id) ? (
                              <button
                                onClick={() => setNotesOpen(prev => new Set([...prev, app.id]))}
                                className="flex items-center gap-1.5 text-[12px] font-semibold py-1 px-2 rounded-[7px] transition-all w-full text-start"
                                style={{ color: notes[app.id] ? 'var(--ink-2)' : 'var(--ink-4)', background: 'transparent' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                              >
                                <StickyNote size={12} style={{ flexShrink: 0 }} />
                                {notes[app.id]
                                  ? <span className="truncate">{notes[app.id]}</span>
                                  : <span>+ הוסיפי הערה פנימית</span>
                                }
                                {savedNote.has(app.id) && (
                                  <span className="flex items-center gap-0.5 ms-auto text-[10px] font-bold" style={{ color: '#1A7A4A' }}>
                                    <Check size={10} />נשמר
                                  </span>
                                )}
                              </button>
                            ) : (
                              <div>
                                <textarea
                                  value={notes[app.id] ?? ''}
                                  onChange={e => setNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                  placeholder="הערה פנימית (גלויה למוסד בלבד)..."
                                  rows={2}
                                  autoFocus
                                  className="w-full px-3 py-2 rounded-[10px] border text-[12.5px] resize-none outline-none leading-relaxed"
                                  style={{ borderColor: 'var(--purple-200)', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'inherit' }}
                                />
                                <div className="flex items-center gap-2 mt-1.5">
                                  <button
                                    onClick={() => saveNote(app.id)}
                                    disabled={savingNote === app.id}
                                    className="flex items-center gap-1 h-7 px-3 rounded-[7px] text-[12px] font-bold transition-all"
                                    style={{ background: 'var(--purple)', color: '#fff', opacity: savingNote === app.id ? 0.6 : 1 }}
                                  >
                                    {savingNote === app.id ? 'שומרת...' : 'שמורי'}
                                  </button>
                                  <button
                                    onClick={() => setNotesOpen(prev => { const s = new Set(prev); s.delete(app.id); return s })}
                                    className="h-7 px-2 rounded-[7px] text-[12px] font-semibold"
                                    style={{ color: 'var(--ink-3)' }}
                                  >
                                    ביטול
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* History toggle */}
                          <button
                            onClick={() => toggleHistory(app.id)}
                            title="היסטוריית שינויים"
                            className="flex items-center gap-1 h-7 px-2 rounded-[7px] text-[11.5px] font-semibold shrink-0 transition-all"
                            style={{
                              color: historyOpen.has(app.id) ? 'var(--purple)' : 'var(--ink-4)',
                              background: historyOpen.has(app.id) ? 'var(--purple-050)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!historyOpen.has(app.id)) e.currentTarget.style.background = 'var(--bg-2)' }}
                            onMouseLeave={e => { if (!historyOpen.has(app.id)) e.currentTarget.style.background = 'transparent' }}
                          >
                            <History size={12} />
                            {historyLoading === app.id ? '...' : 'יומן'}
                          </button>
                        </div>

                        {/* History timeline */}
                        {historyOpen.has(app.id) && (
                          <div className="mt-2 ms-1 ps-3 border-s-2 space-y-2" style={{ borderColor: 'var(--purple-200)' }}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full -ms-[17px] shrink-0" style={{ background: 'var(--purple-200)' }} />
                              <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                                {new Date(app.applied_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>הוגשה ←</span>
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: STATUS_CFG['ממתינה'].bg, color: STATUS_CFG['ממתינה'].color }}>
                                ממתינה
                              </span>
                            </div>
                            {historyLoading === app.id
                              ? <p className="text-[11px] ps-1" style={{ color: 'var(--ink-4)' }}>טוענת...</p>
                              : (historyData[app.id] ?? []).map(entry => {
                                const sc = STATUS_CFG[entry.to_status as AppStatus] ?? { bg: '#F4F4F5', color: '#71717A' }
                                return (
                                  <div key={entry.id} className="flex items-center gap-2 flex-wrap">
                                    <div className="w-2 h-2 rounded-full -ms-[17px] shrink-0" style={{ background: sc.color }} />
                                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                                      {new Date(entry.changed_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {entry.from_status && (
                                      <>
                                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                                          style={{ background: (STATUS_CFG[entry.from_status as AppStatus] ?? { bg: '#F4F4F5', color: '#71717A' }).bg, color: (STATUS_CFG[entry.from_status as AppStatus] ?? { bg: '#F4F4F5', color: '#71717A' }).color }}>
                                          {entry.from_status}
                                        </span>
                                        <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>←</span>
                                      </>
                                    )}
                                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                                      {entry.to_status}
                                    </span>
                                  </div>
                                )
                              })
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.52)' }}
          onClick={e => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="bg-white rounded-[22px] shadow-2xl w-full max-w-sm p-6" dir="rtl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>דחיית מועמדת</h2>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} style={{ color: 'var(--ink-3)' }}>
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] mb-5" style={{ color: 'var(--ink-3)' }}>{rejectModal.name}</p>

            <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>
              סיבת הדחייה (אופציונלי)
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="למשל: ניסיון לא מתאים / המשרה אוישה..."
              rows={3}
              autoFocus
              className="w-full px-3 py-2 rounded-[10px] border text-[13px] resize-none outline-none leading-relaxed mb-5"
              style={{ borderColor: 'var(--line)', background: '#FAFAFA', color: 'var(--ink)', fontFamily: 'inherit' }}
            />

            <div className="flex gap-2">
              {rejectModal.phone && (() => {
                const app = apps.find(a => a.id === rejectModal.appId)
                if (!app) return null
                return (
                  <a href={waLink(rejectModal.phone!, waMsg(app, 'reject'))}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-bold no-underline"
                    style={{ background: '#25D366', color: '#fff' }}
                    onClick={() => {
                      updateStatus(rejectModal.appId, 'נדחתה', rejectReason || undefined)
                      setRejectModal(null)
                      setRejectReason('')
                    }}>
                    <MessageCircle size={14} />דחי + WA
                  </a>
                )
              })()}
              <button
                onClick={() => {
                  updateStatus(rejectModal.appId, 'נדחתה', rejectReason || undefined)
                  setRejectModal(null)
                  setRejectReason('')
                }}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold border"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', background: '#fff' }}>
                דחי בלי WA
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="px-4 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ color: 'var(--ink-3)' }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interview Modal ── */}
      {interview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.52)' }}
          onClick={e => e.target === e.currentTarget && setInterview(null)}>
          <div className="bg-white rounded-[22px] shadow-2xl w-full max-w-sm p-6" dir="rtl">

            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>
                קביעת ראיון
              </h2>
              <button onClick={() => setInterview(null)} style={{ color: 'var(--ink-3)' }}><X size={18} /></button>
            </div>
            <p className="text-[13px] mb-5" style={{ color: 'var(--ink-3)' }}>
              {interview.name} · {interview.jobTitle}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>תאריך *</label>
                <input type="date" value={intDate} onChange={e => setIntDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border text-[13px] outline-none"
                  style={{ borderColor: intDate ? 'var(--purple)' : 'var(--line)' }} />
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>שעה</label>
                <input type="time" value={intTime} onChange={e => setIntTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border text-[13px] outline-none"
                  style={{ borderColor: 'var(--line)' }} />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>
                מיקום (אופציונלי)
              </label>
              <input type="text" value={intLocation} onChange={e => setIntLocation(e.target.value)}
                placeholder="כתובת / Zoom / טלפון..."
                className="w-full h-10 px-3 rounded-[8px] border text-[13px] outline-none"
                style={{ borderColor: 'var(--line)' }} />
            </div>

            <div className="flex gap-3">
              {interview.phone && intDate && (() => {
                const dt = new Date(`${intDate}T${intTime}`).toLocaleString('he-IL', {
                  weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })
                const msg = `שלום ${interview.name.split(' ')[0]}, מ${institutionName}.\nנשמח לראיינך למשרת "${interview.jobTitle}" בתאריך ${dt}${intLocation ? ', ב' + intLocation : ''}.\nנא אשרי קבלה.\nבברכה`
                return (
                  <a href={waLink(interview.phone, msg)} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[14px] font-bold no-underline"
                    style={{ background: '#25D366', color: '#fff', boxShadow: '0 3px 10px rgba(37,211,102,.3)' }}
                    onClick={scheduleInterview}>
                    <MessageCircle size={15} />שלח + שמור
                  </a>
                )
              })()}
              <button onClick={scheduleInterview} disabled={savingInt || !intDate}
                className="px-5 py-2.5 rounded-[10px] text-[13.5px] font-bold border transition-all"
                style={{
                  borderColor: intDate ? 'var(--purple)' : 'var(--line)',
                  color: intDate ? 'var(--purple)' : 'var(--ink-3)',
                  background: '#fff',
                  opacity: !intDate ? 0.5 : 1,
                }}>
                {savingInt ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Reusable action button ── */
function ActionBtn({
  children, onClick, disabled, style, hoverStyle,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style: React.CSSProperties
  hoverStyle: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-bold transition-all"
      style={style}
      onMouseEnter={e => Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, style)}
    >
      {children}
    </button>
  )
}
