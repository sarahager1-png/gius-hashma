'use client'

import { useState } from 'react'
import { MessageCircle, Send, Users, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'

const STATUSES = ['הכל', "מחפשת סטאג'", 'פתוחה להצעות', 'בוגרת מחפשת משרה', 'לא פעילה']

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "מחפשת סטאג'":      { bg: 'var(--purple-050)', color: 'var(--purple)'    },
  'פתוחה להצעות':      { bg: 'var(--teal-050)',   color: 'var(--teal-600)'  },
  'בוגרת מחפשת משרה': { bg: 'var(--amber-bg)',    color: 'var(--amber)'     },
  'לא פעילה':          { bg: '#F4F4F5',           color: '#71717A'          },
}

interface Candidate {
  id: string
  availability_status: string
  city: string | null
  profiles: { full_name: string | null; phone: string | null } | null
}

interface Props { candidates: Candidate[] }

export default function MessagesClient({ candidates }: Props) {
  const [statusFilter, setStatusFilter] = useState('הכל')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showList, setShowList] = useState(false)

  const filtered = candidates.filter(c => {
    if (statusFilter !== 'הכל' && c.availability_status !== statusFilter) return false
    return !!c.profiles?.phone
  })

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const recipients = filtered.filter(c => selected.has(c.id))

  function waLink(c: Candidate) {
    const phone = c.profiles!.phone!.replace(/\D/g, '').replace(/^0/, '972')
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">הודעה למועמדות</h1>
        <span className="brand-line" />
        <p className="page-subtitle">שלחי הודעת WhatsApp לקבוצת מועמדות · ההודעות נשלחות ישירות לוואצאפ</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left — message composer */}
        <div className="space-y-4">
          {/* Message */}
          <div className="rounded-[14px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <label className="text-[13px] font-bold block mb-2" style={{ color: 'var(--ink-3)' }}>תוכן ההודעה</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="כתבי את ההודעה כאן..."
              rows={6}
              className="w-full rounded-[10px] border px-4 py-3 text-[14px] font-medium outline-none resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'var(--bg)' }}
            />
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--ink-4)' }}>
              {message.length} תווים
            </p>
          </div>

          {/* Filter */}
          <div className="rounded-[14px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold" style={{ color: 'var(--ink-3)' }}>סנני נמענות לפי סטטוס</span>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-[8px] transition-all"
                style={{ color: 'var(--purple)', background: 'var(--purple-050)' }}>
                {selected.size === filtered.length && filtered.length > 0
                  ? <><CheckSquare size={14} />בטלי הכל</>
                  : <><Square size={14} />בחרי הכל ({filtered.length})</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setSelected(new Set()) }}
                  className="px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-all border"
                  style={statusFilter === s
                    ? { background: 'var(--purple)', color: '#fff', borderColor: 'var(--purple)' }
                    : { background: '#fff', color: 'var(--ink-3)', borderColor: 'var(--line)' }}>
                  {s}
                  <span className="ms-1.5 opacity-60">
                    ({s === 'הכל' ? candidates.length : candidates.filter(c => c.availability_status === s && c.profiles?.phone).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Candidate list */}
            <button
              onClick={() => setShowList(v => !v)}
              className="flex items-center gap-1.5 mt-4 text-[13px] font-semibold w-full py-2 rounded-[8px] transition-all"
              style={{ color: 'var(--ink-3)', background: 'var(--bg-2)' }}>
              <Users size={14} />
              {showList ? 'הסתירי' : 'הציגי'} רשימת מועמדות ({filtered.length})
              {showList ? <ChevronUp size={14} className="ms-auto" /> : <ChevronDown size={14} className="ms-auto" />}
            </button>

            {showList && (
              <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                {filtered.map(c => {
                  const name = c.profiles?.full_name ?? '—'
                  const sc = STATUS_COLORS[c.availability_status] ?? { bg: '#F4F4F5', color: '#71717A' }
                  const isSelected = selected.has(c.id)
                  return (
                    <label key={c.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer transition-all"
                      style={{ background: isSelected ? 'var(--purple-050)' : 'var(--bg)' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(c.id)}
                        className="w-4 h-4 accent-purple-600" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--ink-4)' }} dir="ltr">{c.profiles?.phone}</div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={sc}>
                        {c.availability_status}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — send panel */}
        <div className="space-y-4">
          <div className="rounded-[14px] border p-5 sticky top-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#E7FBF0' }}>
                <MessageCircle size={18} style={{ color: '#25D366' }} />
              </div>
              <div>
                <div className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>שליחה בוואצאפ</div>
                <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                  {recipients.length} נמענות נבחרו
                </div>
              </div>
            </div>

            {recipients.length === 0 ? (
              <p className="text-[13px] text-center py-6" style={{ color: 'var(--ink-4)' }}>
                בחרי מועמדות ורשמי הודעה כדי להתחיל
              </p>
            ) : (
              <div className="space-y-2">
                {recipients.map(c => {
                  const name = c.profiles?.full_name ?? '—'
                  return (
                    <a key={c.id} href={waLink(c)} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between gap-3 p-3 rounded-[10px] border transition-all"
                      style={{ borderColor: '#bbf7d0', background: '#F0FDF4', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-bold" style={{ color: '#15803D' }}>{name}</div>
                        <div className="text-[11px]" style={{ color: '#4ADE80' }} dir="ltr">{c.profiles?.phone}</div>
                      </div>
                      <Send size={14} style={{ color: '#25D366', flexShrink: 0 }} />
                    </a>
                  )
                })}
              </div>
            )}

            {recipients.length > 0 && !message.trim() && (
              <p className="text-[12px] mt-3 text-center" style={{ color: '#D97706' }}>
                ⚠️ יש לרשום הודעה לפני השליחה
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
