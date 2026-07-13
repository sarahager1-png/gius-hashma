'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Copy, Pencil, XCircle, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const PLACEMENT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  'מילוי מקום לחופשת לידה': { bg: '#FFF0F3', color: '#C2185B', icon: '👶' },
  'שיבוץ לשנה':             { bg: '#E8F5E9', color: '#2E7D32', icon: '📅' },
  'שיבוץ קבוע':             { bg: '#EDE9FE', color: '#5B3E9E', icon: '📌' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'פעילה':    { bg: '#E4F6ED', color: '#1A7A4A' },
  'מושהית':   { bg: '#FDF3E3', color: '#B45309' },
  'אוישה':    { bg: '#EDE9FE', color: '#5B3E9E' },
  'בוטלה':    { bg: '#F4F4F5', color: '#71717A' },
  'פג תוקפה': { bg: '#F4F4F5', color: '#71717A' },
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}

interface Job {
  id: string
  title: string
  city: string | null
  status: string
  job_type: string | null
  placement_type: string | null
  start_date: string | null
  expires_at: string | null
  created_at: string
  applications?: { count: number }[]
}

interface Props {
  jobs: Job[]  // passed as initialJobs internally
}

export default function JobsListClient({ jobs: initialJobs }: Props) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [closing, setClosing] = useState<string | null>(null)
  const [filling, setFilling] = useState<string | null>(null)

  async function handleFilled(e: React.MouseEvent, jobId: string) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('לסמן שהמשרה התאיישה? ההגשות הפתוחות ייסגרו והמועמדות יקבלו הודעה מסודרת.')) return
    setFilling(jobId)
    await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'אוישה' }) })
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'אוישה' } : j))
    setFilling(null)
    router.refresh()
  }

  async function handleClose(e: React.MouseEvent, jobId: string) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('להוריד את המשרה מהלוח? ההגשות הפתוחות ייסגרו.')) return
    setClosing(jobId)
    await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'בוטלה' }) })
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'בוטלה' } : j))
    setClosing(null)
    router.refresh()
  }

  async function handleDuplicate(e: React.MouseEvent, jobId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDuplicating(jobId)
    router.push(`/institution/jobs/new?duplicate=${jobId}`)
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
        <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>עדיין לא פרסמת משרות</p>
        <Link href="/institution/jobs/new" className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>
          פרסמי משרה ראשונה →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map(job => {
        const appCount = job.applications?.[0]?.count ?? 0
        const ss = STATUS_STYLE[job.status] ?? { bg: '#F4F4F5', color: '#71717A' }
        const pc = job.placement_type ? (PLACEMENT_COLORS[job.placement_type] ?? null) : null
        const isDuplicating = duplicating === job.id
        const isClosing = closing === job.id
        const isFilling = filling === job.id
        const canClose = job.status === 'פעילה'

        return (
          <div
            key={job.id}
            className="rounded-[16px] border overflow-hidden transition-all relative group"
            style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 6px 22px rgba(75,46,131,.11)'
              e.currentTarget.style.borderColor = 'var(--purple-200)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              e.currentTarget.style.borderColor = 'var(--line)'
            }}
          >
            {/* Placement banner */}
            {pc && (
              <div className="px-5 py-2 flex items-center gap-2"
                style={{ background: pc.bg, borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                <span className="text-[13px]">{pc.icon}</span>
                <span className="text-[12px] font-bold" style={{ color: pc.color }}>{job.placement_type}</span>
                {job.start_date && (
                  <span className="ms-auto text-[12px] font-medium" style={{ color: pc.color, opacity: .75 }}>
                    מ-{fmtDate(job.start_date)}
                  </span>
                )}
              </div>
            )}

            {/* Main card — link area */}
            <Link href={`/institution/jobs/${job.id}`}
              className="block p-5 no-underline"
              style={{ textDecoration: 'none' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{job.title}</p>
                  <div className="flex items-center gap-3 text-[13px]" style={{ color: 'var(--ink-3)' }}>
                    {job.city && <span>{job.city}</span>}
                    {job.job_type && <span>{job.job_type}</span>}
                    <span>{appCount} הגשות</span>
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
                    פורסם {formatDate(job.created_at)}
                    {job.start_date && !pc && (
                      <span className="me-2" style={{ color: '#1FAF6E' }}> · כניסה {fmtDate(job.start_date)}</span>
                    )}
                    {job.expires_at && (
                      <span style={{ color: new Date(job.expires_at) < new Date() ? '#DC2626' : 'var(--ink-4)' }}>
                        {' '}· תוקף עד {fmtDate(job.expires_at)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Status + action buttons (leave space for them) */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-full" style={ss}>
                    {job.status}
                  </span>
                </div>
              </div>
            </Link>

            {/* Action bar — always visible (works on mobile, not hover-gated) */}
            <div
              className="px-4 md:px-5 py-3 flex items-center gap-2 flex-wrap"
              style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--bg-3)' }}
            >
              {canClose && (
                <button
                  onClick={e => handleFilled(e, job.id)}
                  disabled={isFilling}
                  title="סמני שהמשרה אוישה"
                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-[8px] text-[12.5px] font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: 'var(--teal)' }}
                >
                  <CheckCircle2 size={14} />
                  {isFilling ? 'רושם…' : 'המשרה התאיישה'}
                </button>
              )}

              <div className="flex items-center gap-1.5 ms-auto">
                {canClose && (
                  <button
                    onClick={e => handleClose(e, job.id)}
                    disabled={isClosing}
                    title="המשרה ירדה מהלוח (בוטלה)"
                    className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] text-[12px] font-bold transition-all disabled:opacity-60"
                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                  >
                    <XCircle size={12} />
                    {isClosing ? '...' : 'ירדה'}
                  </button>
                )}
                <button
                  onClick={e => handleDuplicate(e, job.id)}
                  disabled={isDuplicating}
                  title="שכפלי משרה"
                  className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] text-[12px] font-bold transition-all disabled:opacity-60"
                  style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid var(--purple-200)' }}
                >
                  <Copy size={12} />
                  {isDuplicating ? '...' : 'שכפלי'}
                </button>
                <Link
                  href={`/institution/jobs/${job.id}/edit`}
                  onClick={e => e.stopPropagation()}
                  title="ערכי משרה"
                  className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] text-[12px] font-bold no-underline transition-all"
                  style={{ background: 'var(--bg-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}
                >
                  <Pencil size={12} />ערכי
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
