'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Users, Check, AlertTriangle, ListChecks } from 'lucide-react'

interface Job {
  id: string
  title: string
  city: string | null
  institutionName: string
  district: string | null
  daysOpen: number
  daysQuiet: number
  apps: number
  pending: number
}

type Filter = 'stale' | 'veryStale' | 'noApps' | 'all'
type Action = 'אוישה' | 'בוטלה'

function staleStyle(days: number): { bg: string; color: string; hint: string } {
  if (days >= 45) return { bg: 'var(--red-bg)', color: 'var(--red)', hint: 'כנראה כבר אוישה' }
  if (days >= 30) return { bg: '#FDF3E3', color: '#D97706', hint: 'פתוחה זמן רב' }
  if (days >= 21) return { bg: '#FDF3E3', color: '#D97706', hint: '' }
  return { bg: 'var(--bg-2)', color: 'var(--ink-3)', hint: '' }
}

export default function StaleJobsClient({ jobs: initial }: { jobs: Job[] }) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initial)
  const [filter, setFilter] = useState<Filter>('stale')
  const [confirm, setConfirm] = useState<{ id: string; action: Action } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const staleCount = jobs.filter(j => j.daysOpen >= 30).length
  const veryStaleCount = jobs.filter(j => j.daysOpen >= 45).length
  const noAppsCount = jobs.filter(j => j.apps === 0).length

  const shown = jobs.filter(j => {
    if (filter === 'all') return true
    if (filter === 'stale') return j.daysOpen >= 30
    if (filter === 'veryStale') return j.daysOpen >= 45
    if (filter === 'noApps') return j.apps === 0
    return true
  })

  async function apply(id: string, action: Action) {
    setBusy(id)
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    })
    setBusy(null)
    setConfirm(null)
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== id))
      setToast(action === 'אוישה' ? 'המשרה סומנה כאוישה ✓' : 'המשרה בוטלה ✓')
      setTimeout(() => setToast(null), 3000)
      router.refresh()
    } else {
      setToast('שגיאה — נסי שוב')
      setTimeout(() => setToast(null), 3000)
    }
  }

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'stale', label: 'פתוחות 30+ ימים', count: staleCount },
    { key: 'veryStale', label: 'פתוחות 45+ ימים', count: veryStaleCount },
    { key: 'noApps', label: 'ללא הגשות', count: noAppsCount },
    { key: 'all', label: 'כל הפתוחות', count: jobs.length },
  ]

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-[12px] text-[13.5px] font-bold shadow-lg"
          style={{ background: 'var(--ink)', color: '#fff' }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-2">
        <h1 className="page-title flex items-center gap-2">
          <ListChecks size={22} style={{ color: 'var(--purple)' }} />
          בדיקת משרות פתוחות
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>
          משרות שעדיין מסומנות פתוחות במערכת. אם משרה כבר אוישה בשטח או ירדה — סמני אותה כאן,
          וההגשות הפתוחות ייסגרו והמועמדות יקבלו הודעה מסודרת.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 my-6">
        <div className="rounded-[16px] border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="text-[26px] md:text-[30px] font-extrabold leading-none mb-1" style={{ color: 'var(--purple)' }}>{jobs.length}</div>
          <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>משרות פתוחות</div>
        </div>
        <div className="rounded-[16px] border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="text-[26px] md:text-[30px] font-extrabold leading-none mb-1" style={{ color: '#D97706' }}>{staleCount}</div>
          <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>פתוחות 30+ ימים</div>
        </div>
        <div className="rounded-[16px] border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="text-[26px] md:text-[30px] font-extrabold leading-none mb-1" style={{ color: 'var(--red)' }}>{veryStaleCount}</div>
          <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>פתוחות 45+ ימים</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-bold border transition-all"
              style={{
                background: active ? 'var(--purple)' : '#fff',
                color: active ? '#fff' : 'var(--ink-3)',
                borderColor: active ? 'var(--purple)' : 'var(--line)',
              }}
            >
              {f.label} · {f.count}
            </button>
          )
        })}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div className="rounded-[16px] border p-14 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Check size={30} className="mx-auto mb-3" style={{ color: 'var(--teal)' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-3)' }}>אין משרות בקטגוריה הזו ✓</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(job => {
            const st = staleStyle(job.daysOpen)
            const isConfirming = confirm?.id === job.id
            const isBusy = busy === job.id
            return (
              <div
                key={job.id}
                className="rounded-[16px] border overflow-hidden"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Briefcase size={15} style={{ color: 'var(--purple)' }} />
                        <h2 className="text-[15px] font-bold truncate" style={{ color: 'var(--ink)' }}>{job.title}</h2>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[12.5px] flex-wrap" style={{ color: 'var(--ink-3)' }}>
                        <span className="font-semibold">{job.institutionName}</span>
                        {job.city && (
                          <span className="flex items-center gap-0.5"><MapPin size={12} />{job.city}</span>
                        )}
                        {job.district && (
                          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>{job.district}</span>
                        )}
                      </div>
                    </div>

                    {/* staleness badge */}
                    <div className="text-end shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[12px] font-bold" style={{ background: st.bg, color: st.color }}>
                        פתוחה {job.daysOpen} ימים
                      </span>
                      {st.hint && (
                        <div className="text-[11px] mt-1 font-semibold" style={{ color: st.color }}>{st.hint}</div>
                      )}
                    </div>
                  </div>

                  {/* applications summary */}
                  <div className="flex items-center gap-1.5 mt-3 text-[12.5px]" style={{ color: 'var(--ink-4)' }}>
                    <Users size={13} />
                    {job.apps === 0
                      ? <span>לא התקבלו הגשות</span>
                      : <span>{job.apps} הגשות{job.pending > 0 ? ` · ${job.pending} ממתינות למענה` : ''}</span>}
                  </div>
                </div>

                {/* footer: actions or inline confirm */}
                <div className="px-4 md:px-5 py-3" style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--bg-3)' }}>
                  {isConfirming ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>
                        <AlertTriangle size={14} style={{ color: '#D97706' }} />
                        {confirm!.action === 'אוישה' ? 'לסמן שהמשרה אוישה?' : 'לבטל את המשרה?'}
                        {job.pending > 0 && <span style={{ color: 'var(--ink-4)' }}> {job.pending} מועמדות יקבלו הודעה שהמשרה נסגרה.</span>}
                      </span>
                      <div className="flex gap-2 ms-auto">
                        <button
                          onClick={() => apply(job.id, confirm!.action)}
                          disabled={isBusy}
                          className="px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-bold text-white disabled:opacity-60"
                          style={{ background: confirm!.action === 'אוישה' ? 'var(--teal)' : 'var(--red)' }}
                        >
                          {isBusy ? 'סוגר…' : 'כן, סגור'}
                        </button>
                        <button
                          onClick={() => setConfirm(null)}
                          disabled={isBusy}
                          className="px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-bold border"
                          style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setConfirm({ id: job.id, action: 'אוישה' })}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-bold border transition-all"
                        style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: '#fff' }}
                      >
                        <Check size={14} /> אוישה — נמצאה מועמדת
                      </button>
                      <button
                        onClick={() => setConfirm({ id: job.id, action: 'בוטלה' })}
                        className="px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-semibold border transition-all"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink-4)', background: '#fff' }}
                      >
                        המשרה ירדה
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
