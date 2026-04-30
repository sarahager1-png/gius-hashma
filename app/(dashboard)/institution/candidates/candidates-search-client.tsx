'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Paperclip, Send, X, Calendar, CheckCircle, MessageCircle, ChevronDown } from 'lucide-react'
import type { Candidate } from '@/lib/types'
import { SPECIALIZATIONS, ACADEMIC_LEVELS } from '@/lib/constants'

const STATUSES = ['הכל', "מחפשת סטאג'", 'פתוחה להצעות', 'בוגרת מחפשת משרה']
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "מחפשת סטאג'":      { bg: '#EDE9FE', color: '#5B3E9E' },
  'פתוחה להצעות':      { bg: '#CCFBF1', color: '#0F766E' },
  'משובצת':            { bg: '#E4F6ED', color: '#1A7A4A' },
  'בוגרת מחפשת משרה': { bg: '#FDF3E3', color: '#B45309' },
  'לא פעילה':          { bg: '#F4F4F5', color: '#71717A' },
}
const GRADIENTS = [
  'linear-gradient(135deg,#5B3E9E,#2DD4D4)',
  'linear-gradient(135deg,#C2185B,#FF8A65)',
  'linear-gradient(135deg,#2E7D32,#66BB6A)',
  'linear-gradient(135deg,#1565C0,#42A5F5)',
]

interface Props {
  candidates: Candidate[]
  institutionId: string
  institutionName: string
  activeJobs: { id: string; title: string }[]
}

interface InviteState {
  candidateId: string
  candidateName: string
  candidatePhone: string
  jobId: string
  date: string
  time: string
}

