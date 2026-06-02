'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Sparkles, Phone, FileText, MapPin, GraduationCap, Building2, MessageCircle, Send, X, Check, Lightbulb } from 'lucide-react'

interface Match {
  candidateId: string
  candidateName: string
  candidatePhone: string | null
  candidateCity: string | null
  candidateDistrict: string | null
  college: string | null
  academicLevel: string | null
  specialization: string | null
  availabilityStatus: string
  cvUrl: string | null
  jobId: string
  jobTitle: string
  institutionId: string
  institutionName: string
  institutionDistrict: string | null
  institutionCity: string | null
  score: number
  reasons: string[]
}

function scoreStyle(s: number) {
  if (s >= 9) return { bg: 'var(--green-bg)',   color: 'var(--green)',   dot: '#22C55E' }
  if (s >= 6) return { bg: 'var(--purple-050)', color: 'var(--purple)',  dot: 'var(--purple)'  }
  return          { bg: 'var(--amber-bg)',   color: 'var(--amber)',   dot: '#F59E0B' }
}

function waLink(phone: string | null, name: string, job: string, inst: string) {
  if (!phone) return '#'
  const p = phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')
  const text = encodeURIComponent(`שלום ${name},\nיש לנו הזדמנות שיכולה להתאים לך — משרת "${job}" ב${inst}.\nהאם תרצי לשמוע פרטים נוספים?`)
  return `https://wa.me/972${p}?text=${text}`
}

interface SuggestModalProps {
  match: Match
  onClose: () => void
  onSent: (key: string) => void
}

