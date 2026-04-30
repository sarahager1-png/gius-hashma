'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle, Phone, MapPin, GraduationCap, BookOpen, Send,
  CheckCircle, Loader2, Clock, X,
} from 'lucide-react'

interface CandidateRow {
  id: string
  city: string | null
  academic_level: string | null
  availability_status: string
  specialization: string | null
  study_day: string | null
  college: string | null
  placement_location: string | null
  prev_employer: string | null
  prev_role: string | null
  profiles: { full_name: string | null; phone: string | null } | null
}

interface InquiryRow {
  id: string
  message: string
  status: string
  institution_reply: string | null
  replied_at: string | null
  created_at: string
  candidates: CandidateRow | null
  jobs: { id: string; title: string } | null
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  'ממתינה': { label: 'ממתינה', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  'נצפתה':  { label: 'נצפתה',  bg: '#E0F2FE', color: '#0369A1', dot: '#0EA5E9' },
  'נענתה':  { label: 'נענתה',  bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
}

const AVAIL_PILL: Record<string, { bg: string; color: string }> = {
  "מחפשת סטאג'":      { bg: '#EDE9FE', color: '#5B21B6' },
  'פתוחה להצעות':      { bg: '#DDFAFB', color: '#007A84' },
  'משובצת':            { bg: '#DCFCE7', color: '#166534' },
  'בוגרת מחפשת משרה': { bg: '#FEF3C7', color: '#92400E' },
  'לא פעילה':          { bg: '#F3F4F6', color: '#6B7280' },
}

const GRADIENTS = [
  'linear-gradient(135deg,#5B3E9E,#00BCC8)',
  'linear-gradient(135deg,#C2185B,#FF8A65)',
  'linear-gradient(135deg,#1565C0,#42A5F5)',
  'linear-gradient(135deg,#2E7D32,#66BB6A)',
  'linear-gradient(135deg,#6A1B9A,#CE93D8)',
]

function fmt(d: string) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props { inquiries: InquiryRow[] }

export default function InquiriesClient({ inquiries: initial }: Props) {
  const [inquiries, setInquiries] = useState(initial)
  const [replyingId, setReplyingId]   = useState<string | null>(null)
  const [replyText, setReplyText]     = useState('')
  const [sending, setSending]         = useState(false)
  const [activeId, setActiveId]       = useState<string | null>(null)
  const router = useRouter()

  const pending = inquiries.filter(i => i.status === 'ממתינה').length

  async function markSeen(id: string) {
    await fetch(`/api/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'נצפתה' }),
    })
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'נצפתה' } : i))
  }

  async function sendReply(id: string) {
    if (!replyText.trim()) return
    setSending(true)
    const res = await fetch(`/api/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_reply: replyText.trim() }),
    })
    setSending(false)
    if (res.ok) {
      setInquiries(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'נענתה', institution_reply: replyText.trim(), replied_at: new Date().toISOString() } : i
      ))
      setReplyingId(null)
      setReplyText('')
    }
  }

  function openCard(inquiry: InquiryRow) {
    setActiveId(inquiry.id)
    if (inquiry.status === 'ממתינה') markSeen(inquiry.id)
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">תיבת פניות</h1>
          <p className="page-subtitle">
            {inquiries.length} פניות סה״כ{pending > 0 ? ` · ${pending} ממתינות לטיפול` : ''}
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="card-flat flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-2)' }}>
            <MessageCircle size={28} style={{ color: 'var(--ink-4)' }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-3)' }}>אין פניות עדיין</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>פניות ממועמדות יופיעו כאן</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((inquiry, idx) => {
            const cand = inquiry.candidates
            const name  = cand?.profiles?.full_name ?? '—'
            const phone = cand?.profiles?.phone ?? null
            const sc    = STATUS_CFG[inquiry.status] ?? STATUS_CFG['ממתינה']
            const av    = AVAIL_PILL[cand?.availability_status ?? ''] ?? { bg: '#F3F4F6', color: '#6B7280' }
            const grad  = GRADIENTS[idx % GRADIENTS.length]
            const initials = name !== '—' ? name.split(' ').slice(0, 2).map(w => w[0]).join('') : '?'
            const waLink = phone ? (() => {
              const n = phone.replace(/\D/g, '').replace(/^0/, '972')
              const t = encodeURIComponent(`שלום ${name.split(' ')[0]}, קיבלנו את פנייתך ונשמח לחזור אליך.`)
              return `https://wa.me/${n}?text=${t}`
            })() : null
            const isOpen = activeId === inquiry.id

            return (
              <div key={inquiry.id}
                className="rounded-[16px] overflow-hidden transition-all"
                style={{
                  background: '#fff',
                  border: `1px solid ${isOpen ? 'var(--purple-100)' : 'var(--line)'}`,
                  boxShadow: isOpen ? '0 4px 24px rgba(91,62,158,.12)' : 'var(--shadow-sm)',
                }}>

                {/* Status strip */}
                <div className="h-[3px] w-full"
                  style={{ background: `linear-gradient(90deg, ${sc.dot} 0%, ${sc.dot}44 100%)` }} />

                {/* Card header — always visible */}
                <button
                  className="w-full text-right p-5 flex items-start gap-4"
                  onClick={() => isOpen ? setActiveId(null) : openCard(inquiry)}>

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ background: grad }}>
                    {initials}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>{name}</span>
                        {cand?.availability_status && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: av.bg, color: av.color }}>
                            {cand.availability_status}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: sc.dot }} />
                          {sc.label}
                        </span>
                      </div>
                      <span className="text-[11.5px] shrink-0 flex items-center gap-1"
                        style={{ color: 'var(--ink-4)' }}>
                        <Clock size={11} />{fmt(inquiry.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {cand?.city && (
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                          <MapPin size={11} />{cand.city}
                        </span>
                      )}
                      {cand?.academic_level && (
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                          <GraduationCap size={11} />{cand.academic_level}
                        </span>
                      )}
                      {cand?.specialization && (
                        <span className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                          {cand.specialization}
                        </span>
                      )}
                    </div>
                    {/* Message preview when closed */}
                    {!isOpen && (
                      <p className="text-[12.5px] mt-2 truncate" style={{ color: 'var(--ink-3)' }}>
                        {inquiry.message}
                      </p>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--line-soft)' }}>

                    {/* Candidate profile strip */}
                    <div className="px-5 py-4 flex flex-wrap gap-4"
                      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line-soft)' }}>
                      {cand?.study_day && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px]"
                          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <BookOpen size={13} style={{ color: '#D97706' }} />
                          <span className="text-[12.5px] font-bold" style={{ color: '#92400E' }}>
                            יום לימודים: {cand.study_day}
                          </span>
                        </div>
                      )}
                      {cand?.college && (
                        <InfoChip label="מכללה" value={cand.college} />
                      )}
                      {cand?.placement_location && (
                        <InfoChip label="מקום שליחות" value={cand.placement_location} />
                      )}
                      {(cand?.prev_employer || cand?.prev_role) && (
                        <InfoChip
                          label="ניסיון"
                          value={[cand.prev_role, cand.prev_employer].filter(Boolean).join(' · ')}
                        />
                      )}
                      {phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} style={{ color: 'var(--ink-4)' }} />
                          <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-2)' }} dir="ltr">
                            {phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div className="px-5 py-4">
                      {inquiry.jobs && (
                        <p className="text-[11.5px] font-bold mb-2 flex items-center gap-1.5"
                          style={{ color: 'var(--ink-4)' }}>
                          📋 בנוגע למשרה: {inquiry.jobs.title}
                        </p>
                      )}
                      <div className="rounded-[12px] p-4"
                        style={{ background: 'var(--purple-050)', border: '1px solid var(--purple-100)' }}>
                        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap"
                          style={{ color: 'var(--ink)' }}>
                          {inquiry.message}
                        </p>
                      </div>
                    </div>

                    {/* Existing reply */}
                    {inquiry.institution_reply && (
                      <div className="px-5 pb-4">
                        <p className="text-[11.5px] font-bold mb-2" style={{ color: '#166534' }}>
                          ✅ תגובתך ({inquiry.replied_at ? fmt(inquiry.replied_at) : ''})
                        </p>
                        <div className="rounded-[12px] p-4"
                          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap"
                            style={{ color: '#166534' }}>
                            {inquiry.institution_reply}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reply area */}
                    {replyingId === inquiry.id ? (
                      <div className="px-5 pb-5 space-y-3">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={3}
                          placeholder="כתבי תגובה..."
                          autoFocus
                          className="w-full px-3 py-2.5 rounded-[10px] border text-[14px] outline-none resize-none"
                          style={{ borderColor: 'var(--purple)', background: '#fff', fontFamily: 'inherit' }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendReply(inquiry.id)}
                            disabled={!replyText.trim() || sending}
                            className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold text-white transition-all"
                            style={{
                              background: replyText.trim() && !sending
                                ? 'linear-gradient(135deg,var(--purple),var(--teal))'
                                : 'var(--bg-3)',
                              color: replyText.trim() && !sending ? '#fff' : 'var(--ink-4)',
                            }}>
                            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            שלחי תגובה
                          </button>
                          <button
                            onClick={() => { setReplyingId(null); setReplyText('') }}
                            className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] border text-[13px] font-semibold"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
                            <X size={14} />ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 pb-5 flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => setReplyingId(inquiry.id)}
                          className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
                          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--purple-100)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--purple-050)')}>
                          <MessageCircle size={14} />
                          {inquiry.institution_reply ? 'שלחי תגובה נוספת' : 'השיבי להודעה'}
                        </button>
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
                            style={{ background: '#E7FBF0', color: '#25D366' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#D1FAE5')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#E7FBF0')}>
                            <Phone size={14} />וואצאפ
                          </a>
                        )}
                        {inquiry.status === 'נענתה' && (
                          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold"
                            style={{ color: '#166534' }}>
                            <CheckCircle size={14} />הפנייה טופלה
                          </span>
                        )}
                      </div>
                    )}
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-[.06em]" style={{ color: 'var(--ink-4)' }}>{label}:</span>
      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-2)' }}>{value}</span>
    </div>
  )
}
