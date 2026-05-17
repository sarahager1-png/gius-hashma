'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle, XCircle, Send, X } from 'lucide-react'

const STATUS_CFG: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  'ממתינה': { bg: '#EDE9FE', color: '#5B3E9E', label: 'ממתינה לתגובה', icon: <Clock size={12} /> },
  'התקבלה': { bg: '#E4F6ED', color: '#1A7A4A', label: 'התקבלה',        icon: <CheckCircle size={12} /> },
  'נדחתה':  { bg: '#F4F4F5', color: '#71717A', label: 'נדחתה',         icon: <XCircle size={12} /> },
}

function fmtDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

export type InvRow = {
  id: string
  status: string
  scheduled_at: string | null
  created_at: string
  job_id: string
  jobs: { id: string; title: string; city: string | null } | null
  candidates: { id: string; profiles: { full_name: string | null; phone: string | null } | null } | null
}

export default function InvitationsClient({ invitations: initial }: { invitations: InvRow[] }) {
  const [invitations, setInvitations] = useState<InvRow[]>(initial)
  const [cancelling, setCancelling]   = useState<string | null>(null)

  async function cancelInvitation(id: string) {
    if (!confirm('לבטל את ההזמנה?')) return
    setCancelling(id)
    const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' })
    setCancelling(null)
    if (res.ok) {
      setInvitations(prev => prev.filter(i => i.id !== id))
    }
  }

  const pending  = invitations.filter(i => i.status === 'ממתינה').length
  const accepted = invitations.filter(i => i.status === 'התקבלה').length

  return (
    <div className="p-4 md:p-8 max-w-3xl" dir="rtl">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            הזמנות שנשלחו
          </h1>
          <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
            {invitations.length} הזמנות · {pending} ממתינות · {accepted} התקבלו
          </p>
        </div>
        <Link href="/institution/candidates"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white no-underline"
          style={{ background: 'var(--purple)' }}>
          <Send size={14} />הזמיני מועמדת
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Send size={36} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--ink-3)' }}>לא נשלחו הזמנות עדיין</p>
          <Link href="/institution/candidates" className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>
            חפשי מועמדות →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map(inv => {
            const cand = inv.candidates
            const job  = inv.jobs
            const sc   = STATUS_CFG[inv.status] ?? STATUS_CFG['נדחתה']
            return (
              <div key={inv.id}
                className="rounded-[16px] border p-5"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>
                      {cand?.profiles?.full_name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                      {job?.title && (
                        <Link href={`/institution/jobs/${job.id}`}
                          className="font-semibold no-underline" style={{ color: 'var(--purple)' }}>
                          {job.title}
                        </Link>
                      )}
                      {job?.city && <span>· {job.city}</span>}
                      {cand?.profiles?.phone && (
                        <a href={`tel:${cand.profiles.phone}`} className="no-underline" style={{ color: 'var(--teal)' }}>
                          {cand.profiles.phone}
                        </a>
                      )}
                    </div>
                    {inv.scheduled_at && (
                      <p className="flex items-center gap-1 mt-1.5 text-[12px] font-semibold" style={{ color: 'var(--purple)' }}>
                        <Calendar size={11} />ראיון מוצע: {fmtDt(inv.scheduled_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.icon}{sc.label}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                      {fmtDate(inv.created_at)}
                    </span>
                    {inv.status === 'ממתינה' && (
                      <button
                        onClick={() => cancelInvitation(inv.id)}
                        disabled={cancelling === inv.id}
                        className="flex items-center gap-1 h-6 px-2 rounded-[6px] text-[11px] font-semibold transition-all mt-0.5"
                        style={{ color: '#DC2626', background: '#FEF2F2', opacity: cancelling === inv.id ? 0.6 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                      >
                        <X size={10} />
                        {cancelling === inv.id ? 'מבטל...' : 'בטלי הזמנה'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
