'use client'

import { Users, Briefcase, Heart, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiData {
  id: string
  label: string
  value: number
  unit?: string
  delta: { value: number; dir: 'up' | 'down' | 'flat'; unit?: string; label: string }
  variant: 'purple' | 'soft' | 'teal' | 'amber'
  icon: 'users' | 'briefcase' | 'heart' | 'clock'
}

const ICONS = { users: Users, briefcase: Briefcase, heart: Heart, clock: Clock }

const VARIANT_CFG: Record<string, {
  iconBg: string; iconColor: string; valueColor: string
  topGrad: string; sparkColor: string; glowColor: string
  cardTint: string
}> = {
  purple: {
    iconBg: 'linear-gradient(135deg, var(--purple-050) 0%, var(--purple-100) 100%)',
    iconColor: 'var(--purple)',
    valueColor: 'var(--purple)',
    topGrad: 'linear-gradient(90deg, var(--purple) 0%, var(--purple-200) 100%)',
    sparkColor: 'var(--purple)',
    glowColor: 'rgba(75,46,131,.08)',
    cardTint: 'radial-gradient(ellipse 100% 70% at 95% 0%, rgba(75,46,131,.07) 0%, transparent 55%)',
  },
  soft: {
    iconBg: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
    iconColor: '#7C3AED',
    valueColor: '#6D28D9',
    topGrad: 'linear-gradient(90deg, #7C3AED 0%, #C4B5FD 100%)',
    sparkColor: '#7C3AED',
    glowColor: 'rgba(124,58,237,.07)',
    cardTint: 'radial-gradient(ellipse 100% 70% at 95% 0%, rgba(124,58,237,.07) 0%, transparent 55%)',
  },
  teal: {
    iconBg: 'linear-gradient(135deg, var(--teal-050) 0%, var(--teal-100) 100%)',
    iconColor: 'var(--teal-600)',
    valueColor: 'var(--teal-700)',
    topGrad: 'linear-gradient(90deg, var(--teal) 0%, var(--teal-100) 100%)',
    sparkColor: 'var(--teal)',
    glowColor: 'rgba(0,167,181,.07)',
    cardTint: 'radial-gradient(ellipse 100% 70% at 95% 0%, rgba(0,167,181,.08) 0%, transparent 55%)',
  },
  amber: {
    iconBg: 'linear-gradient(135deg, var(--amber-bg) 0%, #FDE68A 100%)',
    iconColor: 'var(--amber)',
    valueColor: '#92400E',
    topGrad: 'linear-gradient(90deg, var(--amber) 0%, #FDE68A 100%)',
    sparkColor: 'var(--amber)',
    glowColor: 'rgba(194,120,25,.07)',
    cardTint: 'radial-gradient(ellipse 100% 70% at 95% 0%, rgba(194,120,25,.07) 0%, transparent 55%)',
  },
}

export default function KpiCard({ kpi }: { kpi: KpiData }) {
  const Icon = ICONS[kpi.icon]
  const cfg  = VARIANT_CFG[kpi.variant]
  const isUp = kpi.delta.dir === 'up'
  const isDn = kpi.delta.dir === 'down'

  return (
    <article
      className="relative overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(145deg, #FDFCFF 0%, #FAF8FE 100%)',
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(75,46,131,.10), 0 1px 3px rgba(75,46,131,.07)',
        padding: '22px 22px 16px',
        border: '1px solid var(--line)',
        transition: 'box-shadow 240ms, transform 240ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 16px 40px rgba(75,46,131,.20), 0 4px 12px rgba(75,46,131,.12)'
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 2px 12px rgba(75,46,131,.10), 0 1px 3px rgba(75,46,131,.07)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Signature brand bar — purple→teal, 5px */}
      <div
        className="absolute top-0 inset-x-0 rounded-t-[20px]"
        style={{ height: '5px', background: 'linear-gradient(90deg, #4B2E83 0%, #00A7B5 100%)' }}
      />

      {/* Colored corner glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[20px]"
        style={{ background: cfg.cardTint }}
      />

      <div className="relative flex justify-between items-start mb-5 mt-1">
        <span className="text-[12.5px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--ink-3)' }}>
          {kpi.label}
        </span>
        <span
          className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
          style={{ background: cfg.iconBg, color: cfg.iconColor, boxShadow: `0 2px 8px ${cfg.glowColor}` }}
        >
          <Icon size={21} strokeWidth={2} />
        </span>
      </div>

      <div
        className="relative text-[50px] font-black leading-none mb-2"
        style={{ color: cfg.valueColor, letterSpacing: '-.05em' }}
      >
        {kpi.value.toLocaleString('he-IL')}
        {kpi.unit && (
          <span className="text-[16px] font-semibold ms-1.5" style={{ color: 'var(--ink-4)' }}>
            {kpi.unit}
          </span>
        )}
      </div>

      <div
        className="relative flex items-center gap-1.5 text-[12.5px] font-semibold"
        style={{ color: kpi.delta.dir === 'flat' ? 'var(--ink-4)' : isUp ? 'var(--green)' : 'var(--red)' }}
      >
        {isUp && <TrendingUp size={13} strokeWidth={2.5} />}
        {isDn && <TrendingDown size={13} strokeWidth={2.5} />}
        {kpi.delta.dir === 'flat' && <Minus size={13} strokeWidth={2.5} />}
        {kpi.delta.dir !== 'flat' && (
          <span className="font-bold">{kpi.delta.value}{kpi.delta.unit ?? ''}</span>
        )}
        <span className="font-medium" style={{ color: 'var(--ink-4)' }}>{kpi.delta.label}</span>
      </div>

      {/* Sparkline */}
      <svg
        viewBox="0 0 200 44"
        className="absolute bottom-0 inset-x-0 w-full pointer-events-none"
        style={{ height: 44, opacity: .28 }}
        preserveAspectRatio="none"
        aria-hidden
      >
        {kpi.id === 'candidates' && (
          <path d="M0,34 L30,28 60,30 90,20 120,22 150,12 180,8 200,4"
            fill="none" stroke={cfg.sparkColor} strokeWidth="3" strokeLinecap="round" />
        )}
        {kpi.id === 'jobs' && (
          <path d="M0,22 L30,20 60,24 90,20 120,22 150,20 180,22 200,20"
            fill="none" stroke={cfg.sparkColor} strokeWidth="3" strokeLinecap="round" />
        )}
        {kpi.id === 'placements' && (
          <path d="M0,36 L30,32 60,28 90,30 120,22 150,16 180,10 200,6"
            fill="none" stroke={cfg.sparkColor} strokeWidth="3" strokeLinecap="round" />
        )}
        {kpi.id === 'avg_time' && (
          <path d="M0,8 L30,12 60,10 90,18 120,16 150,24 180,30 200,36"
            fill="none" stroke={cfg.sparkColor} strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    </article>
  )
}
