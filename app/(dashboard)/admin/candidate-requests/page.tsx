'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Check, X, MessageCircle, Copy, Phone, MapPin, GraduationCap, Clock, Mail, School, CalendarRange } from 'lucide-react'

interface PracticalWork { year: string; school_name: string; supervisor_name: string; supervisor_phone: string }

interface CandidateRequest {
  id: string
  full_name: string
  phone: string
  email: string | null
  city: string | null
  college: string | null
  graduation_year: number | null
  specialization: string | null
  academic_level: string | null
  practical_work: PracticalWork[] | null
  availability_from: string | null
  availability_to: string | null
  status: 'ממתינה' | 'אושרה' | 'נדחתה'
  access_code: string | null
  created_at: string
}

interface ApprovalResult {
  code: string
  waLink: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  'ממתינה': { background: 'var(--amber-bg)',   color: 'var(--amber)' },
  'אושרה':  { background: 'var(--green-bg)',   color: 'var(--green)' },
  'נדחתה':  { background: 'var(--red-bg)',     color: 'var(--red)'   },
}

export default function CandidateRequestsPage() {
  const [requests, setRequests] = useState<CandidateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [approvalResults, setApprovalResults] = useState<Record<string, ApprovalResult>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ממתינה' | 'אושרה' | 'נדחתה' | 'הכל'>('ממתינה')

  async function load() {
    const res = await fetch('/api/candidate-requests')
    if (res.ok) setRequests(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(req: CandidateRequest) {
    setProcessing(req.id)
    const res = await fetch(`/api/candidate-requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    if (res.ok) {
      const data = await res.json()
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'אושרה', access_code: data.code } : r))
      setApprovalResults(prev => ({ ...prev, [req.id]: { code: data.code, waLink: data.waLink } }))
    }
    setProcessing(null)
  }

  async function reject(id: string) {
    setProcessing(id)
    const res = await fetch(`/api/candidate-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    if (res.ok) setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'נדחתה' } : r))
    setProcessing(null)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filter === 'הכל' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'ממתינה').length

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
          <UserPlus size={20} />
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ color: 'var(--ink)' }}>
            בקשות הצטרפות
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold text-white me-2"
                style={{ background: 'var(--purple)' }}>
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
            מועמדות שביקשו להצטרף למערכת — לאשר ולשלוח קוד גישה
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg p-0.5 gap-0.5 mb-6 w-fit" style={{ background: 'var(--bg-2)' }}>
        {(['ממתינה', 'אושרה', 'נדחתה', 'הכל'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-2 rounded-md text-[13px] font-semibold transition-all"
            style={filter === s
              ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
              : { background: 'transparent', color: 'var(--ink-3)' }
            }>
            {s}
            {s === 'ממתינה' && pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white me-1.5"
                style={{ background: 'var(--teal)' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-16" style={{ color: 'var(--ink-3)' }}>טוען...</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><UserPlus size={28} /></div>
            <p className="empty-state__title">אין בקשות {filter !== 'הכל' ? `בסטטוס ${filter}` : ''}</p>
            <p className="empty-state__text">
              {filter === 'ממתינה' ? 'אין כרגע בקשות ממתינות. כשתגיע בקשה חדשה היא תופיע כאן.' : 'לא נמצאו בקשות בקטגוריה זו'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const result = approvalResults[req.id]
            const isPending = req.status === 'ממתינה'
            const isProcessing = processing === req.id

            return (
              <div key={req.id} className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-extrabold text-[14px] shrink-0"
                        style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                        {req.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-[16px]" style={{ color: 'var(--ink)' }}>{req.full_name}</div>
                        <div className="flex items-center gap-3 mt-0.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                          <a href={`tel:${req.phone}`} className="flex items-center gap-1" style={{ color: 'var(--teal)', textDecoration: 'none' }}>
                            <Phone size={11} />{req.phone}
                          </a>
                          {req.city && <span className="flex items-center gap-1"><MapPin size={11} />{req.city}</span>}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-bold me-auto"
                        style={STATUS_STYLE[req.status]}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                      {req.college && <span className="flex items-center gap-1"><GraduationCap size={11} />{req.college}</span>}
                      {req.academic_level && <span>{req.academic_level}</span>}
                      {req.specialization && <span style={{ background: 'var(--purple-050)', color: 'var(--purple)', padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>{req.specialization}</span>}
                      {req.graduation_year && <span>סיום {req.graduation_year}</span>}
                      <span className="flex items-center gap-1 me-auto" style={{ color: 'var(--ink-4)' }}>
                        <Clock size={11} />{fmtDate(req.created_at)}
                      </span>
                    </div>
                    {(req.availability_from || req.availability_to) && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold"
                        style={{ color: 'var(--teal-600)' }}>
                        <CalendarRange size={11} />
                        זמינות: {req.availability_from ? fmtDate(req.availability_from) : '?'}
                        {req.availability_to ? ` — ${fmtDate(req.availability_to)}` : ''}
                      </div>
                    )}
                    {req.practical_work && req.practical_work.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {req.practical_work.map((pw, i) => (
                          <div key={i} className="flex flex-wrap gap-2 text-[12px] px-2 py-1 rounded-[8px]"
                            style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                            <span className="flex items-center gap-1 font-bold"><School size={11} />עבודה מעשית {pw.year}</span>
                            {pw.school_name && <span>· {pw.school_name}</span>}
                            {pw.supervisor_name && <span>· מדפית: {pw.supervisor_name}</span>}
                            {pw.supervisor_phone && <span dir="ltr">· {pw.supervisor_phone}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval result — code + WA + email buttons */}
                {(result || req.access_code) && (() => {
                  const code = result?.code ?? req.access_code ?? ''
                  const waLink = result?.waLink
                  const mailLink = req.email
                    ? `mailto:${req.email}?subject=${encodeURIComponent('אושרת במערכת גיוס והשמה חב"ד')}&body=${encodeURIComponent(`שלום ${req.full_name},\nשמחים לבשר שאושרת להצטרף למערכת גיוס והשמה.\nקוד הגישה שלך: ${code}\n\nבברכה,\nצוות המערכת`)}`
                    : null
                  return (
                    <div className="mt-4 p-3 rounded-[12px]" style={{ background: 'var(--teal-050)', border: '1px solid var(--teal-100)' }}>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--teal-700)' }}>קוד גישה:</span>
                        <span className="font-mono font-extrabold text-[18px] tracking-widest" style={{ color: 'var(--teal-700)' }}>
                          {code}
                        </span>
                        <button onClick={() => copyCode(code)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#fff', color: 'var(--teal-600)', border: '1px solid var(--teal-100)' }}>
                          <Copy size={10} />
                          {copied === code ? 'הועתק!' : 'העתקה'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold text-white"
                            style={{ background: '#25D366' }}>
                            <MessageCircle size={14} />שליחה בוואצאפ
                          </a>
                        )}
                        {mailLink && (
                          <a href={mailLink}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold text-white"
                            style={{ background: '#3B82F6' }}>
                            <Mail size={14} />שליחה במייל
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Action buttons */}
                {isPending && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => approve(req)}
                      disabled={isProcessing}
                      className="btn btn-teal"
                      style={{ height: '36px', fontSize: '13px', opacity: isProcessing ? 0.6 : 1 }}>
                      <Check size={15} />
                      {isProcessing ? 'מאשרת...' : 'אישור — שלח קוד'}
                    </button>
                    <button
                      onClick={() => reject(req.id)}
                      disabled={isProcessing}
                      className="btn btn-ghost"
                      style={{ height: '36px', fontSize: '13px', opacity: isProcessing ? 0.6 : 1 }}>
                      <X size={15} />
                      דחייה
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
