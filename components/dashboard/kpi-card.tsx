'use client'

import { Users, Briefcase, Heart, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiData {
  id: string
  label: string
  value: number
  unit?: string
  ring?: number
  delta: { value: number; dir: 'up' | 'down' | 'flat'; unit?: string; label: string }
  variant: 'purple' | 'soft' | 'teal' | 'amber'
  icon: 'users' | 'briefcase' | 'heart' | 'clock'
}

const ICONS = { users: Users, briefcase: Briefcase, heart: Heart, clock: Clock }

const VARIANT_CFG: Record<string, {
  iconBg: string; iconColor: string
  ringStroke: string; ringTrack: string
  cardTint: string
}> = {
  purple: {
    iconBg: 'var(--purple-050)',
    iconColor: 'var(--purple)',
    ringStroke: '#5B3E9E',
    ringTrack: '#EDE9FE',
    cardTint: 'radial-gradient(ellipse 90% 60% at 5% 105%, rgba(75,46,131,.05) 0%, transparent 55%)',
  },
  soft: {
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    ringStroke: '#7C3AED',
    ringTrack: '#EDE9FE',
    cardTint: 'radial-gradient(ellipse 90% 60% at 5% 105%, rgba(124,58,237,.04) 0%, transparent 55%)',
  },
  teal: {
    iconBg: 'var(--teal-050)',
    iconColor: 'var(--teal-600)',
    ringStroke: '#00A7B5',
    ringTrack: 'var(--teal-050)',
    cardTint: 'radial-gradient(ellipse 90% 60% at 5% 105%, rgba(0,167,181,.04) 0%, transparent 55%)',
  },
  amber: {
    iconBg: 'var(--amber-bg)',
    iconColor: 'var(--amber)',
    ringStroke: '#C27819',
    ringTrack: '#FEF3C7',
    cardTint: 'radial-gradient(ellipse 90% 60% at 5% 105%, rgba(194,120,25,.04) 0%, transparent 55%)',
  },
}

const RING_R = 22
const CIRC   = 2 * Math.PI * RING_R   // ≈ 138.2

export default function KpiCard({ kpi }: { kpi: KpiData }) {
  const Icon   = ICONS[kpi.icon]
  const cfg    = VARIANT_CFG[kpi.variant]
  const isUp   = kpi.delta.dir === 'up'
  const isDn   = kpi.delta.dir === 'down'
  const ring   = Math.min(99, Math.max(0, kpi.ring ?? 0))
  const offset = CIRC - (ring / 100) * CIRC

  return (
    <article
      className="relative overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(75,46,131,.07)',
        padding: '20px 20px 18px',
        border: '1px solid var(--line)',
        transition: 'box-shadow 200ms, transform 200ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 4px 20px rgba(75,46,131,.16), 0 2px 8px rgba(0,0,0,.06)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(75,46,131,.07)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Brand top bar */}
      <div className="absolute top-0 inset-x-0 rounded-t-[16px]"
        style={{ height: '3px', background: 'linear-gradient(90deg, #4B2E83 0%, #00A7B5 100%)' }} />

      {/* Corner tint */}
      <div className="absolute inset-0 pointer-events-none rounded-[16px]"
        style={{ background: cfg.cardTint }} />

      <div className="relative flex flex-col gap-3 mt-0.5">
        {/* Icon + label */}
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: cfg.iconBg, color: cfg.iconColor }}>
            <Icon size={18} strokeWidth={2} />
          </span>
          <span className="text-[11.5px] font-semibold uppercase tracking-[.07em]" style={{ color: 'var(--ink-3)' }}>
            {kpi.label}
          </span>
        </div>

        {/* Value + donut ring */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[38px] font-extrabold leading-none"
              style={{ color: 'var(--ink)', letterSpacing: '-.03em' }}>
              {kpi.value.toLocaleString('he-IL')}
              {kpi.unit && (
                <span className="text-[15px] font-semibold ms-1.5" style={{ color: 'var(--ink-4)' }}>
                  {kpi.unit}
                </span>
              )}
            </div>

            {/* Delta */}
            <div className="flex items-center gap-1.5 mt-2 text-[12px] font-semibold"
              style={{ color: kpi.delta.dir === 'flat' ? 'var(--ink-4)' : isUp ? 'var(--green)' : 'var(--red)' }}>
              {isUp  && <TrendingUp   size={12} strokeWidth={2.5} />}
              {isDn  && <TrendingDown size={12} strokeWidth={2.5} />}
              {kpi.delta.dir === 'flat' && <Minus size={12} strokeWidth={2.5} />}
              {kpi.delta.dir !== 'flat' && (
                <span className="font-bold">{kpi.delta.value}{kpi.delta.unit ?? ''}</span>
              )}
              <span className="font-medium" style={{ color: 'var(--ink-4)' }}>{kpi.delta.label}</span>
            </div>
          </div>

          {/* Donut progress ring */}
          {ring > 0 && (
            <svg width="62" height="62" viewBox="0 0 60 60" aria-hidden className="shrink-0 mb-0.5">
              <circle cx="30" cy="30" r={RING_R}
                fill="none" stroke={cfg.ringTrack} strokeWidth="5" />
              <circle cx="30" cy="30" r={RING_R}
                fill="none" stroke={cfg.ringStroke} strokeWidth="5"
                strokeDasharray={String(CIRC)}
                strokeDashoffset={String(offset)}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
                style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1)' }}
              />
              <text x="30" y="35" textAnchor="middle"
                fontSize="11" fontWeight="800" fill={cfg.ringStroke}
                style={{ fontFamily: 'inherit' }}>
                {ring}%
              </text>
            </svg>
          )}
        </div>
      </div>
    </article>
  )
}
