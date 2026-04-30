'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  jobId: string
  alreadyApplied: boolean
}

export default function ApplyButton({ jobId, alreadyApplied }: Props) {
  const [state, setState] = useState<'idle' | 'expanded' | 'loading' | 'done'>(alreadyApplied ? 'done' : 'idle')
  const [coverLetter, setCoverLetter] = useState('')
  const router = useRouter()

  async function apply() {
    setState('loading')
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter.trim() || null }),
    })
    if (res.ok || res.status === 409) {
      setState('done')
      router.refresh()
    } else {
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2.5 h-12 px-6 rounded-[12px] w-full justify-center"
        style={{ background: '#E4F6ED', color: '#1A7A4A' }}>
        <CheckCircle size={18} />
        <span className="text-[15px] font-bold">הגשה הוגשה בהצלחה</span>
      </div>
    )
  }

  if (state === 'expanded') {
    return (
      <div className="rounded-[14px] border p-5 space-y-4"
        style={{ background: '#F8F7FF', borderColor: '#C4B5FD' }}>
        <div>
          <label className="text-[13px] font-semibold block mb-2" style={{ color: 'var(--purple)' }}>
            מכתב לוויה (אופציונלי)
          </label>
          <textarea
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            rows={4}
            placeholder="ספרי בקצרה מדוע את מתאימה למשרה זו..."
            className="w-full rounded-[10px] border text-[14px] p-3 outline-none resize-none leading-relaxed"
            style={{ borderColor: '#C4B5FD', background: '#fff' }}
          />
          <p className="text-[11px] mt-1" style={{ color: 'var(--ink-4)' }}>
            {coverLetter.length} / 500 תווים
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={apply}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[11px] text-[14px] font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)', boxShadow: '0 4px 14px rgba(91,58,171,.35)' }}>
            <Send size={16} />הגישי מועמדות
          </button>
          <button
            onClick={() => setState('idle')}
            className="h-11 px-4 rounded-[11px] border text-[13px] font-semibold"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
            ביטול
          </button>
        </div>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2.5 h-12 px-6 rounded-[12px] w-full justify-center"
        style={{ background: 'var(--purple-200)', color: '#fff' }}>
        <Loader2 size={18} className="animate-spin" />שולח...
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={apply}
        className="flex-1 flex items-center justify-center gap-2.5 h-12 px-6 rounded-[12px] text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)',
          boxShadow: '0 4px 14px rgba(91,58,171,.35)',
        }}>
        <Send size={17} />הגישי מועמדות
      </button>
      <button
        onClick={() => setState('expanded')}
        title="הוסיפי מכתב לוויה"
        className="h-12 px-3 rounded-[12px] border flex items-center gap-1.5 text-[12px] font-semibold transition-all"
        style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
        <ChevronDown size={15} />מכתב
      </button>
    </div>
  )
}
