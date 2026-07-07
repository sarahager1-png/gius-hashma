'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar, MapPin, Phone, Clock, CheckCircle2, XCircle,
  MessageCircle, Briefcase, Star, List, CalendarDays,
} from 'lucide-react'

export interface InterviewRow {
  id: string
  application_id: string
  scheduled_at: string
  location: string | null
  notes: string | null
  candidate_confirmed: boolean | null
  created_at: string
  job_title: string | null
  candidate_name: string | null
  candidate_phone: string | null
  candidate_city: string | null
  institution_rating?: number | null
  institution_notes?: string | null
}

interface Props {
  interviews: InterviewRow[]
  institutionName: string
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

function fmtDay(dt: string) {
  return new Date(dt).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function waLink(phone: string | null, name: string | null, jobTitle: string | null, dt: string) {
  if (!phone) return '#'
  const n   = phone.replace(/\D/g, '').replace(/^0/, '972')
  const fmt = new Date(dt).toLocaleString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  const msg = `שלום ${name?.split(' ')[0] ?? ''},\nתזכורת לראיון שלנו למשרת "${jobTitle ?? ''}" בתאריך ${fmt}.\nנשמח לאישורך!\nבברכה`
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`
}

// ────────────────── Calendar View ──────────────────

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

function CalendarView({ interviews }: { interviews: InterviewRow[] }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Map dateKey → interviews
  const byDay: Record<string, InterviewRow[]> = {}
  for (const iv of interviews) {
    const key = iv.scheduled_at.substring(0, 10)
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(iv)
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay  = new Date(viewYear, viewMonth + 1, 0)
  // start from Sunday
  const startDow = firstDay.getDay()
  const cells: (string | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(key)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const todayKey = today.toISOString().substring(0, 10)
  const selectedIvs = selectedDay ? (byDay[selectedDay] ?? []) : []

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <button onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-bold transition-all"
          style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>‹</button>
        <span className="text-[16px] font-extrabold" style={{ color: 'var(--ink)' }}>
          {HE_MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-bold transition-all"
          style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>›</button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 text-center mb-1">
        {HE_DAYS.map(d => (
          <div key={d} className="text-[11px] font-bold py-1" style={{ color: 'var(--ink-4)' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, i) => {
          if (!key) return <div key={i} />
          const day = parseInt(key.substring(8), 10)
          const hasIvs = byDay[key]?.length > 0
          const isToday = key === todayKey
          const isSelected = key === selectedDay
          const isPast = key < todayKey

          return (
            <button key={key}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className="aspect-square flex flex-col items-center justify-center rounded-[10px] text-[13px] font-bold transition-all relative"
              style={{
                background: isSelected
                  ? 'var(--purple)'
                  : isToday
                  ? 'var(--purple-050)'
                  : hasIvs
                  ? 'var(--teal-050)'
                  : 'transparent',
                color: isSelected
                  ? '#fff'
                  : isToday
                  ? 'var(--purple)'
                  : isPast
                  ? 'var(--ink-4)'
                  : 'var(--ink)',
                border: isToday && !isSelected ? '1.5px solid var(--purple)' : '1.5px solid transparent',
              }}>
              {day}
              {hasIvs && (
                <div className="flex gap-0.5 mt-0.5">
                  {byDay[key].slice(0, 3).map((_, j) => (
                    <span key={j} className="w-1 h-1 rounded-full"
                      style={{ background: isSelected ? 'rgba(255,255,255,.7)' : 'var(--teal)' }} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day interviews */}
      {selectedDay && (
        <div className="mt-4 rounded-[14px] border p-4" style={{ borderColor: 'var(--line)', background: '#fff' }}>
          <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--ink-2)' }}>
            {fmtDay(selectedDay + 'T12:00:00')} — {selectedIvs.length} ראיונות
          </p>
          {selectedIvs.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>אין ראיונות ביום זה</p>
          ) : (
            <div className="space-y-2">
              {selectedIvs.map(iv => (
                <div key={iv.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--bg-2)' }}>
                  <div className="text-[12px] font-bold w-12 shrink-0" style={{ color: 'var(--purple)' }}>
                    {fmtTime(iv.scheduled_at)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate" style={{ color: 'var(--ink)' }}>{iv.candidate_name ?? '—'}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--ink-4)' }}>{iv.job_title ?? '—'}</p>
                  </div>
                  {iv.candidate_confirmed === true && (
                    <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                  )}
                  {iv.candidate_confirmed === false && (
                    <XCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────── Main Component ──────────────────

export default function InterviewsClient({ interviews }: Props) {
  const now = new Date()
  const [tab, setTab] = useState<'upcoming' | 'past'>(
    interviews.some(iv => new Date(iv.scheduled_at) >= now) ? 'upcoming' : 'past'
  )
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const iv of interviews) {
      if (iv.institution_rating) init[iv.id] = iv.institution_rating
    }
    return init
  })
  const [ratingNotes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const iv of interviews) {
      if (iv.institution_notes) init[iv.id] = iv.institution_notes
    }
    return init
  })

  async function saveRating(ivId: string, rating: number) {
    setRatings(prev => ({ ...prev, [ivId]: rating }))
    await fetch(`/api/interviews/${ivId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_rating: rating, institution_notes: ratingNotes[ivId] ?? null }),
    })
  }

  const upcoming = interviews.filter(iv => new Date(iv.scheduled_at) >= now)
  const past     = interviews.filter(iv => new Date(iv.scheduled_at) <  now)
  const visible  = tab === 'upcoming' ? upcoming : past.slice().reverse()

  // Group by date
  const groups: { dateKey: string; label: string; items: InterviewRow[] }[] = []
  for (const iv of visible) {
    const key = iv.scheduled_at.substring(0, 10)
    let g = groups.find(x => x.dateKey === key)
    if (!g) {
      g = { dateKey: key, label: fmtDay(iv.scheduled_at), items: [] }
      groups.push(g)
    }
    g.items.push(iv)
  }

  function dateLabel(key: string) {
    const today    = now.toISOString().substring(0, 10)
    const tomorrow = new Date(now.getTime() + 86_400_000).toISOString().substring(0, 10)
    if (key === today)    return 'היום'
    if (key === tomorrow) return 'מחר'
    return fmtDay(key + 'T00:00:00')
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl" dir="rtl">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.12em] mb-1.5" style={{ color: 'var(--teal-600)' }}>
            לוח ראיונות
          </p>
          <h1 className="text-[30px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
            ראיונות
          </h1>
          <p className="text-[14px] font-medium mt-1.5" style={{ color: 'var(--ink-3)' }}>
            {upcoming.length} קרובים · {past.length} שעברו
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-[10px] p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
            <button onClick={() => setView('list')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-semibold transition-all"
              style={view === 'list'
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }
                : { color: 'var(--ink-4)' }}>
              <List size={13} />רשימה
            </button>
            <button onClick={() => setView('calendar')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-semibold transition-all"
              style={view === 'calendar'
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }
                : { color: 'var(--ink-4)' }}>
              <CalendarDays size={13} />לוח שנה
            </button>
          </div>
          <Link href="/institution/candidates"
            className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-semibold text-white no-underline"
            style={{ background: 'var(--purple)' }}>
            + הזמינה
          </Link>
        </div>
      </div>

      {/* Calendar view */}
      {view === 'calendar' ? (
        <div className="rounded-[20px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <CalendarView interviews={interviews} />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex rounded-lg p-0.5 gap-0.5 mb-6 w-fit" style={{ background: 'var(--bg-2)' }}>
            {([
              { key: 'upcoming', label: `קרובים (${upcoming.length})` },
              { key: 'past',     label: `עברו (${past.length})` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all"
                style={tab === t.key
                  ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }
                  : { color: 'var(--ink-3)' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {groups.length === 0 ? (
            <div className="rounded-[20px] border p-16 text-center"
              style={{ background: 'linear-gradient(135deg,#FDFCFF,#FAF8FE)', borderColor: 'var(--line)' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'var(--purple-050)' }}>
                <Calendar size={24} style={{ color: 'var(--purple)' }} />
              </div>
              <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink)' }}>
                {tab === 'upcoming' ? 'אין ראיונות קרובים' : 'אין ראיונות שעברו'}
              </p>
              <p className="text-[13px] mb-4" style={{ color: 'var(--ink-3)' }}>
                קבעי ראיונות ממסך הגשות או מאגר מועמדות
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/institution/applications"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold text-white no-underline"
                  style={{ background: 'var(--purple)' }}>
                  הגשות ←
                </Link>
                <Link href="/institution/candidates"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold no-underline"
                  style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
                  מאגר מועמדות
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map(group => (
                <div key={group.dateKey}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-[10px] shrink-0"
                      style={{ background: group.dateKey === now.toISOString().substring(0, 10) ? 'var(--purple)' : 'var(--bg-2)' }}>
                      <span className="text-[18px] font-black leading-none"
                        style={{ color: group.dateKey === now.toISOString().substring(0, 10) ? '#fff' : 'var(--ink)' }}>
                        {new Date(group.dateKey).getDate()}
                      </span>
                      <span className="text-[9px] font-bold"
                        style={{ color: group.dateKey === now.toISOString().substring(0, 10) ? 'rgba(255,255,255,.7)' : 'var(--ink-3)' }}>
                        {new Date(group.dateKey).toLocaleDateString('he-IL', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>
                        {dateLabel(group.dateKey)}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
                        {group.items.length} ראיון{group.items.length !== 1 ? 'ות' : ''}
                      </p>
                    </div>
                    <div className="flex-1 h-px ms-2" style={{ background: 'var(--line)' }} />
                  </div>

                  {/* Interview cards */}
                  <div className="space-y-3 ms-6">
                    {group.items.map(iv => {
                      const isPast = new Date(iv.scheduled_at) < now
                      const isConfirmed = iv.candidate_confirmed === true
                      const isDeclined  = iv.candidate_confirmed === false

                      return (
                        <div key={iv.id}
                          className="rounded-[16px] border overflow-hidden"
                          style={{
                            background: '#fff',
                            borderColor: isConfirmed ? '#86EFAC' : 'var(--line)',
                            boxShadow: isPast ? 'none' : '0 2px 10px rgba(75,46,131,.08)',
                            opacity: isPast ? 0.75 : 1,
                          }}>
                          <div className="h-[3px]"
                            style={{ background: isConfirmed ? '#22C55E' : isDeclined ? '#EF4444' : 'linear-gradient(90deg,var(--purple),var(--teal))' }} />
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="min-w-0">
                                <p className="text-[15px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>
                                  {iv.candidate_name ?? '—'}
                                </p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap text-[12px]" style={{ color: 'var(--ink-3)' }}>
                                  <span className="flex items-center gap-1">
                                    <Briefcase size={11} />{iv.job_title ?? '—'}
                                  </span>
                                  {iv.candidate_city && (
                                    <span className="flex items-center gap-1">
                                      <MapPin size={11} />{iv.candidate_city}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <div className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: 'var(--purple)' }}>
                                  <Clock size={13} />{fmtTime(iv.scheduled_at)}
                                </div>
                                {isConfirmed && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: '#E4F6ED', color: '#1A7A4A' }}>
                                    <CheckCircle2 size={10} />אושר ע&quot;י מועמדת
                                  </span>
                                )}
                                {isDeclined && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: '#FEE2E2', color: '#DC2626' }}>
                                    <XCircle size={10} />בוטל
                                  </span>
                                )}
                                {iv.candidate_confirmed === null && !isPast && (
                                  <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-4)' }}>
                                    ממתין לאישור
                                  </span>
                                )}
                              </div>
                            </div>

                            {iv.location && (
                              <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                                <MapPin size={11} />
                                <span>{iv.location}</span>
                              </div>
                            )}

                            {iv.notes && (
                              <p className="mt-1.5 text-[12px] whitespace-pre-wrap" style={{ color: 'var(--ink-3)' }}>
                                📝 {iv.notes}
                              </p>
                            )}

                            {iv.candidate_phone && !isPast && (
                              <div className="flex items-center gap-2 mt-3">
                                <a href={`tel:${iv.candidate_phone}`}
                                  className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-bold no-underline"
                                  style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
                                  <Phone size={12} />{iv.candidate_phone}
                                </a>
                                <a href={waLink(iv.candidate_phone, iv.candidate_name, iv.job_title, iv.scheduled_at)}
                                  target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1 h-8 px-3 rounded-[8px] text-[12px] font-bold no-underline"
                                  style={{ background: '#E7FBF0', color: '#25D366', border: '1px solid #BBF7D0' }}>
                                  <MessageCircle size={12} />שלחי תזכורת
                                </a>
                              </div>
                            )}

                            {/* Rating widget — past interviews only */}
                            {isPast && (
                              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                                <p className="text-[11.5px] font-bold mb-1.5" style={{ color: 'var(--ink-3)' }}>
                                  דירוג הראיון:
                                </p>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => saveRating(iv.id, star)}
                                      className="transition-all"
                                      title={`${star} כוכבים`}
                                    >
                                      <Star
                                        size={20}
                                        fill={(ratings[iv.id] ?? 0) >= star ? '#F59E0B' : 'none'}
                                        strokeWidth={1.5}
                                        style={{
                                          color: (ratings[iv.id] ?? 0) >= star ? '#F59E0B' : 'var(--ink-4)',
                                          transition: 'color 100ms, fill 100ms',
                                        }}
                                      />
                                    </button>
                                  ))}
                                  {ratings[iv.id] && (
                                    <span className="text-[11px] font-semibold ms-1" style={{ color: 'var(--ink-4)' }}>
                                      ({ratings[iv.id]}/5)
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
