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
          <h3 className="text-[16.5px] font-bold" style={{ color: 'var(--ink)' }}>משפך תהליך השמה</h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>שנת {yearLabel}</p>
        </div>
        <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-semibold transition-all"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
          <SlidersHorizontal size={14} />
          צפייה בפרוט
        </button>
      </div>

      <div className="px-5 pb-4">
        {/* Funnel stages */}
        <div className="flex flex-col gap-2.5 mt-1.5">
          {(data?.stages ?? []).map(stage => (
            <div key={stage.label} className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr 1.2fr 44px' }}>
              <div className="flex justify-between gap-2">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{stage.label}</span>
                <span className="text-[13px] font-medium" style={{ color: 'var(--ink-3)' }}>{stage.count}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)' }}>
                <span
                  className="block h-full rounded-full transition-all duration-700"
                  style={{ width: `${stage.pct}%`, background: stage.color }}
                />
              </div>
              <span className="text-[13px] font-bold text-start" style={{ color: 'var(--ink-3)' }}>
                {stage.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-2.5 mt-4.5 pt-4" style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
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
