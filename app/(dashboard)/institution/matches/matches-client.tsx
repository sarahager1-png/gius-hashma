'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Phone, FileText, MapPin, MessageCircle, Send, X, Check, CalendarDays, GraduationCap } from 'lucide-react'

interface Match {
  candidateId: string; candidateName: string; candidatePhone: string | null
  candidateCity: string | null; candidateDistrict: string | null
  college: string | null; academicLevel: string | null; specialization: string | null
  availabilityStatus: string; cvUrl: string | null
  jobId: string; jobTitle: string; score: number; reasons: string[]
}

function scoreStyle(s: number) {
  if (s >= 9) return { bg: 'var(--green-bg)',   color: 'var(--green)' }
  if (s >= 6) return { bg: 'var(--purple-050)', color: 'var(--purple)' }
  return          { bg: 'var(--amber-bg)',   color: 'var(--amber)' }
}

function waLink(phone: string | null, name: string, job: string) {
  if (!phone) return '#'
  const p = phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')
  const text = encodeURIComponent(`שלום ${name},\nאנו מעוניינים להזמין אותך לראיון למשרת "${job}".\nנשמח לשמוע אם הצעה זו מתאימה לך!`)
  return `https://wa.me/972${p}?text=${text}`
}

function InviteModal({ match, institutionId, onClose, onSent }: {
  match: Match; institutionId: string; onClose: () => void; onSent: (key: string) => void
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  async function send() {
    setSending(true); setErr('')
    const body: Record<string, string> = {
      institution_id: institutionId,
      candidate_id: match.candidateId,
      job_id: match.jobId,
    }
    if (date) body.scheduled_at = new Date(`${date}T${time || '09:00'}`).toISOString()
    const res = await fetch('/api/invitations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSending(false)
    if (res.ok || res.status === 409) { onSent(`${match.jobId}:${match.candidateId}`); onClose() }
    else { const d = await res.json(); setErr(d.error === 'Already invited' ? 'הזמנה כבר נשלחה למועמדת זו' : d.error) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,11,35,.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md overflow-hidden"
        style={{ borderRadius: '20px', background: '#fff', boxShadow: '0 24px 80px rgba(15,11,35,.25)' }} dir="rtl">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #00A7B5 100%)' }} />
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>שליחת הזמנה לראיון</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{match.candidateName} · {match.jobTitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}>
              <X size={16} style={{ color: 'var(--ink-3)' }} />
            </button>
          </div>
          {match.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {match.reasons.map(r => (
                <span key={r} className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--teal-050)', color: 'var(--teal-600)' }}>
                  <Check size={9} strokeWidth={3} />{r}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-3)' }}>תאריך הראיון (אופציונלי)</label>
              <div className="flex gap-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-[10px] border text-[14px] outline-none"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }} />
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-24 h-10 px-3 rounded-[10px] border text-[14px] outline-none"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
            </div>
            {err && <p className="text-[13px] px-3 py-2 rounded-[8px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{err}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={send} disabled={sending}
                className="flex-1 h-11 rounded-[10px] text-[14px] font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--purple-600) 100%)', opacity: sending ? 0.7 : 1 }}>
                <Send size={14} />{sending ? 'שולח...' : 'שלח הזמנה'}
              </button>
              <button onClick={onClose} className="h-11 px-4 rounded-[10px] text-[14px] font-semibold border"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MatchesClient({ institutionId }: { institutionId: string }) {
  const searchParams = useSearchParams()
  const focusJobId = searchParams.get('job') ?? null
  const focusCandId = searchParams.get('candidate') ?? null

  const [inviteModal, setInviteModal] = useState<Match | null>(null)
  const [invitedKeys, setInvitedKeys] = useState<Set<string>>(new Set())
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const qc = useQueryClient()

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ['institution-matches', institutionId],
    queryFn: () => fetch('/api/institution/matches').then(r => r.json()),
  })

  // Scroll to and highlight the focused pair once data loads
  useEffect(() => {
    if (!focusJobId || !focusCandId || matches.length === 0) return
    const key = `${focusJobId}:${focusCandId}`
    const el = rowRefs.current[key]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedKey(key)
    const t = setTimeout(() => setHighlightedKey(null), 3000)
    return () => clearTimeout(t)
  }, [matches, focusJobId, focusCandId])

  function markInvited(key: string) {
    setInvitedKeys(prev => new Set(prev).add(key))
    qc.invalidateQueries({ queryKey: ['institution-matches'] })
  }

  const byJob: Record<string, { jobId: string; jobTitle: string; items: Match[] }> = {}
  for (const m of matches) {
    if (!byJob[m.jobId]) byJob[m.jobId] = { jobId: m.jobId, jobTitle: m.jobTitle, items: [] }
    byJob[m.jobId].items.push(m)
  }

  // Put the focused job group first so it's immediately visible
  const sortedGroups = Object.values(byJob).sort((a, b) => {
    if (focusJobId) {
      if (a.jobId === focusJobId) return -1
      if (b.jobId === focusJobId) return 1
    }
    return 0
  })

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {inviteModal && (
        <InviteModal match={inviteModal} institutionId={institutionId}
          onClose={() => setInviteModal(null)} onSent={markInvited} />
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="page-title">התאמות מועמדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">
            {isLoading ? 'מחשב...' : `${matches.length} התאמות למשרות שלכם — לפי מחוז, התמחות ועיר`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state__icon"><Sparkles size={28} /></div>
          <p className="empty-state__title">מחשב התאמות...</p>
        </div></div>
      ) : matches.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state__icon"><Sparkles size={28} /></div>
          <p className="empty-state__title">אין התאמות כרגע</p>
          <p className="empty-state__text">ודאי שיש משרות פעילות עם מחוז מוגדר, וכי מועמדות מחפשות באותו מחוז</p>
        </div></div>
      ) : (
        <div className="space-y-5">
          {sortedGroups.map(group => (
            <div key={group.jobId} className="rounded-[16px] border overflow-hidden"
              style={{ background: '#fff', borderColor: 'var(--line)', borderInlineStart: '3px solid var(--purple)', boxShadow: '0 1px 4px rgba(75,46,131,.06)' }}>

              <div className="px-5 py-3.5 flex items-center justify-between gap-4"
                style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line-soft)' }}>
                <span className="font-bold text-[15px]" style={{ color: 'var(--ink)' }}>{group.jobTitle}</span>
                <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                  {group.items.length} מתאימות
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {group.items.map(m => {
                  const sc = scoreStyle(m.score)
                  const key = `${m.jobId}:${m.candidateId}`
                  const alreadyInvited = invitedKeys.has(key)
                  const isHighlighted = highlightedKey === key
                  return (
                    <div
                      key={key}
                      ref={el => { rowRefs.current[key] = el }}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                      style={{
                        background: isHighlighted ? 'var(--purple-050)' : undefined,
                        boxShadow: isHighlighted ? 'inset 0 0 0 2px var(--purple-200)' : undefined,
                        transition: 'background 0.6s ease, box-shadow 0.6s ease',
                      }}
                      onMouseEnter={e => { if (!isHighlighted) e.currentTarget.style.background = 'var(--bg-2)' }}
                      onMouseLeave={e => { if (!isHighlighted) e.currentTarget.style.background = 'transparent' }}>

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-[15px] shrink-0"
                        style={{ background: sc.bg, color: sc.color }}>{m.score}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Link href={`/candidates/${m.candidateId}`}
                            className="font-bold text-[14px] no-underline hover:underline" style={{ color: 'var(--ink)' }}>
                            {m.candidateName}
                          </Link>
                          {m.specialization && (
                            <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>{m.specialization}</span>
                          )}
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--bg-3)', color: 'var(--ink-3)' }}>{m.availabilityStatus}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--ink-4)' }}>
                          {m.candidateCity && <span className="flex items-center gap-1"><MapPin size={10} />{m.candidateCity}</span>}
                          {m.candidateDistrict && <span>{m.candidateDistrict}</span>}
                          {m.academicLevel && <span className="flex items-center gap-1"><GraduationCap size={10} />{m.academicLevel}</span>}
                        </div>
                        {m.reasons.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {m.reasons.map(r => (
                              <span key={r} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--teal-050)', color: 'var(--teal-600)' }}>
                                <Check size={9} strokeWidth={3} />{r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      </div>{/* end left flex */}

                      <div className="flex items-center gap-1.5 shrink-0 sm:ms-auto">
                        {m.cvUrl && (
                          <a href={m.cvUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] border text-[11.5px] font-medium transition-all"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--purple)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--purple-200)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}>
                            <FileText size={12} />קו״ח
                          </a>
                        )}
                        {m.candidatePhone && (
                          <a href={`tel:${m.candidatePhone}`}
                            className="w-8 h-8 rounded-[8px] border flex items-center justify-center transition-all"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink-4)', background: '#fff' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--purple)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--purple-200)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-4)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}>
                            <Phone size={13} />
                          </a>
                        )}
                        <a href={waLink(m.candidatePhone, m.candidateName, m.jobTitle)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] border text-[11.5px] font-medium transition-all"
                          style={{ borderColor: '#BBF7D0', color: '#16A34A', background: '#F0FDF4' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DCFCE7' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F0FDF4' }}>
                          <MessageCircle size={12} />WA
                        </a>
                        <button onClick={() => !alreadyInvited && setInviteModal(m)} disabled={alreadyInvited}
                          className="flex items-center gap-1 h-8 px-3 rounded-[8px] border text-[12px] font-bold transition-all"
                          style={alreadyInvited
                            ? { borderColor: '#BBF7D0', color: 'var(--green)', background: 'var(--green-bg)' }
                            : { borderColor: 'var(--purple-200)', color: 'var(--purple)', background: 'var(--purple-050)' }}
                          onMouseEnter={e => { if (!alreadyInvited) e.currentTarget.style.background = 'var(--purple-100)' }}
                          onMouseLeave={e => { if (!alreadyInvited) e.currentTarget.style.background = 'var(--purple-050)' }}>
                          {alreadyInvited ? <><Check size={12} />הוזמנה</> : <><CalendarDays size={12} />הזמן</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
