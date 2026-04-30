'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { Application, Candidate, Profile } from '@/lib/types'
import {
  Calendar, MessageCircle, Check, X, ChevronDown, ChevronUp,
  GraduationCap, MapPin, Phone, BookOpen, AlertCircle, Loader2,
} from 'lucide-react'

type AppWithDetails = Application & {
  candidates: (Candidate & { profiles: Profile }) | null
}

interface Interview {
  id: string
  application_id: string
  scheduled_at: string
  location: string | null
  notes: string | null
  candidate_confirmed: boolean | null
}

interface Props {
  applications: AppWithDetails[]
  jobId: string
  jobStatus: string
  jobTitle?: string
}

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; strip: string }> = {
  'ממתינה': { bg: '#F5F3FF', color: '#5B21B6', dot: '#8B5CF6', strip: '#8B5CF6' },
  'נצפתה':  { bg: '#E0F2FE', color: '#0369A1', dot: '#0EA5E9', strip: '#0EA5E9' },
  'התקבלה': { bg: '#DCFCE7', color: '#166534', dot: '#22C55E', strip: '#22C55E' },
  'נדחתה':  { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444', strip: '#EF4444' },
  'בוטלה':  { bg: '#F4F4F5', color: '#71717A', dot: '#A1A1AA', strip: '#A1A1AA' },
}

const JOB_STATUSES = ['פעילה', 'מושהית', 'אוישה', 'בוטלה', 'פג תוקפה']

const JOB_STATUS_BG: Record<string, string> = {
  'פעילה':    '#DCFCE7', 'מושהית': '#FEF3C7', 'אוישה': '#EDE9FE',
  'בוטלה':    '#F3F4F6', 'פג תוקפה': '#F3F4F6',
}
const JOB_STATUS_COLOR: Record<string, string> = {
  'פעילה':    '#166534', 'מושהית': '#92400E', 'אוישה': '#5B21B6',
  'בוטלה':    '#6B7280', 'פג תוקפה': '#6B7280',
}

const GRADIENTS = [
  'linear-gradient(135deg,#5B3E9E,#00BCC8)',
  'linear-gradient(135deg,#C2185B,#FF8A65)',
  'linear-gradient(135deg,#1565C0,#42A5F5)',
  'linear-gradient(135deg,#2E7D32,#66BB6A)',
  'linear-gradient(135deg,#6A1B9A,#CE93D8)',
]

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

function CoverLetterRow({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const isLong = text.length > 110
  return (
    <div className="mt-3 px-4 py-3 rounded-[10px]"
      style={{ background: 'var(--purple-050)', border: '1px solid var(--purple-100)' }}>
      <p className="text-[11px] font-bold uppercase tracking-[.07em] mb-1.5" style={{ color: 'var(--ink-4)' }}>
        מכתב לוויה
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
        {isLong && !open ? text.slice(0, 110) + '…' : text}
      </p>
      {isLong && (
        <button onClick={() => setOpen(p => !p)}
          className="flex items-center gap-1 mt-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--purple)' }}>
          {open ? <><ChevronUp size={12} />פחות</> : <><ChevronDown size={12} />קרא עוד</>}
        </button>
      )}
    </div>
  )
}

export default function ApplicationsInboxClient({
  applications: initial, jobId, jobStatus: initJobStatus, jobTitle = '',
}: Props) {
  const [apps, setApps]             = useState(initial)
  const [jobStatus, setJobStatus]   = useState(initJobStatus)
  const [interviews, setInterviews] = useState<Record<string, Interview>>({})
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null)
  const [form, setForm] = useState({ date: '', time: '', location: '', notes: '' })
  const [saving, setSaving]           = useState(false)
  const [confirmAccept, setConfirmAccept] = useState<string | null>(null)
  const [processing, setProcessing]   = useState<string | null>(null)

  async function changeStatus(appId: string, status: string) {
    setProcessing(appId)
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setProcessing(null)
    if (!res.ok) return
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: status as Application['status'] } : a))
    if (status === 'התקבלה') setJobStatus('אוישה')
    return true
  }

  async function handleAccept(appId: string) {
    const ok = await changeStatus(appId, 'התקבלה')
    if (ok) {
      const app = apps.find(a => a.id === appId)
      if (app) window.open(waLink(app, 'acceptance'), '_blank')
      setConfirmAccept(null)
    }
  }

  async function handleReject(appId: string) {
    const ok = await changeStatus(appId, 'נדחתה')
    if (ok) {
      const app = apps.find(a => a.id === appId)
      if (app) window.open(waLink(app, 'rejection'), '_blank')
    }
  }

  async function updateJobStatus(status: string) {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setJobStatus(status)
      if (status === 'אוישה' || status === 'בוטלה') {
        setApps(prev => prev.map(a =>
          ['ממתינה', 'נצפתה'].includes(a.status) ? { ...a, status: 'נדחתה' as Application['status'] } : a
        ))
      }
    }
  }

  async function scheduleInterview(appId: string) {
    if (!form.date || !form.time) return
    setSaving(true)
    const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString()
    const res = await fetch('/api/interviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId, scheduled_at, location: form.location || null, notes: form.notes || null }),
    })
    if (res.ok) {
      const iv = await res.json()
      setInterviews(p => ({ ...p, [appId]: iv }))
      setSchedulingFor(null)
      setForm({ date: '', time: '', location: '', notes: '' })
      const app = apps.find(a => a.id === appId)
      if (app) window.open(waLink(app, 'interview', iv), '_blank')
    }
    setSaving(false)
  }

  function waLink(app: AppWithDetails, type: 'interview' | 'rejection' | 'acceptance', iv?: Interview) {
    const cand = app.candidates
    const rawPhone = cand?.profiles?.phone?.replace(/\D/g, '') ?? ''
    const phone = rawPhone.startsWith('0') ? '972' + rawPhone.slice(1) : rawPhone
    const firstName = (cand?.profiles?.full_name ?? '').split(' ')[0] || 'שלום'

    let text = ''
    if (type === 'interview' && iv) {
      text = `שלום ${firstName},\nרצינו לעדכן שאת מוזמנת לראיון למשרת "${jobTitle}".\nתאריך: ${fmtDt(iv.scheduled_at)}${iv.location ? '\nמיקום: ' + iv.location : ''}${iv.notes ? '\n' + iv.notes : ''}\n\nנשמח שתאשרי את הגעתך.`
    } else if (type === 'rejection') {
      text = `שלום ${firstName}, תודה שפנית אלינו, המשרה אינה רלוונטית, מאחלים לך הצלחה רבה!`
    } else if (type === 'acceptance') {
      text = `שלום ${firstName}, ברכות! התקבלת למשרת "${jobTitle}".\nנציג מהמוסד יצור איתך קשר בקרוב לגבי הפרטים.`
    }

    return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me?text=${encodeURIComponent(text)}`
  }

  return (
    <div dir="rtl">
      {/* Job status bar */}
      <div className="flex items-center gap-3 mb-5 p-4 rounded-[14px]"
        style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-3)' }}>סטטוס משרה</span>
        <div className="flex gap-1.5 flex-wrap">
          {JOB_STATUSES.map(s => (
            <button key={s}
              onClick={() => updateJobStatus(s)}
              className="h-7 px-3 rounded-full text-[12px] font-bold transition-all"
              style={jobStatus === s
                ? { background: JOB_STATUS_BG[s] ?? '#F3F4F6', color: JOB_STATUS_COLOR[s] ?? '#6B7280', boxShadow: '0 0 0 2px ' + (JOB_STATUS_COLOR[s] ?? '#6B7280') + '40' }
                : { background: 'var(--bg-2)', color: 'var(--ink-3)' }}>
              {s}
            </button>
          ))}
        </div>
        <span className="ms-auto text-[12.5px] font-bold px-3 py-1 rounded-full"
          style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>
          {apps.length} הגשות
        </span>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-[16px] border flex flex-col items-center py-16 text-center"
          style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--bg-2)' }}>
            <GraduationCap size={22} style={{ color: 'var(--ink-4)' }} />
          </div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-3)' }}>עדיין אין הגשות</p>
          <p className="text-[12.5px] mt-1" style={{ color: 'var(--ink-4)' }}>מועמדות שיגישו מועמדות יופיעו כאן</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app, idx) => {
            const cand = app.candidates
            const prof = cand?.profiles
            const cfg  = STATUS_CFG[app.status] ?? STATUS_CFG['ממתינה']
            const iv   = interviews[app.id]
            const name = prof?.full_name ?? 'ללא שם'
            const grad = GRADIENTS[idx % GRADIENTS.length]
            const initials = name !== 'ללא שם' ? name.split(' ').slice(0, 2).map(w => w[0]).join('') : '?'
            const isTerminal = ['התקבלה', 'נדחתה', 'בוטלה'].includes(app.status)
            const isProc = processing === app.id

            return (
              <div key={app.id} className="rounded-[16px] overflow-hidden"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>

                {/* Status strip */}
                <div className="h-[3px]" style={{ background: cfg.strip }} />

                {/* Candidate header */}
                <div className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ background: grad }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>{name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[12px]" style={{ color: 'var(--ink-3)' }}>
                          {cand?.city && (
                            <span className="flex items-center gap-1"><MapPin size={11} />{cand.city}</span>
                          )}
                          {cand?.academic_level && (
                            <span className="flex items-center gap-1"><GraduationCap size={11} />{cand.academic_level}</span>
                          )}
                          {cand?.college && <span>{cand.college}</span>}
                        </div>
                        {(cand as any)?.study_day && (
                          <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-[6px]"
                            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <BookOpen size={11} style={{ color: '#D97706' }} />
                            <span className="text-[11.5px] font-bold" style={{ color: '#92400E' }}>
                              {(cand as any).study_day}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {app.status}
                        </span>
                        <span className="text-[11.5px]" style={{ color: 'var(--ink-4)' }}>
                          {formatDate(app.applied_at)}
                        </span>
                      </div>
                    </div>

                    {/* Phone */}
                    {prof?.phone && (
                      <a href={`tel:${prof.phone}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-[12.5px] font-semibold"
                        style={{ color: 'var(--teal)' }} dir="ltr">
                        <Phone size={12} />{prof.phone}
                      </a>
                    )}

                    {cand?.cv_url && (
                      <a href={cand.cv_url} target="_blank" rel="noreferrer"
                        className="block mt-1 text-[12px] font-semibold"
                        style={{ color: 'var(--purple)' }}>
                        קורות חיים ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Cover letter */}
                {app.cover_letter && (
                  <div className="px-5 pb-1">
                    <CoverLetterRow text={app.cover_letter} />
                  </div>
                )}

                {/* Interview info */}
                {iv && (
                  <div className="mx-5 mb-3 mt-2 p-3 rounded-[10px]"
                    style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar size={13} style={{ color: 'var(--purple)' }} />
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--purple)' }}>
                        ראיון: {fmtDt(iv.scheduled_at)}
                      </span>
                      {iv.candidate_confirmed === true && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>
                          ✓ אושר
                        </span>
                      )}
                      {iv.candidate_confirmed === false && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                          ביטל
                        </span>
                      )}
                      {iv.candidate_confirmed === null && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                          ממתין לאישור
                        </span>
                      )}
                    </div>
                    {iv.location && (
                      <p className="text-[12px] mt-1 ms-5" style={{ color: '#5B21B6' }}>📍 {iv.location}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>

                  {/* Acceptance confirmation inline */}
                  {confirmAccept === app.id ? (
                    <div className="p-4 rounded-[12px]"
                      style={{ background: '#F0FDF4', border: '1px solid #86EFAC' }}>
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle size={16} style={{ color: '#15803D', marginTop: '2px', flexShrink: 0 }} />
                        <p className="text-[13.5px] font-semibold leading-snug" style={{ color: '#166534' }}>
                          קבלת {name} למשרה זו תסגור אותה לפניות נוספות ותסמן את המועמדת כ"משובצת".
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(app.id)}
                          disabled={isProc}
                          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13.5px] font-bold text-white"
                          style={{ background: '#16A34A' }}>
                          {isProc ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                          {isProc ? 'מעדכן...' : 'אשרי — קבלי מועמדת'}
                        </button>
                        <button onClick={() => setConfirmAccept(null)}
                          className="h-10 px-4 rounded-[10px] border text-[13px] font-semibold"
                          style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : isTerminal ? (
                    /* Terminal state — just WA links */
                    <div className="flex gap-2 flex-wrap">
                      {app.status === 'התקבלה' && (
                        <>
                          <span className="flex items-center gap-1.5 text-[13px] font-bold"
                            style={{ color: '#166534' }}>
                            <Check size={15} />המשרה אוישה בהצלחה
                          </span>
                          <a href={waLink(app, 'acceptance')} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-semibold ms-auto"
                            style={{ background: '#DCFCE7', color: '#166534' }}>
                            <MessageCircle size={13} />שלחי ברכות בוואצאפ
                          </a>
                        </>
                      )}
                      {app.status === 'נדחתה' && (
                        <a href={waLink(app, 'rejection')} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-semibold"
                          style={{ background: '#F4F4F5', color: '#71717A' }}>
                          <MessageCircle size={13} />שלחי הודעת דחייה מנומסת
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Active state — action buttons */
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSchedulingFor(schedulingFor === app.id ? null : app.id)
                          setForm({ date: '', time: '', location: '', notes: '' })
                        }}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
                        style={{ background: '#EDE9FE', color: '#5B21B6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#DDD6FE')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#EDE9FE')}>
                        <Calendar size={14} />
                        {schedulingFor === app.id ? 'ביטול' : iv ? 'ראיון חלופי' : 'זמן לראיון'}
                      </button>

                      <button
                        onClick={() => setConfirmAccept(app.id)}
                        disabled={isProc}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
                        style={{ background: '#DCFCE7', color: '#166534' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#BBF7D0')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#DCFCE7')}>
                        <Check size={14} />קבלה
                      </button>

                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={isProc}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
                        style={{ background: '#F4F4F5', color: '#71717A' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#E4E4E7')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#F4F4F5')}>
                        <X size={14} />דחייה מנומסת
                      </button>

                      {iv && (
                        <a href={waLink(app, 'interview', iv)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-semibold ms-auto"
                          style={{ background: '#E7FBF0', color: '#25D366' }}>
                          <MessageCircle size={13} />שלחי הזמנה לראיון
                        </a>
                      )}
                    </div>
                  )}

                  {/* Interview scheduling form */}
                  {schedulingFor === app.id && (
                    <div className="mt-4 p-4 rounded-[12px]"
                      style={{ background: '#F8F7FF', border: '1px solid #DDD8FF' }}>
                      <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--purple)' }}>קביעת ראיון</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--ink-3)' }}>תאריך</label>
                          <input type="date" value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            className="w-full text-[13px] border rounded-[8px] px-3 py-1.5 outline-none"
                            style={{ borderColor: '#DDD8FF' }} />
                        </div>
                        <div>
                          <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--ink-3)' }}>שעה</label>
                          <input type="time" value={form.time}
                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                            className="w-full text-[13px] border rounded-[8px] px-3 py-1.5 outline-none"
                            style={{ borderColor: '#DDD8FF' }} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--ink-3)' }}>מיקום (אופציונלי)</label>
                        <input type="text" value={form.location} placeholder="כתובת / זום"
                          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                          className="w-full text-[13px] border rounded-[8px] px-3 py-1.5 outline-none"
                          style={{ borderColor: '#DDD8FF' }} />
                      </div>
                      <div className="mb-3">
                        <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--ink-3)' }}>הערות לגבי הראיון (אופציונלי)</label>
                        <input type="text" value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          className="w-full text-[13px] border rounded-[8px] px-3 py-1.5 outline-none"
                          style={{ borderColor: '#DDD8FF' }} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => scheduleInterview(app.id)}
                          disabled={saving || !form.date || !form.time}
                          className="flex-1 flex items-center justify-center gap-2 h-10 text-[13.5px] font-bold rounded-[10px] text-white transition-all"
                          style={{
                            background: form.date && form.time ? 'var(--purple)' : 'var(--bg-3)',
                            color: form.date && form.time ? '#fff' : 'var(--ink-4)',
                          }}>
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                          {saving ? 'שולח...' : 'שמרי ושלחי הזמנה בוואצאפ'}
                        </button>
                        <button onClick={() => setSchedulingFor(null)}
                          className="h-10 px-4 rounded-[10px] text-[13px] font-semibold"
                          style={{ background: '#F4F4F5', color: '#71717A' }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
