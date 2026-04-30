'use client'

import { useState, useMemo } from 'react'
import { Search, MessageCircle, Phone, MapPin, Users, Send, X, Copy, Check } from 'lucide-react'
import { DISTRICTS } from '@/lib/constants'

interface Candidate {
  id: string
  city: string | null
  district: string | null
  college: string | null
  academic_level: string | null
  specialization: string | null
  availability_status: string
  seniority_years: string | null
  created_at: string
  profiles: { full_name: string | null; phone: string | null } | null
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "מחפשת סטאג'":      { bg: '#EDE9FE', color: '#5B3E9E' },
  'פתוחה להצעות':      { bg: '#CCFBF1', color: '#0F766E' },
  'משובצת':            { bg: '#E4F6ED', color: '#1A7A4A' },
  'בוגרת מחפשת משרה': { bg: '#FDF3E3', color: '#B45309' },
  'לא פעילה':          { bg: '#F4F4F5', color: '#71717A' },
}

const ALL_STATUSES = ["מחפשת סטאג'", 'פתוחה להצעות', 'משובצת', 'בוגרת מחפשת משרה', 'לא פעילה']

function waLink(phone: string, msg: string) {
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '972')
  return `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`
}

interface Props { candidates: Candidate[] }

export default function CandidateManagerClient({ candidates }: Props) {
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('הכל')
  const [distFilter, setDist]       = useState('הכל')
  const [message, setMessage]       = useState('')
  const [showGroup, setShowGroup]   = useState(false)
  const [copied, setCopied]         = useState(false)

  const filtered = useMemo(() => candidates.filter(c => {
    if (statusFilter !== 'הכל' && c.availability_status !== statusFilter) return false
    if (distFilter  !== 'הכל' && c.district !== distFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    const name = c.profiles?.full_name ?? ''
    return name.toLowerCase().includes(q) || (c.city ?? '').toLowerCase().includes(q) || (c.college ?? '').toLowerCase().includes(q)
  }), [candidates, search, statusFilter, distFilter])

  const withPhone = filtered.filter(c => c.profiles?.phone)

  function copyAllPhones() {
    const phones = withPhone.map(c => c.profiles!.phone!).join('\n')
    navigator.clipboard.writeText(phones)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of candidates) m[c.availability_status] = (m[c.availability_status] ?? 0) + 1
    return m
  }, [candidates])

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            מסד מועמדות
          </h1>
          <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
            {candidates.length} מועמדות במערכת · {filtered.length} מוצגות
          </p>
        </div>
        <button
          onClick={() => setShowGroup(p => !p)}
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white"
          style={{ background: showGroup ? '#374151' : 'var(--purple)' }}>
          <Send size={15} />
          {showGroup ? 'סגרי הודעה לקבוצה' : 'הודעה לקבוצה'}
        </button>
      </div>

      {/* Status counters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_STATUSES.map(s => {
          const sc = STATUS_COLORS[s] ?? { bg: '#F4F4F5', color: '#71717A' }
          const count = statusCounts[s] ?? 0
          return (
            <button key={s} onClick={() => setStatus(statusFilter === s ? 'הכל' : s)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border-2 transition-all"
              style={{
                background: statusFilter === s ? sc.bg : 'transparent',
                color: sc.color,
                borderColor: statusFilter === s ? sc.color : sc.bg,
              }}>
              {s} <span className="font-extrabold">{count}</span>
            </button>
          )
        })}
        {statusFilter !== 'הכל' && (
          <button onClick={() => setStatus('הכל')} className="text-[12px] font-medium px-2"
            style={{ color: 'var(--ink-4)' }}>✕ נקי</button>
        )}
      </div>

      {/* Group message panel */}
      {showGroup && (
        <div className="mb-5 p-5 rounded-[16px] border" style={{ background: '#F9F8FF', borderColor: '#DDD6FE' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} style={{ color: 'var(--purple)' }} />
            <span className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>
              הודעה ל-{withPhone.length} מועמדות (לפי סינון נוכחי)
            </span>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="כתבי את ההודעה שתישלח לכל המועמדות המסוננות..."
            className="w-full px-3 py-2.5 rounded-[10px] border text-[14px] outline-none resize-none mb-3"
            style={{ borderColor: '#DDD6FE', background: '#fff', minHeight: '80px', fontFamily: 'inherit' }}
          />
          <div className="flex items-center gap-2 mb-4">
            <button onClick={copyAllPhones}
              className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[13px] font-semibold border"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
              {copied ? <><Check size={13} style={{ color: '#1A7A4A' }} />הועתק!</> : <><Copy size={13} />העתיקי מספרים ({withPhone.length})</>}
            </button>
            <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
              · לחצי על שם לשליחה אישית בוואצאפ
            </span>
          </div>
          {message.trim() && withPhone.length > 0 && (
            <div className="rounded-[10px] border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
              <div className="px-3 py-2 text-[12px] font-bold" style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>
                לחצי על שם לשליחה בוואצאפ
              </div>
              <div className="max-h-48 overflow-y-auto divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {withPhone.map(c => (
                  <a key={c.id}
                    href={waLink(c.profiles!.phone!, message)}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 transition-all"
                    style={{ color: 'var(--ink)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span className="text-[13px] font-semibold">{c.profiles!.full_name ?? '—'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>{c.profiles!.phone}</span>
                      <MessageCircle size={14} style={{ color: '#25D366' }} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none" style={{ color: 'var(--ink-4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש שם, עיר, מכללה..."
            className="w-full h-9 rounded-[10px] border text-[13px] outline-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineEnd: '32px', paddingInlineStart: '12px' }} />
        </div>
        <select value={distFilter} onChange={e => setDist(e.target.value)}
          className="h-9 px-3 rounded-[10px] border text-[13px] outline-none appearance-none"
          style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)' }}>
          <option value="הכל">כל המחוזות</option>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        {search && <button onClick={() => setSearch('')} className="text-[12px] flex items-center gap-1" style={{ color: 'var(--ink-4)' }}><X size={12} />נקי חיפוש</button>}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <p style={{ color: 'var(--ink-3)' }}>לא נמצאו מועמדות</p>
        </div>
      ) : (
        <div className="rounded-[16px] border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-3)' }}>
                  {['שם', 'טלפון', 'עיר', 'מחוז', 'מכללה', 'רמה', 'התמחות', 'סטטוס'].map(h => (
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const sc = STATUS_COLORS[c.availability_status] ?? { bg: '#F4F4F5', color: '#71717A' }
                  const phone = c.profiles?.phone ?? ''
                  return (
                    <tr key={c.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {c.profiles?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        {phone ? (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${phone}`} className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--teal)' }}>
                              <Phone size={11} />{phone}
                            </a>
                            <a href={`https://wa.me/972${phone.replace(/\D/g, '').replace(/^0/, '')}${message.trim() ? '?text=' + encodeURIComponent(message) : ''}`}
                              target="_blank" rel="noreferrer" title="וואצאפ"
                              style={{ color: '#25D366' }}>
                              <MessageCircle size={13} />
                            </a>
                          </div>
                        ) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        <span className="flex items-center gap-1"><MapPin size={11} />{c.city ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {c.district ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {c.college ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {c.academic_level ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {c.specialization ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <span className="inline-flex text-[11.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={sc}>
                          {c.availability_status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 text-[12px]" style={{ borderTop: '1px solid var(--line-soft)', color: 'var(--ink-4)' }}>
            מוצגות {filtered.length} מועמדות · {withPhone.length} עם טלפון
          </div>
        </div>
      )}
    </div>
  )
}
