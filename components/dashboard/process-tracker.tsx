'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Activity, ChevronLeft, Phone, FileText } from 'lucide-react'

type StatusFilter = 'הכל' | 'ממתינה' | 'נצפתה'

interface Process {
  id: string
  candidateName: string
  candidatePhone: string | null
  candidateCity: string | null
  candidateCvUrl: string | null
  candidateId: string | null
  jobTitle: string
  jobId: string | null
  institutionName: string
  institutionId: string | null
  status: string
  daysWaiting: number
  updatedAt: string
  appliedAt: string
  interviewDate: string | null
  interviewStatus: string | null
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  'ממתינה': { background: '#FDF3E3', color: '#8A5A12' },
  'נצפתה':  { background: 'var(--teal-050)', color: 'var(--teal-600)' },
}

const IV_STYLE: Record<string, React.CSSProperties> = {
  'אושר':            { background: '#E4F6ED', color: '#1A7A4A' },
  'ממתין לאישור':    { background: '#FDF3E3', color: '#8A5A12' },
  'בוטל':            { background: 'var(--red-bg)', color: 'var(--red)' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function ProcessTracker() {
  const [filter, setFilter] = useState<StatusFilter>('הכל')
  const router = useRouter()

  const { data: rawData, isLoading } = useQuery<Process[]>({
    queryKey: ['admin-processes'],
    queryFn: () => fetch('/api/admin/processes').then(r => r.json()),
    refetchInterval: 60_000,
  })
  const data = Array.isArray(rawData) ? rawData : []

  const filtered = filter === 'הכל' ? data : data.filter(p => p.status === filter)
  const shown = filtered.slice(0, 25)

  const pendingCount = data.filter(p => p.status === 'ממתינה').length
  const viewedCount  = data.filter(p => p.status === 'נצפתה').length

  return (
    <section
      className="rounded-[14px] border"
      style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-3.5" style={{ paddingTop: 18 }}>
        <div className="flex-1">
          <h3 className="flex items-center gap-2.5 text-[16.5px] font-bold" style={{ color: 'var(--ink)' }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
              <Activity size={16} strokeWidth={2.2} />
            </span>
            מעקב תהליכים חי
          </h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)', marginInlineStart: 38 }}>
            {pendingCount} ממתינות · {viewedCount} נצפו · סה״כ {data.length} תהליכים פעילים
          </p>
        </div>

        {/* Segmented filter */}
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
          {(['הכל', 'ממתינה', 'נצפתה'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
              style={filter === s
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
                : { background: 'transparent', color: 'var(--ink-3)' }
              }
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 13.5, fontWeight: 500 }}>
          <thead>
            <tr>
              {['מועמדת', 'משרה · מוסד', 'סטטוס', 'ימים', 'ראיון', 'עדכון אחרון', 'פעולה'].map(h => (
                <th key={h}
                  className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-[.06em]"
                  style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--bg-3)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>
                  טוען נתונים...
                </td>
              </tr>
            )}
            {!isLoading && shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>
                  אין תהליכים פעילים כרגע
                </td>
              </tr>
            )}
            {shown.map(proc => (
              <tr key={proc.id}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Candidate */}
                <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <div className="font-bold text-[13.5px]" style={{ color: 'var(--ink)' }}>
                    {proc.candidateName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {proc.candidateCity && (
                      <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>{proc.candidateCity}</span>
                    )}
                    {proc.candidatePhone && (
                      <a
                        href={`tel:${proc.candidatePhone}`}
                        className="flex items-center gap-0.5 text-[12px]"
                        style={{ color: 'var(--teal-600)', textDecoration: 'none' }}
                      >
                        <Phone size={10} />
                        {proc.candidatePhone}
                      </a>
                    )}
                    {proc.candidateCvUrl && (
                      <a
                        href={proc.candidateCvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-0.5 text-[12px]"
                        style={{ color: 'var(--purple)', textDecoration: 'none' }}
                      >
                        <FileText size={10} />
                        קו״ח
                      </a>
                    )}
                  </div>
                </td>

                {/* Job + Institution */}
                <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <div className="font-semibold text-[13.5px]" style={{ color: 'var(--ink)' }}>
                    {proc.jobTitle}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                    {proc.institutionName}
                  </div>
                </td>

                {/* Status chip */}
                <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-bold"
                    style={STATUS_STYLE[proc.status] ?? {}}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                    {proc.status}
                  </span>
                </td>

                {/* Days waiting */}
                <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <span
                    className="font-bold text-[14px]"
                    style={{ color: proc.daysWaiting >= 14 ? 'var(--red)' : proc.daysWaiting >= 7 ? 'var(--amber)' : 'var(--ink)' }}
                  >
                    {proc.daysWaiting}
                  </span>
                  <span className="text-[12px] mr-1" style={{ color: 'var(--ink-4)' }}>ימים</span>
                </td>

                {/* Interview */}
                <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  {proc.interviewDate ? (
                    <div>
                      <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>
                        {fmtDateTime(proc.interviewDate)}
                      </div>
                      {proc.interviewStatus && (
                        <span
                          className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0 rounded-full text-[11px] font-bold"
                          style={IV_STYLE[proc.interviewStatus] ?? {}}
                        >
                          {proc.interviewStatus}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>—</span>
                  )}
                </td>

                {/* Last updated */}
                <td className="px-4 py-3.5 text-[12.5px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                  {fmtDate(proc.updatedAt)}
                </td>

                {/* Action */}
                <td className="px-4 py-3.5 text-end" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  {proc.institutionId && proc.jobId ? (
                    <button
                      onClick={() => router.push(`/jobs/${proc.jobId}`)}
                      className="inline-flex items-center gap-1 h-7 px-3 rounded-lg border text-[12px] font-semibold transition-all"
                      style={{ borderColor: 'var(--purple-200)', color: 'var(--purple)', background: 'var(--purple-050)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-100)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--purple-050)'}
                    >
                      פתח
                      <ChevronLeft size={12} />
                    </button>
                  ) : (
                    <span style={{ color: 'var(--ink-4)' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <span className="text-[13px] font-medium" style={{ color: 'var(--ink-3)' }}>
          מוצג {shown.length} מתוך {filtered.length} תהליכים
        </span>
        <button
          className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--purple)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-050)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => router.push('/admin/applications')}
        >
          כל התהליכים
          <ChevronLeft size={14} />
        </button>
      </div>
    </section>
  )
}
