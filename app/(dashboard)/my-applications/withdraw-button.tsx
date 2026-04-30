'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  applicationId: string
  onWithdrawn: () => void
}

export default function WithdrawButton({ applicationId, onWithdrawn }: Props) {
  const [state, setState] = useState<'idle' | 'confirm' | 'loading'>('idle')

  async function withdraw() {
    setState('loading')
    const res = await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' })
    if (res.ok) {
      onWithdrawn()
    } else {
      setState('idle')
    }
  }

  if (state === 'confirm') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>בטלי הגשה?</span>
        <button
          onClick={withdraw}
          className="h-7 px-3 rounded-[7px] text-[12px] font-bold text-white"
          style={{ background: '#DC4F4F' }}>
          כן
        </button>
        <button
          onClick={() => setState('idle')}
          className="h-7 px-3 rounded-[7px] text-[12px] font-semibold border"
          style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
          לא
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return <Loader2 size={15} className="animate-spin" style={{ color: 'var(--ink-4)' }} />
  }

  return (
    <button
      onClick={() => setState('confirm')}
      title="ביטול הגשה"
      className="flex items-center justify-center w-8 h-8 rounded-[8px] border transition-all"
      style={{ borderColor: 'var(--line)', color: 'var(--ink-4)', background: '#fff' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#DC4F4F'; e.currentTarget.style.color = '#DC4F4F' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-4)' }}
    >
      <Trash2 size={14} />
    </button>
  )
}
