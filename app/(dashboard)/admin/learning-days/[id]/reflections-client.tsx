'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, UserPlus, MessageSquare, CheckCircle2, AlertCircle, HelpCircle, Clock } from 'lucide-react'
import type { LearningDay, LearningDayReflection, LearningDayAttendee, ReflectionStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const STATUS_CFG: Record<ReflectionStatus, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  'ממתין לשיקוף': { bg: '#FFF7ED', color: '#C2410C', icon: <Clock size={12} />, label: 'ממתין לשיקוף' },
  'שיקוף התקבל':  { bg: '#F0FDF4', color: '#15803D', icon: <CheckCircle2 size={12} />, label: 'שיקוף התקבל' },
  'לא השיב':       { bg: '#FEF2F2', color: '#DC2626', icon: <AlertCircle size={12} />, label: 'לא השיב' },
  'דורש בירור':   { bg: '#FAF5FF', color: '#7C3AED', icon: <HelpCircle size={12} />, label: 'דורש בירור' },
}

type CandidateRef = { id: string; profiles: { id: string; full_name: string | null } | null }

interface Props {
  day: LearningDay
  attendees: LearningDayAttendee[]
  reflections: LearningDayReflection[]
  allCandidates: CandidateRef[]
}

export default function ReflectionsClient({ day, attendees: initAttendees, reflections: initReflections, allCandidates }: Props) {
  const router = useRouter()
  const [attendees, setAttendees] = useState(initAttendees)
  const [reflections, setReflections] = useState(initReflections)
  const [addingCandidateId, setAddingCandidateId] = useState('')
  const [activeReflection, setActiveReflection] = useState<LearningDayReflection | null>(null)
  const [noteText, setNoteText] = useState('')

  const attendeeIds = new Set(attendees.map(a => a.candidate_id))

  async function addAttendee() {
    if (!addingCandidateId) return
    const res = await fetch(`/api/learning-days/${day.id}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_ids: [addingCandidateId] }),
    })
    if (res.ok) {
      router.refresh()
      setAddingCandidateId('')
      toast.success('משתתפת נוספה')
    } else toast.error('שגיאה')
  }

  async function removeAttendee(candidateId: string) {
    const res = await fetch(`/api/learning-days/${day.id}/attendees`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: candidateId }),
    })
    if (res.ok) {
      setAttendees(a => a.filter(x => x.candidate_id !== candidateId))
      toast.success('הוסרה')
    }
  }

  async function changeStatus(candidateId: string, status: ReflectionStatus) {
    const res = await fetch(`/api/learning-days/${day.id}/reflections/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setReflections(r => r.map(x => x.candidate_id === candidateId ? updated : x))
      toast.success('עודכן')
    }
  }

  async function saveNote() {
    if (!activeReflection) return
    const res = await fetch(`/api/learning-days/${day.id}/reflections/${activeReflection.candidate_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_notes: noteText }),
    })
    if (res.ok) {
      setReflections(r => r.map(x => x.candidate_id === activeReflection.candidate_id ? { ...x, review_notes: noteText } : x))
      setActiveReflection(null)
      toast.success('הערה נשמרה')
    }
  }

  const reflectionMap = new Map(reflections.map(r => [r.candidate_id, r]))
  const statCounts = Object.fromEntries(
    Object.keys(STATUS_CFG).map(s => [s, reflections.filter(r => r.status === s).length])
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push('/admin/learning-days')}
            className="flex items-center gap-1.5 text-[12px] font-semibold mb-3 hover:opacity-70"
            style={{ color: 'var(--ink-3)' }}>
            <ArrowRight size={14} /> חזרה לימי לימוד
          </button>
          <h1 className="page-title">{day.title}</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{formatDate(day.day_date)} {day.location && `· ${day.location}`}</p>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div key={status} className="rounded-2xl p-4 text-center" style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
            <div className="text-2xl font-black" style={{ color: cfg.color }}>{statCounts[status] ?? 0}</div>
            <div className="text-[11px] font-semibold mt-0.5 flex items-center justify-center gap-1" style={{ color: cfg.color }}>
              {cfg.icon}{cfg.label}
            </div>
          </div>
        ))}
      </div>

      {/* Add attendee */}
      <div className="rounded-2xl bg-white p-4 mb-6 flex items-center gap-3"
        style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
        <UserPlus size={16} style={{ color: 'var(--teal)' }} className="shrink-0" />
        <select value={addingCandidateId} onChange={e => setAddingCandidateId(e.target.value)}
          className="flex-1 h-9 rounded-lg border px-3 text-[13px] focus:outline-none"
          style={{ borderColor: 'var(--line)' }}>
          <option value="">הוסף משתתפת...</option>
          {allCandidates.filter(c => !attendeeIds.has(c.id)).map(c => (
            <option key={c.id} value={c.id}>{c.profiles?.full_name ?? c.id}</option>
          ))}
        </select>
        <button onClick={addAttendee} disabled={!addingCandidateId}
          className="px-4 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--teal)' }}>הוסף</button>
      </div>

      {/* Attendees table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
          <span className="font-bold text-[13px]" style={{ color: 'var(--ink)' }}>משתתפות ({attendees.length})</span>
        </div>
        <div className="divide-y" style={{ '--divide-color': 'var(--line)' } as React.CSSProperties}>
          {attendees.map(att => {
            const cand = att.candidates as unknown as { id: string; profiles: { id: string; full_name: string | null; phone: string | null } | null } | null
            const reflection = reflectionMap.get(att.candidate_id)
            const cfg = reflection ? STATUS_CFG[reflection.status as ReflectionStatus] : STATUS_CFG['ממתין לשיקוף']

            return (
              <div key={att.id} className="px-5 py-3 flex items-center gap-3 bg-white">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]" style={{ color: 'var(--ink)' }}>
                    {cand?.profiles?.full_name ?? att.candidate_id}
                  </div>
                  {cand?.profiles?.phone && (
                    <div className="text-[11px]" style={{ color: 'var(--ink-3)' }} dir="ltr">{cand.profiles.phone}</div>
                  )}
                </div>

                {reflection?.reflection_text && (
                  <button
                    onClick={() => { setActiveReflection(reflection); setNoteText(reflection.review_notes ?? '') }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium hover:opacity-80"
                    style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                    <MessageSquare size={11} /> שיקוף
                  </button>
                )}

                {/* Status selector */}
                <select
                  value={reflection?.status ?? 'ממתין לשיקוף'}
                  onChange={e => changeStatus(att.candidate_id, e.target.value as ReflectionStatus)}
                  className="text-[11px] font-bold px-2 py-1 rounded-xl border-0 focus:outline-none"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button onClick={() => removeAttendee(att.candidate_id)}
                  className="text-[11px] text-red-400 hover:text-red-600 px-2 py-1">הסר</button>
              </div>
            )
          })}
          {!attendees.length && (
            <div className="px-5 py-8 text-center text-[13px] bg-white" style={{ color: 'var(--ink-4)' }}>
              אין משתתפות — הוסיפי מהרשימה למעלה
            </div>
          )}
        </div>
      </div>

      {/* Reflection detail modal */}
      {activeReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveReflection(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-[15px]" style={{ color: 'var(--ink)' }}>שיקוף</h3>
            <div className="rounded-xl p-4 text-[13px] leading-relaxed whitespace-pre-line"
              style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
              {activeReflection.reflection_text}
            </div>
            {activeReflection.submitted_at && (
              <p className="text-[11px]" style={{ color: 'var(--ink-4)' }}>הוגש: {formatDate(activeReflection.submitted_at)}</p>
            )}
            <div>
              <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>הערת מנהלת</label>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                rows={3} className="w-full rounded-lg border px-3 py-2 text-[13px] resize-none focus:outline-none"
                style={{ borderColor: 'var(--line)' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveReflection(null)}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>סגור</button>
              <button onClick={saveNote}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white"
                style={{ background: 'var(--teal)' }}>שמור הערה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
