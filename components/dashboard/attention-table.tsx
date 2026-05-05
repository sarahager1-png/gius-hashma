'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Send, Edit2, ChevronLeft } from 'lucide-react'

type StatusFilter = 'הכל' | 'קריטי' | 'דחוף' | 'בתהליך'

interface Institution {
  id: number
  name: string
  principal: string
  city: string
  initials: string
  color: 'red' | 'amber' | 'teal' | 'soft'
  pendingCandidates: number
  daysWaiting: number
  status: string
}

const CHIP: Record<string, React.CSSProperties> = {
  קריטי:   { background: 'var(--red-bg)',  color: '#B23434' },
  דחוף:    { background: '#FBEFD7',         color: '#8A5A12' },
  בתהליך: { background: 'var(--bg-2)',     color: 'var(--ink-3)' },
}

const MONOGRAM: Record<string, React.CSSProperties> = {
  red:   { background: 'var(--red-bg)',   color: 'var(--red)'   },
  amber: { background: '#FDF3E3',          color: 'var(--amber)' },
  teal:  { background: 'var(--teal-050)', color: 'var(--teal-600)' },
  soft:  { background: 'var(--purple-050)', color: 'var(--purple)' },
}

const DAYS_COLOR: Record<string, string> = {
  קריטי: 'var(--red)',
  דחוף:  'var(--amber)',
}

export default function AttentionTable() {
  const [filter, setFilter] = useState<StatusFilter>('הכל')
  const router = useRouter()

  const { data: rawData } = useQuery<Institution[]>({
    queryKey: ['attention'],
    queryFn: () => fetch('/api/institutions/attention').then(r => r.json()),
  })
  const data = Array.isArray(rawData) ? rawData : []

  const filtered = filter === 'הכל' ? data : data.filter(i => i.status === filter)
  const shown    = filtered.slice(0, 6)

  return (
    <section className="rounded-[14px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3.5" style={{ paddingTop: 18 }}>
        <div className="flex-1 min-w-0">
          <h3 className="flex items-center gap-2.5 text-[15.5px] font-semibold" style={{ color: 'var(--ink)' }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
              <AlertTriangle size={16} strokeWidth={2.2} />
            </span>
            מוסדות הדורשים התייחסות
          </h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)', marginInlineStart: 38 }}>
            {data.filter(i => i.status !== 'בתהליך').length} מוסדות עם מועמדות ממתינות מעל 10 ימים
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
            {(['הכל', 'קריטי', 'דחוף', 'בתהליך'] as StatusFilter[]).map(s => (
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
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 14, fontWeight: 500 }}>
          <thead>
            <tr>
              {['מוסד', 'עיר', 'מועמדות ממתינות', 'ימים ממתין', 'סטטוס', 'פעולה'].map(h => (
                <th key={h} className="text-start px-4 py-3 text-[12px] font-bold uppercase tracking-[.06em]"
                  style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--bg-3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((inst) => {
              const isUrgent = inst.status !== 'בתהליך'
              return (
                <tr key={inst.id}
                  style={{ background: isUrgent ? '#FFF7F7' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = isUrgent ? '#FEEFEF' : 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isUrgent ? '#FFF7F7' : 'transparent')}
                >
                  <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-extrabold shrink-0"
                        style={MONOGRAM[inst.color]}>
                        {inst.initials}
                      </div>
                      <div>
                        <div className="font-bold text-[14px]">{inst.name}</div>
                        <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>מנהלת: {inst.principal}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                    {inst.city}
                  </td>
                  <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                    <b>{inst.pendingCandidates}</b>{' '}
                    <span style={{ color: 'var(--ink-3)' }}>מועמדות</span>
                  </td>
                  <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <div className="flex items-center gap-2">
                      <b style={{ color: DAYS_COLOR[inst.status] ?? 'var(--ink)', minWidth: 24 }}>{inst.daysWaiting}</b>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)', maxWidth: 60 }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, inst.daysWaiting / 21 * 100)}%`,
                            background: inst.status === 'קריטי' ? 'var(--red)' : inst.status === 'דחוף' ? 'var(--amber)' : 'var(--teal)',
                          }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-bold"
                      style={CHIP[inst.status] ?? {}}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-end" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    {isUrgent ? (
                      <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold text-white transition-all"
                        style={{ background: 'var(--purple)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-600)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--purple)'}
                        onClick={() => router.push(`/institutions/${inst.id}`)}>
                        <Send size={14} />שלחי התייחסות
                      </button>
                    ) : (
                      <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-semibold transition-all"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}
                        onClick={() => router.push(`/admin/institutions`)}>
                        <Edit2 size={14} />עדכן
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {shown.map((inst) => {
          const isUrgent = inst.status !== 'בתהליך'
          return (
            <div key={inst.id} className="px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--line-soft)', background: isUrgent ? '#FFF7F7' : 'transparent' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-extrabold shrink-0"
                  style={MONOGRAM[inst.color]}>
                  {inst.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[14px]" style={{ color: 'var(--ink)' }}>{inst.name}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={CHIP[inst.status] ?? {}}>
                      <span className="w-1 h-1 rounded-full" style={{ background: 'currentColor' }} />
                      {inst.status}
                    </span>
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                    מנהלת: {inst.principal} · {inst.city}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>
                      <b style={{ color: DAYS_COLOR[inst.status] ?? 'var(--ink)' }}>{inst.pendingCandidates}</b> מועמדות
                    </span>
                    <span className="text-[12px] font-semibold"
                      style={{ color: DAYS_COLOR[inst.status] ?? 'var(--ink-3)' }}>
                      {inst.daysWaiting} ימים המתנה
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {isUrgent ? (
                    <button className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold text-white"
                      style={{ background: 'var(--purple)' }}
                      onClick={() => router.push(`/institutions/${inst.id}`)}>
                      <Send size={13} />התייחסות
                    </button>
                  ) : (
                    <button className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-[12px] font-semibold"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}
                      onClick={() => router.push(`/admin/institutions`)}>
                      <Edit2 size={13} />עדכן
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <span className="text-[13px] font-medium" style={{ color: 'var(--ink-3)' }}>
          מוצג {shown.length} מתוך {filtered.length} מוסדות
        </span>
        <button className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--purple)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-050)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => router.push('/institutions')}
        >
          צפייה בכל
          <ChevronLeft size={14} />
        </button>
      </div>
    </section>
  )
}