function fmtDt(date: string, time: string) {
  if (!date) return ''
  const dt = new Date(`${date}T${time || '09:00'}`)
  return dt.toLocaleString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function CandidateSearchClient({ candidates, institutionId, institutionName, activeJobs }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('הכל')
  const [specFilter, setSpecFilter] = useState('הכל')
  const [levelFilter, setLevelFilter] = useState('הכל')
  const [invite, setInvite] = useState<InviteState | null>(null)
  const [saving, setSaving] = useState(false)
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const router = useRouter()

  const filtered = candidates.filter(c => {
    if (filter !== 'הכל' && c.availability_status !== filter) return false
    if (specFilter !== 'הכל' && c.specialization !== specFilter) return false
    if (levelFilter !== 'הכל' && c.academic_level !== levelFilter) return false
    const name = (c.profiles as unknown as { full_name: string } | null)?.full_name ?? ''
    const city = c.city ?? ''
    const q = search.toLowerCase()
    if (search && !name.toLowerCase().includes(q) && !city.toLowerCase().includes(q)) return false
    return true
  })

  function openInvite(c: Candidate) {
    const prof = c.profiles as unknown as { full_name: string | null; phone: string | null } | null
    setInvite({
      candidateId: c.id,
      candidateName: prof?.full_name ?? '',
      candidatePhone: prof?.phone ?? '',
      jobId: activeJobs[0]?.id ?? '',
      date: '',
      time: '09:00',
    })
  }

  function waText() {
    if (!invite) return ''
    const job = activeJobs.find(j => j.id === invite.jobId)
    const dt = invite.date ? fmtDt(invite.date, invite.time) : ''
    return `שלום ${invite.candidateName},\nאנו מ${institutionName} ונשמח להזמין אותך לראיון למשרת "${job?.title ?? ''}"${dt ? '.\nתאריך מוצע: ' + dt : ''}.\n\nנשמח לשמוע אם הצעה זו מתאימה לך!\nבברכה`
  }

  function waLink() {
    if (!invite) return ''
    const phone = invite.candidatePhone.replace(/\D/g, '')
    const base = phone ? `https://wa.me/972${phone.replace(/^0/, '')}` : 'https://wa.me'
    return `${base}?text=${encodeURIComponent(waText())}`
  }

  async function sendInvitation() {
    if (!invite || !invite.jobId) return
    setSaving(true)
    const body: Record<string, string> = {
      institution_id: institutionId,
      candidate_id: invite.candidateId,
      job_id: invite.jobId,
    }
    if (invite.date) body.scheduled_at = new Date(`${invite.date}T${invite.time || '09:00'}`).toISOString()

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (res.ok || res.status === 409) {
      setInvited(prev => new Set([...prev, invite.candidateId]))
      setInvite(null)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>מאגר מועמדות</h1>
          <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
            {filtered.length} מועמדות זמינות
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
            style={{ color: 'var(--ink-4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, עיר..."
            className="w-full h-10 rounded-[10px] border text-[14px] font-medium outline-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineEnd: '36px', paddingInlineStart: '14px' }} />
        </div>
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
              style={filter === s
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
                : { color: 'var(--ink-3)' }}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <select value={specFilter} onChange={e => setSpecFilter(e.target.value)}
            className="h-10 rounded-[10px] border text-[13px] font-medium outline-none appearance-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineStart: '12px', paddingInlineEnd: '32px' }}>
            <option value="הכל">כל ההתמחויות</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ insetInlineEnd: 10, color: 'var(--ink-4)' }} />
        </div>
        <div className="relative">
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
            className="h-10 rounded-[10px] border text-[13px] font-medium outline-none appearance-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineStart: '12px', paddingInlineEnd: '32px' }}>
            <option value="הכל">כל הרמות</option>
            {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown size={13} className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ insetInlineEnd: 10, color: 'var(--ink-4)' }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <p className="text-[15px] font-medium" style={{ color: 'var(--ink-3)' }}>לא נמצאו מועמדות</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
          {filtered.map((c, idx) => {
            const prof = c.profiles as unknown as { full_name: string | null; phone: string | null } | null
            const name = prof?.full_name ?? '—'
            const sc = STATUS_COLORS[c.availability_status] ?? STATUS_COLORS['לא פעילה']
            const initials = name !== '—' ? name.split(' ').slice(0, 2).map(w => w[0]).join('') : '?'
            const grad = GRADIENTS[idx % GRADIENTS.length]
            const isStage = ["שנה ב' - סטאג'", "שנה ג' - סטאג'"].includes(c.academic_level ?? '')
            const alreadyInvited = invited.has(c.id)

            return (
              <div key={c.id}
                className="rounded-[16px] border flex flex-col overflow-hidden"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>

                <div className="h-1" style={{ background: grad }} />
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => router.push(`/candidates/${c.id}`)}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                        style={{ background: grad }}>{initials}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--ink)' }}>{name}</p>
                          {c.cv_url && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#CCFBF1', color: '#0F766E' }}>
                              <Paperclip size={9} />ק״ח
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink-3)' }}>
                          <MapPin size={11} />{c.city ?? '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={sc}>
                      {c.availability_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
                    <div className="rounded-[8px] p-2.5" style={{ background: 'var(--bg)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[.06em] mb-0.5" style={{ color: 'var(--ink-4)' }}>רמה</p>
                      <p className="font-semibold" style={{ color: 'var(--ink-2)' }}>{c.academic_level ?? '—'}</p>
                    </div>
                    <div className="rounded-[8px] p-2.5" style={{ background: 'var(--bg)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[.06em] mb-0.5" style={{ color: 'var(--ink-4)' }}>טלפון</p>
                      <p className="font-semibold" dir="ltr" style={{ color: 'var(--ink-2)' }}>{prof?.phone ?? '—'}</p>
                    </div>
                    <div className="col-span-2 rounded-[8px] p-2.5" style={{ background: 'var(--bg)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[.06em] mb-0.5" style={{ color: 'var(--ink-4)' }}>
                        {isStage ? 'מקום שליחות' : 'ניסיון קודם'}
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--ink-2)' }}>
                        {isStage
                          ? (c.placement_location ?? 'לא צוין')
                          : ([c.prev_role, c.prev_employer].filter(Boolean).join(' · ') || 'ללא ניסיון')}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-1">
                    {activeJobs.length > 0 ? (
                      <button
                        onClick={() => openInvite(c)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[10px] text-[13px] font-bold transition-all"
                        style={alreadyInvited
                          ? { background: '#E4F6ED', color: '#1A7A4A' }
                          : { background: 'var(--purple-050)', color: 'var(--purple)' }}>
                        {alreadyInvited ? <><CheckCircle size={14} />הוזמנה</> : <><Send size={13} />הזמינה לראיון</>}
                      </button>
                    ) : (
                      <p className="flex-1 text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>
                        אין משרות פעילות · <a href="/institution/jobs/new" style={{ color: 'var(--purple)' }}>פרסמי משרה</a>
                      </p>
                    )}
                    {prof?.phone && (() => {
                      const normalized = prof.phone.replace(/\D/g, '').replace(/^0/, '972')
                      const directMsg = encodeURIComponent(`שלום ${name},\nאנחנו מ${institutionName} ושמחנו לראות את הפרופיל שלך.\nהאם נוכל לדבר על אפשרות שיתוף פעולה?`)
                      return (
                        <a href={`https://wa.me/${normalized}?text=${directMsg}`} target="_blank" rel="noreferrer"
                          title="וואצאפ ישיר"
                          className="flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0 transition-all"
                          style={{ background: '#E7FBF0', color: '#25D366', border: '1px solid #bbf7d0' }}>
                          <MessageCircle size={16} />
                        </a>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Invitation modal */}
      {invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.45)' }}
          onClick={e => e.target === e.currentTarget && setInvite(null)}>
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>
                הזמינה לראיון — {invite.candidateName}
              </h2>
              <button onClick={() => setInvite(null)} style={{ color: 'var(--ink-3)' }}><X size={20} /></button>
            </div>

            {/* Job select */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>למשרה</label>
              <select value={invite.jobId} onChange={e => setInvite(f => f ? { ...f, jobId: e.target.value } : f)}
                className="w-full h-10 px-3 rounded-[8px] border text-[14px] outline-none"
                style={{ borderColor: 'var(--line)' }}>
                {activeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            {/* Date + time */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>
                  <Calendar size={11} className="inline ml-1" />תאריך מוצע (אופציונלי)
                </label>
                <input type="date" value={invite.date}
                  onChange={e => setInvite(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full h-10 px-3 rounded-[8px] border text-[13px] outline-none"
                  style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>שעה</label>
                <input type="time" value={invite.time}
                  onChange={e => setInvite(f => f ? { ...f, time: e.target.value } : f)}
                  className="w-full h-10 px-3 rounded-[8px] border text-[13px] outline-none"
                  style={{ borderColor: 'var(--line)' }} />
              </div>
            </div>

            {/* WhatsApp preview */}
            <div className="mb-5 p-3 rounded-[10px] text-[12px] leading-relaxed whitespace-pre-wrap"
              style={{ background: '#E4F6ED', color: '#1A7A4A', border: '1px solid #86EFAC' }}>
              {waText()}
            </div>

            <div className="flex gap-3">
              <a href={waLink()} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[14px] font-bold"
                style={{ background: '#25D366', color: '#fff' }}
                onClick={sendInvitation}>
                <Send size={15} />שלח לוואצאפ + שמור
              </a>
              <button onClick={sendInvitation} disabled={saving}
                className="px-4 py-2.5 rounded-[10px] text-[13px] font-semibold border"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                {saving ? '...' : 'שמור בלבד'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
