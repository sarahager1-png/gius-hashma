'use client'

import { useState } from 'react'
import { Send, X } from 'lucide-react'

interface Props {
  toCandidateName: string
  toProfileId: string
  jobOptions: { id: string; title: string }[]
}

export default function SendMessageButton({ toCandidateName, toProfileId, jobOptions }: Props) {
  const [open, setOpen]       = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [jobId, setJobId]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  async function send() {
    if (!body.trim()) return
    setLoading(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_profile_id: toProfileId, subject, body, related_job_id: jobId || null }),
      })
      setSent(true)
      setTimeout(() => { setOpen(false); setSent(false); setBody(''); setSubject(''); setJobId('') }, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold no-underline transition-all"
        style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid var(--purple-100)' }}>
        <Send size={14} />שלחי הודעה
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-[20px] overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg,var(--purple),var(--teal))' }} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>שלחי הודעה</h2>
                  <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>אל: {toCandidateName}</p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>
                  <X size={16} />
                </button>
              </div>

              {jobOptions.length > 0 && (
                <div className="mb-3">
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: 'var(--ink-3)' }}>משרה קשורה (אופציונלי)</label>
                  <select value={jobId} onChange={e => setJobId(e.target.value)}
                    className="w-full rounded-[10px] border px-3 py-2 text-[13px] font-medium outline-none"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                    <option value="">— ללא קישור למשרה —</option>
                    {jobOptions.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: 'var(--ink-3)' }}>נושא (אופציונלי)</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="נושא ההודעה..."
                  className="w-full rounded-[10px] border px-3 py-2 text-[13px] font-medium outline-none"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: 'var(--ink-3)' }}>הודעה *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder="תוכן ההודעה..."
                  rows={5}
                  className="w-full rounded-[10px] border px-3 py-2 text-[13px] font-medium outline-none resize-none"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} />
              </div>

              <button onClick={send} disabled={loading || !body.trim() || sent}
                className="w-full h-11 rounded-[10px] text-[14px] font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{ background: sent ? '#22C55E' : loading ? '#9CA3AF' : 'var(--purple)' }}>
                <Send size={15} />
                {sent ? 'נשלח! ✓' : loading ? 'שולחת...' : 'שלחי הודעה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
