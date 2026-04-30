'use client'

import { useState } from 'react'
import { Calendar, Building2, MapPin, Check, X, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react'

interface Invitation {
  id: string
  status: string
  scheduled_at: string | null
  created_at: string
  jobs: { title: string; city: string | null; job_type: string | null } | null
  institutions: { institution_name: string; phone: string | null; profiles?: { phone: string | null } | null } | null
}

const STATUS_CFG: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  'ממתינה':  { bg: '#EDE9FE', color: 'var(--purple)', icon: <Clock size={13} />,       label: 'ממתינה לתגובה' },
  'התקבלה': { bg: '#E4F6ED', color: '#1A7A4A', icon: <CheckCircle size={13} />, label: 'קיבלת' },
  'נדחתה':  { bg: '#F4F4F5', color: '#71717A', icon: <XCircle size={13} />,    label: 'לא יכולת' },
}

function fmtDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  return `לפני ${days} ימים`
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  invitations: Invitation[]
  candidateId: string
}

function buildInstWaLink(inv: Invitation) {
  const instPhone = inv.institutions?.phone ?? (inv.institutions?.profiles as { phone: string | null } | null)?.phone ?? ''
  if (!instPhone) return null
  const normalized = instPhone.replace(/\D/g, '').replace(/^0/, '972')
  const text = encodeURIComponent(
    `שלום,\nתודה על ההזמנה לראיון למשרת "${inv.jobs?.title ?? ''}" ב${inv.institutions?.institution_name ?? ''}.\nלצערי לא אוכל להגיע.\nמאחלת לך המשך יום טוב!`
  )
  return `https://wa.me/${normalized}?text=${text}`
}

export default function MyInvitationsClient({ invitations: initial, candidateId: _candidateId }: Props) {
  const [invitations, setInvitations] = useState(initial)
  const [responding, setResponding] = useState<string | null>(null)
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set())

  const pending  = invitations.filter(i => i.status === 'ממתינה').length
  const accepted = invitations.filter(i => i.status === 'התקבלה').length

  async function respond(invId: string, status: 'התקבלה' | 'נדחתה') {
    setResponding(invId)
    await fetch(`/api/invitations/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setInvitations(prev => prev.map(i => i.id === invId ? { ...i, status } : i))
    if (status === 'נדחתה') setDeclinedIds(p => new Set([...p, invId]))
    setResponding(null)
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">הזמנות לראיון</h1>
        <span className="brand-line" />
        <p className="page-subtitle">{pending > 0 ? `${pending} ממתינות לתגובה · ` : ''}{accepted} התקבלו · {invitations.length} סה״כ</p>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-[16px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Calendar size={40} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-3)' }}>אין הזמנות לראיון עדיין</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>מוסדות יכולים להזמין אותך ישירות למשרות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map(inv => {
            const sc  = STATUS_CFG[inv.status] ?? STATUS_CFG['נדחתה']
            const isPending = inv.status === 'ממתינה'

            return (
              <div key={inv.id}
                className="rounded-[16px] border p-5"
                style={{
                  background: isPending ? '#FDFCFF' : '#fff',
                  borderColor: isPending ? 'var(--purple-200)' : 'var(--line)',
                  boxShadow: isPending ? '0 2px 8px rgba(91,58,171,.08)' : 'var(--shadow-sm)',
                }}>

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>
                      {inv.jobs?.title ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[12.5px] flex-wrap" style={{ color: 'var(--ink-3)' }}>
                      {inv.institutions?.institution_name && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--ink-2)' }}>
                          <Building2 size={12} />
                          {inv.institutions.institution_name}
                        </span>
                      )}
                      {inv.jobs?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />{inv.jobs.city}
                        </span>
                      )}
                      {inv.jobs?.job_type && (
                        <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                          {inv.jobs.job_type}
                        </span>
                      )}
                    </div>
                    {inv.scheduled_at && (
                      <p className="flex items-center gap-1 mt-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--purple)' }}>
                        <Calendar size={12} />ראיון מוצע: {fmtDt(inv.scheduled_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                      {sc.icon}{sc.label}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>{fmtDate(inv.created_at)}</span>
                  </div>
                </div>

                {isPending && (
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                    <button
                      onClick={() => respond(inv.id, 'התקבלה')}
                      disabled={responding === inv.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-bold transition-all"
                      style={{ background: '#E4F6ED', color: '#1A7A4A' }}>
                      <Check size={14} />קבלת ההזמנה
                    </button>
                    <button
                      onClick={() => respond(inv.id, 'נדחתה')}
                      disabled={responding === inv.id}
                      className="flex-1 py-2 rounded-[8px] text-[13px] font-bold transition-all"
                      style={{ background: '#F4F4F5', color: '#71717A' }}>
                      <X size={13} className="inline ml-1" />לא יכולה כרגע
                    </button>
                  </div>
                )}

                {/* כפתור WA למוסד אחרי דחייה */}
                {inv.status === 'נדחתה' && declinedIds.has(inv.id) && (() => {
                  const waLink = buildInstWaLink(inv)
                  if (!waLink) return null
                  return (
                    <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                      <span className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>שלחי הודעה למוסד:</span>
                      <a href={waLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-bold text-white"
                        style={{ background: '#25D366' }}>
                        <MessageCircle size={14} />וואצאפ למוסד
                      </a>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
