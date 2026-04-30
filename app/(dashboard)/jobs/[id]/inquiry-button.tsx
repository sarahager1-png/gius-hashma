'use client'

import { useState } from 'react'
import { MessageCircle, Send, CheckCircle, Loader2, X, User } from 'lucide-react'

interface Props {
  jobId: string
  institutionName: string
  alreadySent: boolean
}

export default function InquiryButton({ jobId, institutionName, alreadySent: initialSent }: Props) {
  const [state, setState] = useState<'idle' | 'open' | 'loading' | 'done'>(initialSent ? 'done' : 'idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function send() {
    if (!message.trim()) return
    setState('loading')
    setError('')
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, message: message.trim() }),
    })
    if (res.ok) {
      setState('done')
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error === 'כבר שלחת פנייה למוסד זה'
        ? 'כבר שלחת פנייה למוסד זה. כל מוסד מקבל פנייה אחת.'
        : (d.error ?? 'שגיאה, נסי שוב'))
      setState('open')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2.5 h-12 px-6 rounded-[12px] w-full justify-center"
        style={{ background: '#E0FDF4', color: '#065F46' }}>
        <CheckCircle size={18} />
        <span className="text-[15px] font-bold">הפנייה נשלחה — המוסד יחזור אליך</span>
      </div>
    )
  }

  if (state === 'open' || state === 'loading') {
    return (
      <div className="rounded-[14px] border p-5 space-y-4"
        style={{ background: '#F0FDFA', borderColor: '#99F6E4' }}>
        {/* Profile note */}
        <div className="flex items-center gap-2.5 p-3 rounded-[10px]"
          style={{ background: '#CCFBF1', border: '1px solid #99F6E4' }}>
          <User size={15} style={{ color: '#0F766E' }} />
          <p className="text-[12.5px] font-semibold" style={{ color: '#0F766E' }}>
            הפרופיל שלך יצורף אוטומטית לפנייה — המוסד יראה את כל הפרטים שלך
          </p>
        </div>

        <div>
          <label className="text-[13px] font-semibold block mb-2" style={{ color: 'var(--ink-2)' }}>
            הודעה ל{institutionName}
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="שלום, אני מתעניינת במשרה שפרסמתם ומאמינה שאני מתאימה כי..."
            className="w-full rounded-[10px] border text-[14px] p-3 outline-none resize-none leading-relaxed"
            style={{ borderColor: '#5EEAD4', background: '#fff' }}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-[13px] font-medium px-3 py-2 rounded-[8px]"
            style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={send}
            disabled={!message.trim() || state === 'loading'}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[11px] text-[14px] font-bold text-white transition-all"
            style={{
              background: message.trim() && state !== 'loading'
                ? 'linear-gradient(135deg, #0F766E, #0EA5E9)'
                : 'var(--bg-3)',
              color: message.trim() && state !== 'loading' ? '#fff' : 'var(--ink-4)',
              boxShadow: message.trim() && state !== 'loading' ? '0 4px 14px rgba(15,118,110,.28)' : 'none',
            }}>
            {state === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {state === 'loading' ? 'שולחת...' : 'שלחי פנייה'}
          </button>
          <button
            onClick={() => { setState('idle'); setError(''); setMessage('') }}
            className="h-11 px-4 rounded-[11px] border text-[13px] font-semibold"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
            <X size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState('open')}
      className="w-full flex items-center justify-center gap-2.5 h-12 px-6 rounded-[12px] border text-[15px] font-bold transition-all"
      style={{
        borderColor: '#5EEAD4',
        color: '#0F766E',
        background: '#F0FDFA',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#CCFBF1'
        e.currentTarget.style.borderColor = '#2DD4BF'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#F0FDFA'
        e.currentTarget.style.borderColor = '#5EEAD4'
      }}>
      <MessageCircle size={18} />
      שאלות? פנייה ל{institutionName}
    </button>
  )
}
