'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Bell, Building2, CalendarX, Briefcase } from 'lucide-react'

interface Alert {
  type: 'institution_unresponsive' | 'interview_no_response' | 'job_no_applicants'
  id: string
  label: string
  detail: string
  severity: 'critical' | 'warning'
}

const TYPE_CFG = {
  institution_unresponsive: { icon: Building2, label: 'מוסד לא מגיב' },
  interview_no_response:    { icon: CalendarX,  label: 'ראיון ממתין לאישור' },
  job_no_applicants:        { icon: Briefcase,  label: 'משרה ללא מועמדות' },
}

const SEV_CFG = {
  critical: { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', dot: '#EF4444' },
  warning:  { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', dot: '#F59E0B' },
}

export default function AdminAlerts() {
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ['admin-alerts'],
    queryFn: () => fetch('/api/admin/alerts').then(r => r.json()),
    refetchInterval: 5 * 60 * 1000,
  })

  if (isLoading || alerts.length === 0) return null

  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <section className="mb-5 md:mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={16} style={{ color: criticalCount > 0 ? '#EF4444' : '#F59E0B' }} />
        <h2 className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>
          התראות מערכת
        </h2>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: criticalCount > 0 ? '#FEE2E2' : '#FEF3C7',
            color: criticalCount > 0 ? '#B91C1C' : '#92400E',
          }}
        >
          {alerts.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {alerts.map((alert, i) => {
          const sev = SEV_CFG[alert.severity]
          const cfg = TYPE_CFG[alert.type]
          const Icon = cfg.icon
          return (
            <div
              key={`${alert.type}-${alert.id}-${i}`}
              className="flex items-start gap-3 p-4 rounded-[14px] border"
              style={{ background: sev.bg, borderColor: sev.border }}
            >
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#fff', color: sev.color }}
              >
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: sev.dot }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: sev.color }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
                  {alert.label}
                </p>
                <p className="text-[11.5px] mt-0.5" style={{ color: sev.color }}>
                  {alert.detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
