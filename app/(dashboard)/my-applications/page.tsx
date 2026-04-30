'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Briefcase, MapPin, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import WithdrawButton from './withdraw-button'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'ממתינה':  <Clock size={14} />,
  'נצפתה':   <Eye size={14} />,
  'התקבלה':  <CheckCircle size={14} />,
  'נדחתה':   <XCircle size={14} />,
  'בוטלה':   <XCircle size={14} />,
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'ממתינה':  { bg: '#EDE9FE', color: '#5B3E9E' },
  'נצפתה':   { bg: '#E0F2FE', color: '#0369A1' },
  'התקבלה':  { bg: '#E4F6ED', color: '#1A7A4A' },
  'נדחתה':   { bg: '#FEE2E2', color: '#B91C1C' },
  'בוטלה':   { bg: '#F4F4F5', color: '#71717A' },
}

type AppItem = {
  id: string
  status: string
  applied_at: string
  cover_letter: string | null
  jobs?: { title: string; city: string | null; job_type: string | null; institutions?: { institution_name: string } } | null
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/applications/mine')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setApplications(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function remove(id: string) {
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  const pending = applications.filter(a => a.status === 'ממתינה').length

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl">
        <div className="h-8 w-40 rounded-lg mb-2" style={{ background: 'var(--bg-2)' }} />
        <div className="space-y-3 mt-6">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-[16px] border h-20 animate-pulse" style={{ background: 'var(--bg-2)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">הגשות שלי</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{applications.length} הגשות · {pending} ממתינות לתגובה</p>
        </div>
        <Link href="/jobs" className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white"
          style={{ background: 'var(--purple)' }}>
          <Briefcase size={15} />עיון במשרות
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Briefcase size={40} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>עדיין לא הגשת מועמדויות</p>
          <Link href="/jobs" className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>
            חפשי משרות מתאימות →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const job = app.jobs as { title: string; city: string | null; job_type: string | null; institutions?: { institution_name: string } } | null
            const ss = STATUS_STYLE[app.status] ?? { bg: '#F4F4F5', color: '#71717A' }
            const canWithdraw = ['ממתינה', 'נצפתה'].includes(app.status)
            return (
              <div key={app.id}
                className="rounded-[16px] border flex items-center gap-4 p-5"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                  <Briefcase size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate" style={{ color: 'var(--ink)' }}>
                    {job?.title ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[12px] flex-wrap" style={{ color: 'var(--ink-3)' }}>
                    {job?.institutions?.institution_name && (
                      <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
                        {job.institutions.institution_name}
                      </span>
                    )}
                    {job?.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{job.city}</span>}
                    {job?.job_type && <span>{job.job_type}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {canWithdraw && (
                    <WithdrawButton applicationId={app.id} onWithdrawn={() => remove(app.id)} />
                  )}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                      style={ss}>
                      {STATUS_ICONS[app.status]}
                      {app.status}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                      {formatDate(app.applied_at)}
                    </span>
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
