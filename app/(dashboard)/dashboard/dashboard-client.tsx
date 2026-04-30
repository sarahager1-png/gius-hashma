'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import KpiCard from '@/components/dashboard/kpi-card'
import TrendsChart from '@/components/dashboard/trends-chart'
import QuickActions from '@/components/dashboard/quick-actions'
import AttentionTable from '@/components/dashboard/attention-table'
import ActivityFeed from '@/components/dashboard/activity-feed'
import Funnel from '@/components/dashboard/funnel'
import ProcessTracker from '@/components/dashboard/process-tracker'
import AdminAlerts from '@/components/dashboard/admin-alerts'
import ChabadQuote from '@/components/dashboard/chabad-quote'
import { Download, Plus, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ACADEMIC_YEARS = [
  { label: 'תשפ"ד', since: '2023-09-01', until: '2024-08-31' },
  { label: 'תשפ"ה', since: '2024-09-01', until: '2025-08-31' },
  { label: 'תשפ"ו', since: '2025-09-01', until: '2026-08-31' },
  { label: 'תשפ"ז', since: '2026-09-01', until: '2027-08-31' },
  { label: 'תשפ"ח', since: '2027-09-01', until: '2028-08-31' },
]

interface KpiData {
  id: string; label: string; value: number; unit?: string
  delta: { value: number; dir: 'up' | 'down' | 'flat'; unit?: string; label: string }
  variant: 'purple' | 'soft' | 'teal' | 'amber'
  icon: 'users' | 'briefcase' | 'heart' | 'clock'
}

interface Props {
  fullName: string | null
}

export default function DashboardClient({ fullName }: Props) {
  const router = useRouter()
  const [yearIdx, setYearIdx] = useState(ACADEMIC_YEARS.length - 1)
  const year = ACADEMIC_YEARS[yearIdx]

  const { data: kpis = [] } = useQuery<KpiData[]>({
    queryKey: ['kpis', year.since, year.until],
    queryFn: () => fetch(`/api/dashboard/kpis?since=${year.since}&until=${year.until}`).then(r => r.json()),
  })

  const firstName = fullName?.split(' ')[0] ?? ''

  return (
    <div className="p-4 md:p-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[.1em] mb-1.5 hidden sm:block" style={{ color: 'var(--purple)' }}>
            לוח בקרה
          </p>
          <h1 className="text-[28px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.03em' }}>
            שלום, {firstName}
          </h1>
          <span className="brand-line hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 mt-2">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink-3)' }}>
              מחברים בין אנשי חינוך למקומות של שליחות
            </p>
            <span style={{ color: 'var(--line)' }}>·</span>
            <p className="text-[12px] font-medium" style={{ color: 'var(--ink-4)' }}>
              <LiveDate />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <div className="relative">
            <select
              value={yearIdx}
              onChange={e => setYearIdx(Number(e.target.value))}
              className="appearance-none inline-flex items-center gap-2 pe-8 ps-3 h-9 rounded-full border text-[13px] font-semibold cursor-pointer outline-none transition-all"
              style={{ background: '#fff', borderColor: 'var(--purple-200)', color: 'var(--purple)' }}
            >
              {ACADEMIC_YEARS.map((y, i) => (
                <option key={y.label} value={i}>שנת {y.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-2.5" style={{ color: 'var(--purple)' }} />
          </div>
          <button
            className="hidden md:flex items-center gap-2 h-10 px-4 rounded-[10px] border text-[14px] font-semibold transition-all"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.color = 'var(--purple)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)' }}
          >
            <Download size={16} />
            ייצוא
          </button>
          <button
            onClick={() => router.push('/admin/jobs/new')}
            className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--purple-600) 100%)', boxShadow: '0 3px 12px rgba(75,46,131,.32)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={16} />
            משרה חדשה
          </button>
        </div>
      </div>

      {/* Admin alerts */}
      <AdminAlerts />

      {/* ציטוט יומי */}
      <ChabadQuote />

      {/* KPI row */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6"
        aria-label="מדדי ביצועים"
      >
        {kpis.map(kpi => <KpiCard key={kpi.id} kpi={kpi} />)}
      </section>

      {/* Chart + Quick actions */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-5 md:mb-6">
        <TrendsChart since={year.since} until={year.until} />
        <QuickActions />
      </section>

      {/* Attention table */}
      <AttentionTable />

      {/* Live process tracker */}
      <ProcessTracker />

      {/* Activity + Funnel */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed since={year.since} until={year.until} />
        <Funnel since={year.since} until={year.until} yearLabel={year.label} />
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between mt-6 pt-4 text-[12.5px] font-medium flex-wrap gap-2" style={{ color: 'var(--ink-4)' }}>
        <div>
          רשת אהלי יוסף יצחק לובאוויטש
          <span className="mx-2.5 hidden sm:inline" style={{ color: 'var(--line)' }}>·</span>
          <a href="#" className="hidden sm:inline transition-all" style={{ color: 'var(--ink-3)', textDecoration: 'none', borderBottom: '1px dashed transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--purple)'; e.currentTarget.style.borderColor = 'var(--purple-200)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.borderColor = 'transparent' }}
          >תנאי שימוש</a>
        </div>
        <div>גרסה 1.0</div>
      </footer>
    </div>
  )
}

const HEBREW_YEAR_MAP: Record<number, string> = {
  5784: 'תשפ"ד', 5785: 'תשפ"ה', 5786: 'תשפ"ו', 5787: 'תשפ"ז', 5788: 'תשפ"ח',
}

const HEB_DAY: Record<number, string> = {
  1:'א׳', 2:'ב׳', 3:'ג׳', 4:'ד׳', 5:'ה׳', 6:'ו׳', 7:'ז׳', 8:'ח׳', 9:'ט׳',
  10:'י׳', 11:'י"א', 12:'י"ב', 13:'י"ג', 14:'י"ד', 15:'ט"ו', 16:'ט"ז',
  17:'י"ז', 18:'י"ח', 19:'י"ט', 20:'כ׳', 21:'כ"א', 22:'כ"ב', 23:'כ"ג',
  24:'כ"ד', 25:'כ"ה', 26:'כ"ו', 27:'כ"ז', 28:'כ"ח', 29:'כ"ט', 30:'ל׳',
}

function LiveDate() {
  const now = new Date()
  const greg = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  let heb = ''
  try {
    let raw = now.toLocaleDateString('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
    // Replace Arabic numeral day with Hebrew letters (e.g. "12" → "י"ב")
    raw = raw.replace(/^\d+/, m => HEB_DAY[Number(m)] ?? m)
    // Replace 4-digit Gregorian year with Hebrew year label
    const yearMatch = raw.match(/(\d{4})/)
    if (yearMatch) {
      const label = HEBREW_YEAR_MAP[Number(yearMatch[1])]
      if (label) raw = raw.replace(yearMatch[1], label)
    }
    heb = raw
  } catch { /* browser may not support */ }
  return <>{greg}{heb ? ` · ${heb}` : ''}</>
}
