'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react'

interface FunnelStage {
  label: string
  count: number
  pct: number
  color: string
}

interface FunnelData {
  stages: FunnelStage[]
  conversionRate: number
  conversionDelta: { value: number; dir: 'up' | 'down'; label: string }
  avgOfferTime: number
  avgOfferTimeDelta: { value: number; dir: 'up' | 'down'; label: string }
}

interface Props { since: string; until: string; yearLabel: string }

export default function Funnel({ since, until, yearLabel }: Props) {
  const { data } = useQuery<FunnelData>({
    queryKey: ['funnel', since, until],
    queryFn: () => fetch(`/api/funnel?since=${since}&until=${until}`).then(r => r.json()),
  })

  return (
    <div className="rounded-[14px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-3.5" style={{ paddingTop: 18 }}>
        <div className="flex-1">
          <h3 className="text-[15.5px] font-semibold" style={{ color: 'var(--ink)' }}>משפך תהליך השמה</h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>שנת {yearLabel}</p>
        </div>
        <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-semibold transition-all"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
          <SlidersHorizontal size={14} />
          צפייה בפרוט
        </button>
      </div>

      <div className="px-5 pb-5">
        {/* Funnel stages */}
        <div className="flex flex-col gap-1 mt-1">
          {(data?.stages ?? []).map((stage, idx, arr) => {
            const dropPct = idx > 0 ? Math.round((1 - stage.count / arr[idx - 1].count) * 100) : 0
            return (
              <div key={stage.label}>
                {/* Drop indicator between stages */}
                {idx > 0 && dropPct > 0 && (
                  <div className="flex items-center gap-2 py-0.5 px-1">
                    <div className="h-px flex-1" style={{ background: 'var(--line-soft)' }} />
                    <span className="text-[10.5px] font-semibold" style={{ color: 'var(--red)', opacity: 0.7 }}>
                      −{dropPct}%
                    </span>
                    <div className="h-px flex-1" style={{ background: 'var(--line-soft)' }} />
                  </div>
                )}
                <div className="flex items-center gap-3 py-2">
                  {/* Count badge */}
                  <div className="text-[18px] font-black leading-none shrink-0 w-10 text-end"
                    style={{ color: stage.color, letterSpacing: '-.02em' }}>
                    {stage.count}
                  </div>
                  {/* Bar + label */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>{stage.label}</span>
                      <span className="text-[12px] font-bold" style={{ color: stage.color }}>{stage.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)' }}>
                      <span className="block h-full rounded-full transition-all duration-700"
                        style={{ width: `${stage.pct}%`, background: stage.color }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-4" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <MetricMini
            label="שיעור המרה"
            value={`${data?.conversionRate ?? 0}%`}
            delta={data?.conversionDelta}
          />
          <MetricMini
            label="זמן ממוצע להצעה"
            value={data?.avgOfferTime ?? 0}
            unit="ימים"
            delta={data?.avgOfferTimeDelta}
          />
        </div>
      </div>
    </div>
  )
}

function MetricMini({ label, value, unit, delta }: {
  label: string
  value: number | string
  unit?: string
  delta?: { value: number; dir: 'up' | 'down'; label: string }
}) {
  const DeltaIcon = delta?.dir === 'up' ? TrendingUp : TrendingDown
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[.05em]" style={{ color: 'var(--ink-3)' }}>{label}</div>
      <div className="mt-1 text-[22px] font-extrabold leading-none" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
        {value}
        {unit && <span className="text-[14px] font-semibold ms-1" style={{ color: 'var(--ink-4)' }}>{unit}</span>}
      </div>
      {delta && (
        <div className="flex items-center gap-1 mt-1 text-[12px] font-semibold" style={{ color: 'var(--teal-600)' }}>
          <DeltaIcon size={12} strokeWidth={2.5} />
          {delta.value} {delta.label}
        </div>
      )}
    </div>
  )
}
