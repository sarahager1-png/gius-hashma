'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, MapPin, Clock, Building2, CalendarDays, Users, ChevronLeft } from 'lucide-react'
import type { Job } from '@/lib/types'

const STATUS_CFG: Record<string, { dot: string; color: string }> = {
  'פעילה':    { dot: '#22C55E', color: 'var(--green)'   },
  'מושהית':   { dot: '#F59E0B', color: 'var(--amber)'   },
  'אוישה':    { dot: 'var(--purple-200)', color: 'var(--purple)' },
  'בוטלה':    { dot: '#9CA3AF', color: '#6B7280' },
  'פג תוקפה': { dot: '#9CA3AF', color: '#6B7280' },
}

const TYPE_CFG: Record<string, { border: string; tag: string; tagText: string }> = {
  "סטאג'": { border: 'var(--purple)',   tag: 'var(--purple-050)', tagText: 'var(--purple)'   },
  'חלקי':  { border: 'var(--teal)',     tag: 'var(--teal-050)',   tagText: 'var(--teal-600)' },
  'מלא':   { border: 'var(--green)',    tag: 'var(--green-bg)',   tagText: 'var(--green)'    },
}
const DEFAULT_TYPE = { border: '#D1D5DB', tag: '#F3F4F6', tagText: '#6B7280' }

const INST_TYPE_CFG: Record<string, { bg: string; color: string }> = {
  'שלהבות חב"ד': { bg: 'var(--purple-050)', color: 'var(--purple)'   },
  'בית חינוך':    { bg: 'var(--teal-050)',   color: 'var(--teal-600)' },
  'קהילתי':       { bg: 'var(--amber-bg)',   color: 'var(--amber)'    },
}

const STATUSES = ['הכל', 'פעילה', 'מושהית', 'אוישה']

function daysSince(d: string) {
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (n === 0) return 'היום'
  if (n === 1) return 'אתמול'
  return `לפני ${n} ימים`
}

interface Props {
  jobs: (Job & { appCount?: number; newAppCount?: number })[]
  initialSearch?: string
}

export default function JobsAdminClient({ jobs, initialSearch = '' }: Props) {
  const router = useRouter()
  const [search, setSearch]   = useState(initialSearch)
  const [statusFilter, setStatus] = useState('הכל')

  const filtered = jobs.filter(j => {
    if (statusFilter !== 'הכל' && j.status !== statusFilter) return false
    const inst = (j.institutions as { institution_name?: string } | undefined)?.institution_name ?? ''
    if (search && !j.title.includes(search) && !inst.includes(search) && !(j.city ?? '').includes(search)) return false
    return true
  })

  const activeCount = jobs.filter(j => j.status === 'פעילה').length

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="page-title">משרות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{activeCount} פעילות · {jobs.length} סה&quot;כ</p>
        </div>
        <button
          onClick={() => router.push('/admin/jobs/new')}
          className="btn btn-primary"
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} strokeWidth={2.5} />
          משרה חדשה
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-7">
        <div className="relative" style={{ flex: '0 0 240px' }}>
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none" style={{ color: 'var(--ink-4)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
            className="w-full h-10 rounded-[10px] border text-[14px] outline-none font-medium"
            style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)',
              paddingInlineEnd: 36, paddingInlineStart: 14 }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
        <div className="flex rounded-[10px] border p-0.5 gap-0.5" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all"
              style={statusFilter === s
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                : { color: 'var(--ink-3)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><Building2 size={28} /></div>
            <p className="empty-state__title">{jobs.length === 0 ? 'אין משרות עדיין' : 'לא נמצאו תוצאות'}</p>
            <p className="empty-state__text">{jobs.length === 0 ? 'פרסמי את המשרה הראשונה כדי למשוך מועמדות מתאימות' : 'נסי לשנות את הסינון'}</p>
            {jobs.length === 0 && (
              <button onClick={() => router.push('/admin/jobs/new')} className="btn btn-primary mt-2">
                <Plus size={15} />פרסמי משרה
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))' }}>
          {filtered.map(job => {
            const instObj  = job.institutions as { institution_name?: string; institution_type?: string; city?: string } | undefined
            const inst     = instObj?.institution_name
            const instType = instObj?.institution_type
            const city     = job.city ?? instObj?.city
            const sc       = STATUS_CFG[job.status]       ?? STATUS_CFG['בוטלה']
            const tc       = TYPE_CFG[job.job_type ?? ''] ?? DEFAULT_TYPE
            const apps     = (job as { appCount?: number }).appCount ?? 0
            const newApps  = (job as { newAppCount?: number }).newAppCount ?? 0
            const itc      = instType ? (INST_TYPE_CFG[instType] ?? { bg: '#F3F4F6', color: '#6B7280' }) : null

            return (
              <div
                key={job.id}
                className="rounded-[16px] border overflow-hidden cursor-pointer flex flex-col"
                style={{
                  background: 'linear-gradient(160deg, #F8F5FF 0%, #FDFCFF 100%)',
                  borderColor: 'var(--line)',
                  boxShadow: '0 2px 8px rgba(75,46,131,.08)',
                  transition: 'box-shadow 200ms, transform 200ms, border-color 200ms',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 10px 28px rgba(75,46,131,.15)'
                  el.style.borderColor = 'var(--purple-200)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 2px 8px rgba(75,46,131,.08)'
                  el.style.borderColor = 'var(--line)'
                }}
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                {/* Brand signature bar */}
                <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${tc.border} 0%, #00A7B5 100%)` }} />

                {/* Body */}
                <div className="px-5 pt-4 pb-4 flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-[15.5px] font-extrabold leading-snug flex-1 min-w-0"
                      style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
                      {job.title}
                    </h3>
                    {job.job_type && (
                      <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full mt-0.5"
                        style={{ background: tc.border, color: '#fff' }}>
                        {job.job_type}
                      </span>
                    )}
                  </div>

                  {/* Institution */}
                  {inst && (
                    <p className="text-[12.5px] font-semibold mb-3" style={{ color: 'var(--ink-3)' }}>{inst}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--ink-4)' }}>
                    {city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />{city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{daysSince(job.created_at)}
                    </span>
                    {itc && instType && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: itc.bg, color: itc.color }}>
                        {instType}
                      </span>
                    )}
                  </div>

                  {/* Date range */}
                  {(job.start_date || (job as any).end_date) && (
                    <div className="mt-3 flex items-center gap-1.5"
                      style={{ color: 'var(--teal-600)' }}>
                      <CalendarDays size={12} />
                      <span className="text-[12px] font-semibold">
                        {job.start_date
                          ? new Date(job.start_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
                          : '—'}
                        {' – '}
                        {(job as any).end_date
                          ? new Date((job as any).end_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between gap-3"
                  style={{ borderTop: '1px solid var(--line-soft)', background: 'rgba(75,46,131,.04)' }}>
                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.dot }} />
                    <span className="text-[12px] font-semibold" style={{ color: sc.color }}>{job.status}</span>
                  </div>

                  {/* Right: counts + action */}
                  <div className="flex items-center gap-3">
                    {newApps > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
                        +{newApps} חדשות
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--ink-4)' }}>
                      <Users size={12} />{apps}
                    </span>
                    <button
                      className="flex items-center gap-1 h-8 px-3 rounded-[8px] text-[12px] font-bold border transition-all"
                      style={{ borderColor: 'var(--line)', color: 'var(--purple)', background: 'var(--purple-050)' }}
                      onClick={e => { e.stopPropagation(); router.push(`/jobs/${job.id}`) }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-100)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--purple-050)' }}
                    >
                      פרטים <ChevronLeft size={12} />
                    </button>
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
