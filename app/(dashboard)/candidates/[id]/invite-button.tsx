'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, X, Calendar, CheckCircle, MessageCircle } from 'lucide-react'

interface ActiveJob { id: string; title: string }

interface Props {
  candidateId: string
  candidateName: string
  candidatePhone: string | null
  institutionId: string
  institutionName: string
  activeJobs: ActiveJob[]
}

function fmtDt(date: string, time: string) {
  if (!date) return ''
  const dt = new Date(`${date}T${time || '09:00'}`)
  return dt.toLocaleString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function InviteButton({ candidateId, candidateName, candidatePhone, institutionId, institutionName, activeJobs }: Props) {
  const [open, setOpen] = useState(false)
  const [jobId, setJobId] = useState(activeJobs[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const job = activeJobs.find(j => j.id === jobId)

  function waText() {
    const dt = date ? fmtDt(date, time) : ''
    return `שלום ${candidateName},\nאנו מ${institutionName} ונשמח להזמין אותך לראיון למשרת "${job?.title ?? ''}"${dt ? '.\nתאריך מוצע: ' + dt : ''}.\n\nנשמח לשמוע אם ההצעה מתאימה לך!\nבברכה`
  }

  function waLink() {
    const phone = (candidatePhone ?? '').replace(/\D/g, '')
    const base = phone ? `https://wa.me/972${phone.replace(/^0/, '')}` : 'https://wa.me'
    return `${base}?text=${encodeURIComponent(waText())}`
  }

  async function send() {
    if (!jobId) return
    setSaving(true)
    const body: Record<string, string> = { institution_id: institutionId, candidate_id: candidateId, job_id: jobId }
    if (date) body.scheduled_at = new Date(`${date}T${time || '09:00'}`).toISOString()
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok || res.status === 409) {
      setDone(true)
      setOpen(false)
    }
  }

  if (activeJobs.length === 0) {
    return (
      <Link href="/institution/jobs/new"
        className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold no-underline"
        style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid var(--purple-200)' }}>
        <Send size={15} />+ צרי משרה ושלחי הצעה
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold transition-all"
        style={done
          ? { background: '#E4F6ED', color: '#1A7A4A', border: '1px solid #bbf7d0' }
          : { background: 'var(--purple)', color: '#fff', boxShadow: '0 3px 12px rgba(75,46,131,.3)' }}>
        {done ? <><CheckCircle size={15} />הצעה נשלחה</> : <><Send size={15} />שלחי הצעה</>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.48)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>
                שלחי הצעה — {candidateName}
              </h2>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--ink-3)' }}><X size={20} /></button>
            </div>

            {/* Job select */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>
                למשרה
              </label>
              <select value={jobId} onChange={e => setJobId(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] border text-[14px] outline-none"
                style={{ borderColor: 'var(--line)' }}>
                {activeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            {/* Date + time */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[12px] font-semibold flex items-center gap-1 mb-1.5" style={{ color: 'var(--ink-3)' }}>
                  <Calendar size={11} />תאריך ראיון (אופציונלי)
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border text-[13px] outline-none"
                  style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>שעה</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
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
              {candidatePhone && (
                <a href={waLink()} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[14px] font-bold no-underline"
                  style={{ background: '#25D366', color: '#fff' }}
                  onClick={send}>
                  <MessageCircle size={15} />שלח לוואצאפ + שמור
                </a>
              )}
              <button onClick={send} disabled={saving || !jobId}
                className="px-4 py-2.5 rounded-[10px] text-[13px] font-semibold border transition-all"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
                {saving ? 'שומר...' : 'שמור בלבד'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
