'use client'

import { useState } from 'react'
import { LogIn, Copy, Check, ExternalLink, X } from 'lucide-react'

export default function ImpersonateButton({ profileId, label }: { profileId: string; label: string }) {
  const [loading, setLoading] = useState(false)
  const [link, setLink]       = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)
  const [err, setErr]         = useState('')

  async function generate() {
    setLoading(true); setErr('')
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profileId }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.link) setLink(data.link)
    else setErr(data.error ?? 'שגיאה')
  }

  function copy() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (err) return (
    <span className="text-[11px] font-semibold" style={{ color: '#DC2626' }}>{err}</span>
  )

  if (link) return (
    <div className="flex items-center gap-1">
      <a
        href={link} target="_blank" rel="noreferrer"
        className="flex items-center gap-1 h-7 px-2.5 rounded-[7px] text-[11.5px] font-bold no-underline"
        style={{ background: '#EDE9FE', color: 'var(--purple)' }}
        title="פתחי בחלון חדש"
      >
        <ExternalLink size={11} />פתחי
      </a>
      <button
        onClick={copy}
        className="w-7 h-7 rounded-[7px] flex items-center justify-center transition-all"
        style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}
        title="העתיקי קישור"
      >
        {copied ? <Check size={11} style={{ color: '#1A7A4A' }} /> : <Copy size={11} />}
      </button>
      <button
        onClick={() => setLink(null)}
        className="w-7 h-7 rounded-[7px] flex items-center justify-center"
        style={{ color: 'var(--ink-4)' }}
      >
        <X size={11} />
      </button>
    </div>
  )

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-1 h-7 px-2.5 rounded-[7px] text-[11.5px] font-bold transition-all"
      style={{ background: 'var(--bg-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}
      title={`כנסי בתור ${label}`}
      onMouseEnter={e => { e.currentTarget.style.background = '#EDE9FE'; e.currentTarget.style.color = 'var(--purple)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--ink-3)' }}
    >
      <LogIn size={11} />
      {loading ? '...' : 'כנסי בתור'}
    </button>
  )
}