function SuggestModal({ match, onClose, onSent }: SuggestModalProps) {
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  async function send() {
    setSending(true); setErr('')
    const res = await fetch('/api/admin/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institution_id: match.institutionId,
        candidate_id: match.candidateId,
        candidate_name: match.candidateName,
        job_title: match.jobTitle,
        reasons: match.reasons,
        note: note.trim() || null,
      }),
    })
    setSending(false)
    if (res.ok) {
      onSent(`${match.jobId}:${match.candidateId}`)
      onClose()
    } else {
      const d = await res.json()
      setErr(d.error ?? 'שגיאה בשליחה')
    }
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
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>הצעת התאמה למוסד</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {match.candidateName} · {match.jobTitle} · {match.institutionName}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}>
              <X size={16} style={{ color: 'var(--ink-3)' }} />
            </button>
          </div>

          {/* Match reasons */}
          {match.reasons.length > 0 && (
            <div className="rounded-[10px] px-3 py-2.5 mb-4 flex flex-wrap gap-1.5"
              style={{ background: 'var(--teal-050)' }}>
              {match.reasons.map(r => (
                <span key={r} className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#fff', color: 'var(--teal-600)' }}>
                  <Check size={9} strokeWidth={3} />{r}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-3)' }}>
                הערה למוסד (אופציונלי)
              </label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="למשל: מועמדת מצוינת עם ניסיון רלוונטי, ממליצה מאוד..."
                className="w-full px-3 py-2.5 rounded-[10px] border text-[14px] outline-none resize-none"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <p className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
              ההצעה תישלח כהתראה למוסד. המוסד יחליט אם לפנות למועמדת.
            </p>
            {err && <p className="text-[13px] px-3 py-2 rounded-[8px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{err}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={send} disabled={sending}
                className="flex-1 h-11 rounded-[10px] text-[14px] font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--purple-600) 100%)', opacity: sending ? 0.7 : 1 }}>
                <Send size={14} />{sending ? 'שולח...' : 'שלח הצעה למוסד'}
              </button>
              <button onClick={onClose}
                className="h-11 px-4 rounded-[10px] text-[14px] font-semibold border"
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

export default function MatchesPage() {
  const [suggestModal, setSuggestModal] = useState<Match | null>(null)
  const [suggestedKeys, setSuggestedKeys] = useState<Set<string>>(new Set())

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ['admin-matches'],
    queryFn: () => fetch('/api/admin/matches').then(r => r.json()),
  })

  function markSuggested(key: string) {
    setSuggestedKeys(prev => new Set(prev).add(key))
  }

  const byJob: Record<string, { job: string; inst: string; instId: string; jobId: string; items: Match[] }> = {}
  for (const m of matches) {
    if (!byJob[m.jobId]) byJob[m.jobId] = { job: m.jobTitle, inst: m.institutionName, instId: m.institutionId, jobId: m.jobId, items: [] }
    byJob[m.jobId].items.push(m)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {suggestModal && (
        <SuggestModal match={suggestModal} onClose={() => setSuggestModal(null)} onSent={markSuggested} />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="page-title">התאמות מועמדות-משרות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{matches.length} התאמות נמצאו — לפי מחוז, התמחות ועיר</p>
        </div>
      </div>
      <p className="text-[13px] mb-6 px-1" style={{ color: 'var(--ink-4)' }}>
        <Lightbulb size={13} className="inline me-1" style={{ color: 'var(--amber)' }} />
        כאן ניתן להציע התאמות למוסדות. המוסד יקבל התראה ויחליט אם לשלוח הזמנה למועמדת.
      </p>

      {isLoading ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><Sparkles size={28} /></div>
            <p className="empty-state__title">מחשב התאמות...</p>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><Sparkles size={28} /></div>
            <p className="empty-state__title">עדיין אין התאמות</p>
            <p className="empty-state__text">הוסיפי מחוז לפרופיל המועמדות והמוסדות כדי לקבל התאמות</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.values(byJob).map(group => (
            <div key={group.jobId} className="rounded-[16px] border overflow-hidden"
              style={{
                background: '#fff',
                borderColor: 'var(--line)',
                borderInlineStart: '3px solid var(--purple)',
                boxShadow: '0 1px 4px rgba(75,46,131,.06)',
              }}>

              {/* Job group header */}
              <div className="px-4 py-3 flex flex-wrap items-start justify-between gap-2"
                style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line-soft)' }}>
                <div className="min-w-0">
                  <span className="font-bold text-[14px]" style={{ color: 'var(--ink)' }}>{group.job}</span>
                  <span className="text-[12px] mx-1.5" style={{ color: 'var(--ink-4)' }}>·</span>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--ink-3)' }}>{group.inst}</span>
                </div>
                <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                  {group.items.length} מתאימות
                </span>
              </div>

              {/* Candidate rows */}
              <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {group.items.map(m => {
                  const sc = scoreStyle(m.score)
                  const key = `${m.jobId}:${m.candidateId}`
                  const alreadySuggested = suggestedKeys.has(key)

                  return (
                    <div key={key}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Score + Info row */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Score */}
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-[15px] shrink-0"
                          style={{ background: sc.bg, color: sc.color }}>
                          {m.score}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <Link href={`/candidates/${m.candidateId}`}
                              className="font-bold text-[14px] no-underline hover:underline"
                              style={{ color: 'var(--ink)' }}>
                              {m.candidateName}
                            </Link>
                            {m.specialization && (
                              <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                                {m.specialization}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--ink-4)' }}>
                            {m.candidateCity && (
                              <span className="flex items-center gap-1"><MapPin size={10} />{m.candidateCity}</span>
                            )}
                            {m.college && <span className="flex items-center gap-1"><GraduationCap size={10} />{m.college}</span>}
                            {m.academicLevel && <span>{m.academicLevel}</span>}
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
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {m.cvUrl && (
                          <a href={m.cvUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] border text-[11.5px] font-medium"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
                            <FileText size={12} />קו״ח
                          </a>
                        )}
                        {m.candidatePhone && (
                          <a href={`tel:${m.candidatePhone}`}
                            className="w-8 h-8 rounded-[8px] border flex items-center justify-center"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink-4)', background: '#fff' }}>
                            <Phone size={13} />
                          </a>
                        )}
                        <a href={waLink(m.candidatePhone, m.candidateName, m.jobTitle, m.institutionName)}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] border text-[11.5px] font-medium"
                          style={{ borderColor: '#BBF7D0', color: '#16A34A', background: '#F0FDF4' }}>
                          <MessageCircle size={12} />WA
                        </a>
                        <button
                          onClick={() => !alreadySuggested && setSuggestModal(m)}
                          disabled={alreadySuggested}
                          className="flex items-center gap-1 h-8 px-3 rounded-[8px] border text-[12px] font-bold"
                          style={alreadySuggested
                            ? { borderColor: '#BBF7D0', color: 'var(--green)', background: 'var(--green-bg)' }
                            : { borderColor: 'var(--purple-200)', color: 'var(--purple)', background: 'var(--purple-050)' }}>
                          {alreadySuggested
                            ? <><Check size={12} />הוצע</>
                            : <><Lightbulb size={12} />הצע</>}
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
