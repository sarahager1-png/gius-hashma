'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Area, AreaChart,
} from 'recharts'
import { MoreVertical } from 'lucide-react'

const RANGES = [
  { label: '30 יום', value: '30d' },
  { label: '90 יום', value: '90d' },
  { label: '6 חודשים', value: '6m' },
  { label: 'שנה', value: 'year' },
] as const

type Range = typeof RANGES[number]['value']

interface TrendPoint { month: string; candidates: number; jobs: number; placements: number }
interface TrendsData { range: string; data: TrendPoint[]; totals: { candidates: number; jobs: number; placements: number } }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[10px] border py-3 px-4 text-sm" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-md)', fontFamily: 'Heebo, sans-serif' }}>
      <div className="font-bold mb-2" style={{ color: 'var(--ink)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-sm" style={{ background: p.color }} />
          <span style={{ color: 'var(--ink-2)' }}>{p.name}: <b>{p.value}</b></span>
        </div>
      ))}
    </div>
  )
}

interface Props { since: string; until: string }

export default function TrendsChart({ since, until }: Props) {
  const [range, setRange] = useState<Range>('6m')

  const { data } = useQuery<TrendsData>({
    queryKey: ['trends', since, until, range],
    queryFn: () => fetch(`/api/dashboard/trends?since=${since}&until=${until}&range=${range}`).then(r => r.json()),
  })

  return (
    <div className="rounded-[14px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-[18px]" style={{ paddingBottom: 14 }}>
        <div className="flex-1">
          <h3 className="text-[16.5px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-.005em' }}>
            מגמות 6 חודשים
          </h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>
            מועמדות · משרות · שיבוצים
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Segmented control */}
          <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }} role="tablist">
            {RANGES.map(r => (
              <button
                key={r.value}
                role="tab"
                aria-selected={range === r.value}
                onClick={() => setRange(r.value)}
                className="px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
                style={range === r.value
                  ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
                  : { background: 'transparent', color: 'var(--ink-3)' }
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all" style={{ color: 'var(--ink-3)' }} aria-label="אפשרויות">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-[18px] px-5 pb-2 flex-wrap">
        <LegendItem color="var(--purple)" label="מועמדות חדשות" count={data?.totals.candidates} />
        <LegendItem color="var(--teal)"   label="משרות חדשות"   count={data?.totals.jobs} />
        <LegendItem color="#9A80D1"       label="שיבוצים שהושלמו" count={data?.totals.placements} />
      </div>

      {/* Chart */}
      <div className="px-2 pt-2 pb-1" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.data ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#5B3E9E" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#5B3E9E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="var(--line-soft)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontFamily: 'Heebo', fontSize: 12, fill: 'var(--ink-4)', fontWeight: 500 }}
              axisLine={false} tickLine={false}
              reversed  /* RTL: months flow right-to-left */
            />
            <YAxis
              tick={{ fontFamily: 'Heebo', fontSize: 12, fill: 'var(--ink-4)', fontWeight: 500 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="candidates" name="מועמדות חדשות"
              stroke="#5B3E9E" strokeWidth={3}
              fill="url(#gradPurple)"
              dot={{ r: 4, fill: '#fff', stroke: '#5B3E9E', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#5B3E9E', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone" dataKey="jobs" name="משרות חדשות"
              stroke="var(--teal)" strokeWidth={3}
              dot={{ r: 4, fill: '#fff', stroke: 'var(--teal)', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone" dataKey="placements" name="שיבוצים"
              stroke="#9A80D1" strokeWidth={3}
              dot={{ r: 4, fill: '#fff', stroke: '#9A80D1', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LegendItem({ color, label, count }: { color: string; label: string; count?: number }) {
  return (
    <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>
      <span className="w-3.5 h-3.5 rounded-[4px]" style={{ background: color }} />
      {label}
      {count != null && <span className="font-medium" style={{ color: 'var(--ink-4)' }}>· {count}</span>}
    </span>
  )
}
