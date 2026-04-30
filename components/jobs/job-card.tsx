'use client'

import { useState } from 'react'
import { MapPin, GraduationCap, Send, CheckCircle2, CalendarDays } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Job } from '@/lib/types'

interface Props {
  job: Job & { institutions?: { institution_name: string; city: string | null; institution_type: string | null } }
  applied: boolean
  candidateId: string | null
}

const TYPE_CFG: Record<string, { bg: string; color: string }> = {
  "סטאג'": { bg: 'var(--purple-050)', color: 'var(--purple)'    },
  'חלקי':  { bg: 'var(--teal-050)',   color: 'var(--teal-600)'  },
  'מלא':   { bg: 'var(--green-bg)',   color: 'var(--green)'     },
}

const INST_TYPE_CFG: Record<string, { bg: string; color: string }> = {
  'שלהבות חב"ד': { bg: 'var(--purple-050)', color: 'var(--purple)'   },
  'בית חינוך':    { bg: 'var(--teal-050)',   color: 'var(--teal-600)' },
  'קהילתי':       { bg: 'var(--amber-bg)',   color: 'var(--amber)'    },
}

export default function JobCard({ job, applied: initialApplied, candidateId }: Props) {
  const [applied, setApplied] = useState(initialApplied)
  const [applying, setApplying] = useState(false)

  const inst = job.institutions
  const typeCfg = TYPE_CFG[job.job_type ?? ''] ?? { bg: '#F4F4F5', color: '#52525B' }

  async function apply() {
    if (!candidateId || applied) return
    setApplying(true)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id }),
    })
    setApplying(false)
    if (res.ok) setApplied(true)
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #FDFCFF 0%, #FAF8FE 100%)',
        borderRadius: 22,
        border: '1px solid var(--line)',
        boxShadow: '0 2px 12px rgba(75,46,131,.10), 0 1px 3px rgba(75,46,131,.07)',
        transition: 'box-shadow 240ms, transform 240ms, border-color 240ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 16px 40px rgba(75,46,131,.20), 0 4px 12px rgba(75,46,131,.12)'
        el.style.transform = 'translateY(-4px) scale(1.01)'
        el.style.borderColor = 'var(--purple-200)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 2px 12px rgba(75,46,131,.10), 0 1px 3px rgba(75,46,131,.07)'
        el.style.transform = 'translateY(0) scale(1)'
        el.style.borderColor = 'var(--line)'
      }}
    >
      {/* Signature brand bar — always purple→teal */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #00A7B5 100%)' }} />
      {/* Card body */}
      <div style={{ padding: '22px 22px 18px' }}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-[21px] font-extrabold leading-tight"
              style={{ color: 'var(--purple)', letterSpacing: '-.02em' }}
            >
              {job.title}
            </h3>
            {inst?.institution_name && (
              <p className="text-[13.5px] font-semibold mt-0.5" style={{ color: 'var(--ink-2)' }}>
                {inst.institution_name}
              </p>
            )}
          </div>
          {job.job_type && (
            <span
              className="shrink-0 text-[11.5px] font-bold px-3 py-1 rounded-full mt-1"
              style={{ background: typeCfg.color, color: '#fff', boxShadow: `0 2px 8px ${typeCfg.color}44` }}
            >
              {job.job_type}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
          {job.city && (
            <span className="flex items-center gap-1 text-[13px] font-bold" style={{ color: 'var(--red)' }}>
              <MapPin size={13} strokeWidth={2.5} />
              {job.city}
            </span>
          )}
          {job.specialization && (
            <span className="flex items-center gap-1 text-[13px] font-medium" style={{ color: 'var(--ink-3)' }}>
              <GraduationCap size={13} />
              {job.specialization}
            </span>
          )}
          {inst?.institution_type && (() => {
            const itc = INST_TYPE_CFG[inst.institution_type!] ?? { bg: '#F3F4F6', color: '#6B7280' }
            return (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: itc.bg, color: itc.color }}>
                {inst.institution_type}
              </span>
            )
          })()}
          {(job.start_date || job.end_date) && (
            <span className="flex items-center gap-1 text-[13px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--teal-050)', color: 'var(--teal-700)' }}>
              <CalendarDays size={12} />
              {job.start_date
                ? new Date(job.start_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
                : '—'}
              {' → '}
              {job.end_date
                ? new Date(job.end_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </span>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="mb-4">
            <p className="text-[12px] font-bold mb-1" style={{ color: 'var(--ink-2)' }}>דרישות התפקיד</p>
            <p className="text-[13.5px] leading-relaxed line-clamp-3" style={{ color: 'var(--ink-3)' }}>
              {job.description}
            </p>
          </div>
        )}

        {/* Date */}
        <p className="text-[11.5px]" style={{ color: 'var(--ink-4)' }}>
          פורסם {formatDate(job.created_at)}
        </p>
      </div>

      {/* CTA footer */}
      <div style={{ padding: '14px 22px 20px', borderTop: '1px solid var(--line-soft)' }}>
        {candidateId ? (
          <button
            disabled={applied || applying}
            onClick={apply}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[15px] font-extrabold transition-all"
            style={{
              background: applied
                ? 'var(--green-bg)'
                : 'linear-gradient(135deg, var(--purple) 0%, var(--purple-600) 100%)',
              color: applied ? 'var(--green)' : '#fff',
              opacity: applying ? 0.7 : 1,
              boxShadow: applied ? 'none' : '0 4px 16px rgba(75,46,131,.35)',
            }}
          >
            {applied ? (
              <><CheckCircle2 size={17} />הגשה נשלחה</>
            ) : applying ? (
              '...'
            ) : (
              <><Send size={15} />לשליחת קו״ח</>
            )}
          </button>
        ) : (
          <a
            href="/register/candidate"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[15px] font-extrabold no-underline transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--purple-600) 100%)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(75,46,131,.35)',
            }}
          >
            <Send size={15} />הרשמי להגשה
          </a>
        )}
      </div>
    </div>
  )
}
