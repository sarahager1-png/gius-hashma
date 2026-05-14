'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, BookOpen, Users, Send, ChevronLeft, X, Calendar } from 'lucide-react'
import type { LearningDay } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'ממתין לשיקוף': { bg: '#FFF7ED', color: '#C2410C', label: 'ממתין' },
  'שיקוף התקבל':  { bg: '#F0FDF4', color: '#15803D', label: 'התקבל' },
  'לא השיב':       { bg: '#FEF2F2', color: '#DC2626', label: 'לא השיב' },
  'דורש בירור':   { bg: '#FAF5FF', color: '#7C3AED', label: 'בירור' },
}

interface Props {
  days: LearningDay[]
  attendeeMap: Record<string, number>
  reflectionMap: Record<string, Record<string, number>>
}

export default function LearningDaysClient({ days: initDays, attendeeMap, reflectionMap }: Props) {
  const router = useRouter()
  const [days, setDays] = useState(initDays)
  const [showNew, setShowNew] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', day_date: '', location: '', description: '', reflection_prompt: 'שלחי שיקוף קצר על יום הלימוד — מה לקחת איתך?' })

  async function createDay(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/learning-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const created = await res.json()
      setDays(d => [created, ...d])
      setShowNew(false)
      setForm({ title: '', day_date: '', location: '', description: '', reflection_prompt: 'שלחי שיקוף קצר על יום הלימוד — מה לקחת איתך?' })
      toast.success('יום לימוד נוצר')
    } catch (e) {
      toast.error(String(e))
    }
  }

  async function sendReflections(dayId: string) {
    setSending(dayId)
    try {
      const res = await fetch(`/api/learning-days/${dayId}/send-reflections`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.sent} בקשות שיקוף נשלחו`)
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl" dir="rtl">
      <div className="flex items-start justify-between mb-6">
        <div className="page-header">
          <h1 className="page-title">ימי לימוד</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{days.length} ימים · מעקב שיקופים</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white"
          style={{ background: 'var(--teal)' }}>
          <Plus size={14} /> יום חדש
        </button>
      </div>

      <div className="grid gap-4">
        {days.map(day => {
          const attendees = attendeeMap[day.id] ?? 0
          const refs = reflectionMap[day.id] ?? {}
          const totalRefs = Object.values(refs).reduce((s, n) => s + n, 0)

          return (
            <div key={day.id} className="rounded-2xl bg-white p-5 flex flex-col gap-4"
              style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'var(--bg-2)' }}>
                    <BookOpen size={18} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div>
                    <div className="font-bold text-[15px]" style={{ color: 'var(--ink)' }}>{day.title}</div>
                    <div className="flex items-center gap-3 mt-0.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(day.day_date)}</span>
                      {day.location && <span>{day.location}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => sendReflections(day.id)}
                    disabled={!!sending || attendees === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-white disabled:opacity-50"
                    style={{ background: day.reflection_sent_at ? 'var(--ink-4)' : 'var(--teal)' }}>
                    {sending === day.id ? '...' : <><Send size={12} />{day.reflection_sent_at ? 'שלח שוב' : 'שלח שיקוף'}</>}
                  </button>
                  <button onClick={() => router.push(`/admin/learning-days/${day.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
                    style={{ color: 'var(--ink-3)', borderColor: 'var(--line)' }}>
                    <Users size={12} />משתתפות
                    <ChevronLeft size={12} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'var(--bg-2)' }}>
                  <div className="text-[18px] font-black" style={{ color: 'var(--ink)' }}>{attendees}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--ink-3)' }}>משתתפות</div>
                </div>
                {Object.entries(STATUS_COLORS).map(([status, cfg]) => (
                  <div key={status} className="rounded-xl px-3 py-2 text-center" style={{ background: cfg.bg }}>
                    <div className="text-[18px] font-black" style={{ color: cfg.color }}>{refs[status] ?? 0}</div>
                    <div className="text-[10px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
                  </div>
                ))}
              </div>

              {day.reflection_sent_at && (
                <p className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                  שיקוף נשלח: {formatDate(day.reflection_sent_at)} · {totalRefs}/{attendees} הגיבו
                </p>
              )}
            </div>
          )
        })}

        {!days.length && (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px solid var(--line)' }}>
            <BookOpen size={40} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} />
            <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין ימי לימוד עדיין</p>
          </div>
        )}
      </div>

      {/* New day modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <h2 className="font-black text-[15px]" style={{ color: 'var(--ink)' }}>יום לימוד חדש</h2>
              <button onClick={() => setShowNew(false)} style={{ color: 'var(--ink-4)' }}><X size={16} /></button>
            </div>
            <form onSubmit={createDay} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>שם היום *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>תאריך *</label>
                <input required type="date" value={form.day_date} onChange={e => setForm(f => ({ ...f, day_date: e.target.value }))}
                  className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>מיקום</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>שאלת שיקוף</label>
                <textarea value={form.reflection_prompt} onChange={e => setForm(f => ({ ...f, reflection_prompt: e.target.value }))}
                  rows={2} className="w-full rounded-lg border px-3 py-2 text-[13px] resize-none focus:outline-none"
                  style={{ borderColor: 'var(--line)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>ביטול</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white"
                  style={{ background: 'var(--teal)' }}>צור</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
