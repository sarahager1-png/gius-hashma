'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, Download, UserPlus, ChevronLeft, X, CheckCircle,
  GraduationCap, MapPin, Phone, Building2, MessageCircle, Send,
  Briefcase, Calendar, ChevronDown, Loader2, BookOpen, Users,
} from 'lucide-react'
import type { Candidate } from '@/lib/types'

const STAGE_LEVELS = ["שנה ב' - סטאג'", "שנה ג' - סטאג'"]
const ACAD_LEVELS = ["שנה ב' - סטאג'", "שנה ג' - סטאג'", 'תואר ראשון', 'תואר שני']
const AVAIL_STATUSES = ["מחפשת סטאג'", 'פתוחה להצעות', 'משובצת', 'בוגרת מחפשת משרה', 'לא פעילה']
const STATUSES = ['הכל', "מחפשת סטאג'", 'פתוחה להצעות', 'משובצת']

const STATUS_PILL: Record<string, { bg: string; color: string; dot: string; border?: string }> = {
  "מחפשת סטאג'":       { bg: 'rgba(75,46,131,.12)',  color: 'var(--purple)',   dot: 'var(--purple)',   border: 'rgba(75,46,131,.25)' },
  'פתוחה להצעות':       { bg: 'rgba(0,167,181,.12)',  color: 'var(--teal-600)', dot: 'var(--teal)',     border: 'rgba(0,167,181,.3)'  },
  'משובצת':             { bg: 'rgba(21,128,61,.12)',  color: 'var(--green)',    dot: '#22C55E',         border: 'rgba(21,128,61,.25)' },
  'בוגרת מחפשת משרה':  { bg: 'rgba(194,120,25,.12)', color: 'var(--amber)',    dot: '#F59E0B',         border: 'rgba(194,120,25,.3)' },
  'לא פעילה':           { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', border: '#D1D5DB' },
}

const GRADIENTS = [
  'linear-gradient(135deg,#4B2E83,#00A7B5)',
  'linear-gradient(135deg,#C2185B,#FF8A65)',
  'linear-gradient(135deg,#1565C0,#42A5F5)',
  'linear-gradient(135deg,#2E7D32,#66BB6A)',
  'linear-gradient(135deg,#6A1B9A,#CE93D8)',
]

interface Job { id: string; title: string; city: string; institution_id: string; institutions: { institution_name: string } | null }
interface Props { candidates: Candidate[]; initialSearch?: string }

/* ── Invite Modal ── */
function InviteModal({ candidate, onClose, onSent }: {
  candidate: Candidate
  onClose: () => void
  onSent: (key: string) => void
}) {
  const [jobs, setJobs]           = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobSearch, setJobSearch] = useState('')
  const [showJobList, setShowJobList] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [message, setMessage]     = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')

  const name = candidate.profiles?.full_name ?? 'המועמדת'

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then((data: Job[]) => { setJobs(data); setJobsLoading(false) })
      .catch(() => setJobsLoading(false))
  }, [])

  const filteredJobs = jobs.filter(j =>
    !jobSearch ||
    j.title.includes(jobSearch) ||
    (j.institutions?.institution_name ?? '').includes(jobSearch) ||
    (j.city ?? '').includes(jobSearch)
  )

  async function send() {
    if (!selectedJob) return
    setSending(true); setError('')
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: candidate.id,
        job_id: selectedJob.id,
        institution_id: selectedJob.institution_id,
        scheduled_at: scheduledAt || null,
        message: message.trim() || null,
      }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
      onSent(`${candidate.id}:${selectedJob.id}`)
      setTimeout(onClose, 1800)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error === 'Already invited' ? 'כבר נשלחה הזמנה למועמדת זו לאותה משרה' : (d.error ?? 'שגיאה, נסי שוב'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,11,35,.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-[20px] w-full max-w-[480px] overflow-hidden"
        style={{ boxShadow: '0 24px 80px rgba(15,11,35,.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ background: GRADIENTS[0] }}>
              {name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
            </div>
            <div>
              <p className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>שליחת הצעת עבודה</p>
              <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>ל{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--ink-4)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X size={17} />
          </button>
        </div>

        {sent ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#DCFCE7' }}>
              <CheckCircle size={32} style={{ color: '#16A34A' }} />
            </div>
            <p className="text-[16px] font-extrabold" style={{ color: '#166534' }}>ההזמנה נשלחה!</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>המועמדת תקבל התראה</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">

            {/* Job picker */}
            <div>
              <label className="block text-[12px] font-bold mb-1.5 uppercase tracking-[.07em]"
                style={{ color: 'var(--ink-3)' }}>משרה *</label>
              <div className="relative">
                <button type="button"
                  onClick={() => setShowJobList(v => !v)}
                  className="w-full h-11 rounded-[10px] border flex items-center justify-between px-3 text-[14px] font-medium text-right transition-all"
                  style={{
                    borderColor: showJobList ? 'var(--purple)' : 'var(--line)',
                    background: '#fff', color: selectedJob ? 'var(--ink)' : 'var(--ink-4)',
                    boxShadow: showJobList ? '0 0 0 3px var(--purple-050)' : 'none',
                  }}>
                  {selectedJob ? (
                    <span className="flex items-center gap-2">
                      <Briefcase size={14} style={{ color: 'var(--purple)' }} />
                      <span className="truncate">{selectedJob.title}</span>
                      <span className="text-[11px] shrink-0" style={{ color: 'var(--ink-4)' }}>
                        {selectedJob.institutions?.institution_name}
                      </span>
                    </span>
                  ) : 'בחרי משרה...'}
                  <ChevronDown size={15} style={{ color: 'var(--ink-4)' }} />
                </button>

                {showJobList && (
                  <div className="absolute top-full mt-1.5 w-full rounded-[12px] bg-white z-10 overflow-hidden"
                    style={{ border: '1px solid var(--line)', boxShadow: '0 8px 32px rgba(15,11,35,.12)' }}>
                    <div className="p-2 border-b" style={{ borderColor: 'var(--line-soft)' }}>
                      <input autoFocus value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                        placeholder="חיפוש משרה..."
                        className="w-full h-8 px-3 rounded-[8px] text-[13px] outline-none"
                        style={{ background: 'var(--bg-2)', color: 'var(--ink)' }} />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto">
                      {jobsLoading ? (
                        <div className="flex items-center justify-center py-6 gap-2" style={{ color: 'var(--ink-4)' }}>
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-[13px]">טוענת...</span>
                        </div>
                      ) : filteredJobs.length === 0 ? (
                        <p className="text-center py-5 text-[13px]" style={{ color: 'var(--ink-4)' }}>
                          לא נמצאו משרות פעילות
                        </p>
                      ) : filteredJobs.map(j => (
                        <button key={j.id} type="button"
                          onClick={() => { setSelectedJob(j); setShowJobList(false) }}
                          className="w-full flex items-start gap-3 px-4 py-3 text-right transition-colors"
                          style={{ borderBottom: '1px solid var(--line-soft)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          <Briefcase size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--purple)' }} />
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{j.title}</p>
                            <p className="text-[11.5px]" style={{ color: 'var(--ink-4)' }}>
                              {j.institutions?.institution_name} · {j.city}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date/time */}
            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-bold mb-1.5 uppercase tracking-[.07em]"
                style={{ color: 'var(--ink-3)' }}>
                <Calendar size={12} />תאריך ושעה לראיון (אופציונלי)
              </label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="h-11 rounded-[10px] border px-3 text-[14px] font-medium outline-none"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff', minWidth: '220px' }} />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[12px] font-bold mb-1.5 uppercase tracking-[.07em]"
                style={{ color: 'var(--ink-3)' }}>הודעה אישית (אופציונלי)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder={`שלום ${name.split(' ')[0]}, אנחנו שמחים לזמן אותך...`}
                rows={3}
                className="w-full px-3 py-2.5 rounded-[10px] border text-[14px] outline-none resize-none"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }} />
            </div>

            {error && (
              <p className="text-[13px] font-medium px-3 py-2 rounded-[8px]"
                style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 h-11 rounded-[10px] border text-[14px] font-semibold"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                ביטול
              </button>
              <button onClick={send} disabled={!selectedJob || sending}
                className="flex-1 h-11 rounded-[10px] flex items-center justify-center gap-2 text-[14px] font-extrabold text-white transition-all"
                style={{
                  background: selectedJob && !sending
                    ? 'linear-gradient(135deg,var(--purple),var(--teal))'
                    : 'var(--bg-3)',
                  color: selectedJob && !sending ? '#fff' : 'var(--ink-4)',
                  boxShadow: selectedJob && !sending ? '0 4px 16px rgba(75,46,131,.28)' : 'none',
                }}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'שולחת...' : 'שלחי הצעה'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function CandidatesClient({ candidates, initialSearch = '' }: Props) {
  const [search, setSearch]       = useState(initialSearch)
  const [statusFilter, setFilter] = useState('הכל')
  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState({
    name: '', city: '', phone: '',
    level: "שנה ב' - סטאג'", status: "מחפשת סטאג'",
    placement_location: '', prev_employer: '', prev_role: '', exp: '',
  })
  const [saved, setSaved]         = useState(false)
  const [inviteTarget, setInviteTarget] = useState<Candidate | null>(null)
  const [sentKeys, setSentKeys]   = useState<Set<string>>(new Set())
  const router = useRouter()

  async function handleSave() {
    const res = await fetch('/api/candidates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    if (!res.ok) return
    setSaved(true)
    setTimeout(() => {
      setSaved(false); setShowAdd(false)
      setAddForm({ name: '', city: '', phone: '', level: "שנה ב' - סטאג'", status: "מחפשת סטאג'",
        placement_location: '', prev_employer: '', prev_role: '', exp: '' })
      router.refresh()
    }, 1800)
  }

  const filtered = candidates.filter(c => {
    if (statusFilter !== 'הכל' && c.availability_status !== statusFilter) return false
    const name = c.profiles?.full_name ?? ''
    const city = c.city ?? ''
    if (search && !name.includes(search) && !city.includes(search)) return false
    return true
  })

  const availableCount = candidates.filter(c =>
    c.availability_status !== 'משובצת' && c.availability_status !== 'לא פעילה'
  ).length

  return (
    <div className="p-4 md:p-8">

      {/* Invite Modal */}
      {inviteTarget && (
        <InviteModal
          candidate={inviteTarget}
          onClose={() => setInviteTarget(null)}
          onSent={key => setSentKeys(s => new Set([...s, key]))}
        />
      )}

      {/* Add Candidate Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,11,35,.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>הוספת מועמדת</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: 'var(--ink-4)' }}><X size={20} /></button>
            </div>
            {saved ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#DCFCE7' }}>
                  <CheckCircle size={28} style={{ color: '#16A34A' }} />
                </div>
                <p className="text-[16px] font-bold" style={{ color: '#166534' }}>המועמדת נוספה בהצלחה</p>
              </div>
            ) : (
              <div className="space-y-3">
                <FRow label="שם מלא *">
                  <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
                </FRow>
                <div className="grid grid-cols-2 gap-3">
                  <FRow label="עיר">
                    <input value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
                  </FRow>
                  <FRow label="טלפון">
                    <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} dir="ltr" />
                  </FRow>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FRow label="רמה אקדמית">
                    <select value={addForm.level} onChange={e => setAddForm(f => ({ ...f, level: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                      {ACAD_LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </FRow>
                  <FRow label="סטטוס זמינות">
                    <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                      {AVAIL_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </FRow>
                </div>
                {STAGE_LEVELS.includes(addForm.level) ? (
                  <FRow label="מקום שליחות">
                    <input value={addForm.placement_location}
                      onChange={e => setAddForm(f => ({ ...f, placement_location: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
                  </FRow>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <FRow label="מקום עבודה קודם">
                      <input value={addForm.prev_employer}
                        onChange={e => setAddForm(f => ({ ...f, prev_employer: e.target.value }))}
                        className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
                    </FRow>
                    <FRow label="תפקיד">
                      <input value={addForm.prev_role}
                        onChange={e => setAddForm(f => ({ ...f, prev_role: e.target.value }))}
                        className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
                    </FRow>
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowAdd(false)}
                    className="h-10 px-5 rounded-[10px] border text-[14px] font-semibold"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>ביטול</button>
                  <button onClick={handleSave} disabled={!addForm.name}
                    className="h-10 px-6 rounded-[10px] text-[14px] font-semibold text-white"
                    style={{ background: addForm.name ? 'var(--purple)' : 'var(--bg-3)', color: addForm.name ? '#fff' : 'var(--ink-4)' }}>
                    שמור
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">מועמדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{candidates.length} במאגר · {availableCount} זמינות</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" style={{ height: '40px' }}>
            <Download size={15} />ייצוא
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <UserPlus size={15} />הוסף מועמדת
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1" style={{ maxWidth: '280px' }}>
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
            style={{ color: 'var(--ink-4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, עיר..."
            className="w-full h-10 rounded-[10px] border text-[13.5px] outline-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineEnd: '34px', paddingInlineStart: '14px' }} />
        </div>

        <div className="flex rounded-[10px] p-1 gap-0.5" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-all"
              style={statusFilter === s
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                : { color: 'var(--ink-3)' }}>
              {s}
            </button>
          ))}
        </div>

        <button className="btn btn-ghost" style={{ height: '40px', gap: '6px' }}>
          <Filter size={14} />פילטרים
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><Users size={28} /></div>
            <p className="empty-state__title">{candidates.length === 0 ? 'אין מועמדות במאגר עדיין' : 'לא נמצאו תוצאות'}</p>
            <p className="empty-state__text">{candidates.length === 0 ? 'הוסיפי מועמדת ראשונה כדי להתחיל' : 'נסי לשנות את הסינון או מילות החיפוש'}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filtered.map((c, idx) => {
              const name    = c.profiles?.full_name ?? '—'
              const sc      = STATUS_PILL[c.availability_status] ?? STATUS_PILL['לא פעילה']
              const initials = name !== '—' ? name.split(' ').slice(0, 2).map((w: string) => w[0]).join('') : '?'
              const grad    = GRADIENTS[idx % GRADIENTS.length]
              const isStage = STAGE_LEVELS.includes(c.academic_level ?? '')
              const waLink  = c.profiles?.phone
                ? (() => {
                    const n = c.profiles!.phone!.replace(/\D/g, '').replace(/^0/, '972')
                    const t = encodeURIComponent(`שלום ${name.split(' ')[0]}, אנחנו ממערכת הגיוס של רשת חינוך חב"ד ושמחנו לראות את הפרופיל שלך.`)
                    return `https://wa.me/${n}?text=${t}`
                  })()
                : null

              const alreadySent = [...sentKeys].some(k => k.startsWith(c.id + ':'))

              return (
                <div key={c.id} className="flex flex-col overflow-hidden cursor-pointer"
                  style={{
                    background: '#FDFCFF',
                    borderRadius: '18px',
                    border: '1px solid var(--line)',
                    boxShadow: '0 2px 12px rgba(75,46,131,.10), 0 1px 3px rgba(75,46,131,.07)',
                    transition: 'box-shadow 240ms, transform 240ms, border-color 240ms',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 16px 40px rgba(75,46,131,.20), 0 4px 12px rgba(75,46,131,.12)'
                    el.style.transform = 'translateY(-4px) scale(1.01)'
                    el.style.borderColor = 'var(--purple-200)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 2px 12px rgba(75,46,131,.10), 0 1px 3px rgba(75,46,131,.07)'
                    el.style.transform = 'translateY(0) scale(1)'
                    el.style.borderColor = 'var(--line)'
                  }}
                >
                  {/* Top color strip by status — thicker and more vivid */}
                  <div className="h-1 w-full shrink-0 rounded-t-[18px]"
                    style={{ background: `linear-gradient(90deg, ${sc.dot} 0%, ${sc.dot}88 80%, transparent 100%)` }} />

                  {/* Header */}
                  <div className="p-5 pb-4 flex items-start gap-3.5" style={{ background: 'var(--bg-2)' }}>
                    {/* Avatar with ring */}
                    <div className="shrink-0 p-[2.5px] rounded-full" style={{ background: grad }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white"
                        style={{ background: grad, outline: '2.5px solid #FDFCFF', outlineOffset: '-2px' }}>
                        {initials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15.5px] font-extrabold leading-snug truncate" style={{ color: 'var(--ink)' }}>{name}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                          style={{ background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border ?? sc.dot}` }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ background: sc.dot }} />
                          {c.availability_status}
                        </span>
                      </div>
                      <p className="text-[12px] font-semibold mt-0.5 flex items-center gap-1" style={{ color: 'var(--ink-3)' }}>
                        <MapPin size={11} />{c.city ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--line-soft)' }} />

                  {/* Details */}
                  <div className="px-5 py-4 flex-1 space-y-2.5">
                    <DataRow icon={<GraduationCap size={13} />} value={c.academic_level ?? '—'} />

                    {isStage ? (
                      <DataRow icon={<Building2 size={13} />}
                        label="מקום שליחות" value={c.placement_location ?? 'לא צוין'} />
                    ) : (c.prev_employer || c.prev_role) ? (
                      <DataRow icon={<Building2 size={13} />}
                        label="ניסיון קודם"
                        value={[c.prev_role, c.prev_employer].filter(Boolean).join(' · ')} />
                    ) : (
                      <DataRow icon={<Building2 size={13} />} value="ללא ניסיון קודם" muted />
                    )}

                    <DataRow icon={<Phone size={13} />} value={c.profiles?.phone ?? '—'} dir="ltr" />
                    {c.study_day && (
                      <DataRow icon={<BookOpen size={13} />}
                        label="יום לימודים" value={c.study_day}
                        highlight />
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--line-soft)' }} />

                  {/* Footer actions */}
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noreferrer"
                          title="פנייה בוואצאפ"
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors"
                          style={{ background: '#E7FBF0', color: '#25D366' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#bbf7d066')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#E7FBF0')}>
                          <MessageCircle size={15} />
                        </a>
                      )}
                      <button
                        title="שלחי הצעת עבודה"
                        onClick={() => setInviteTarget(c)}
                        disabled={alreadySent}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-bold transition-all"
                        style={alreadySent
                          ? { background: 'var(--green-bg)', color: 'var(--green)' }
                          : { background: 'var(--purple-050)', color: 'var(--purple)' }}
                        onMouseEnter={e => { if (!alreadySent) e.currentTarget.style.background = 'var(--purple-100)' }}
                        onMouseLeave={e => { if (!alreadySent) e.currentTarget.style.background = 'var(--purple-050)' }}>
                        {alreadySent ? <CheckCircle size={13} /> : <Send size={13} />}
                        {alreadySent ? 'נשלחה' : 'שלחי הצעה'}
                      </button>
                    </div>

                    <button
                      className="flex items-center gap-1 text-[12.5px] font-bold px-3 py-1.5 rounded-[8px] transition-all"
                      style={{ color: 'var(--ink-3)', background: 'var(--bg-2)' }}
                      onClick={() => router.push(`/candidates/${c.id}`)}>
                      פרופיל מלא <ChevronLeft size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-[13px] font-medium mt-4" style={{ color: 'var(--ink-3)' }}>
            מוצג {filtered.length} מתוך {candidates.length}
          </p>
        </>
      )}
    </div>
  )
}

function DataRow({ icon, label, value, muted, dir: d, highlight }: {
  icon: React.ReactNode; label?: string; value: string; muted?: boolean; dir?: string; highlight?: boolean
}) {
  return (
    <div className={`flex items-start gap-2 ${highlight ? 'px-2 py-1 rounded-[7px]' : ''}`}
      style={highlight ? { background: 'var(--amber-bg)', border: '1px solid #FDE68A' } : {}}>
      <span className="mt-[2px] shrink-0" style={{ color: highlight ? 'var(--amber)' : 'var(--ink-4)' }}>{icon}</span>
      <div>
        {label && <p className="text-[10px] font-bold uppercase tracking-[.06em]" style={{ color: highlight ? 'var(--amber)' : 'var(--ink-4)' }}>{label}</p>}
        <p className="text-[12.5px] font-semibold" dir={d}
          style={{ color: highlight ? 'var(--amber)' : muted ? 'var(--ink-4)' : 'var(--ink-2)' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function FRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>{label}</label>
      {children}
    </div>
  )
}
