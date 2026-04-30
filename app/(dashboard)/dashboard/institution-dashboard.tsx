'use client'

import Link from 'next/link'
import { Briefcase, Users, Clock, CheckCircle, ArrowLeft, Plus, Bell, MapPin, GraduationCap } from 'lucide-react'
import ChabadQuote from '@/components/dashboard/chabad-quote'

interface Job {
  id: string
  title: string
  city: string | null
  job_type: string | null
  status: string
  appCount: number
  newAppCount: number
}

interface RecentApp {
  id: string
  applied_at: string
  status: string
  job_id: string
  jobs: { id: string; title: string } | null
  candidates: { profiles: { full_name: string | null } | null } | null
}

interface MatchedCandidate {
  id: string
  city: string | null
  district: string | null
  specialization: string | null
  academic_level: string | null
  availability_status: string
  profiles: { id: string; full_name: string | null } | null
}

interface Props {
  fullName: string | null
  institutionName: string
  jobs: Job[]
  matchedCandidates: MatchedCandidate[]
  recentApps: RecentApp[]
}

const AVAIL_STYLE: Record<string, { bg: string; color: string }> = {
  "מחפשת סטאג'":       { bg: 'rgba(75,46,131,.10)', color: 'var(--purple)'   },
  'פתוחה להצעות':       { bg: 'rgba(0,167,181,.10)', color: 'var(--teal-600)' },
  'בוגרת מחפשת משרה':  { bg: 'rgba(194,120,25,.10)', color: 'var(--amber)'    },
}

const GRADIENTS = [
  'linear-gradient(135deg,#4B2E83,#00A7B5)',
  'linear-gradient(135deg,#C2185B,#FF8A65)',
  'linear-gradient(135deg,#1565C0,#42A5F5)',
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'פעילה':    { bg: 'var(--green-bg)',    color: 'var(--green)' },
  'מושהית':   { bg: 'var(--amber-bg)',    color: 'var(--amber)' },
  'אוישה':    { bg: 'var(--purple-050)',  color: 'var(--purple)' },
  'בוטלה':    { bg: '#F4F4F5', color: '#71717A' },
  'פג תוקפה': { bg: '#F4F4F5', color: '#71717A' },
}

function fmtDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

export default function InstitutionDashboard({ fullName, institutionName, jobs, matchedCandidates, recentApps }: Props) {
  const firstName = fullName?.split(' ')[0] ?? ''
  const activeJobs = jobs.filter(j => j.status === 'פעילה').length
  const totalApps  = jobs.reduce((s, j) => s + j.appCount, 0)
  const newApps    = jobs.reduce((s, j) => s + j.newAppCount, 0)
  const pending    = recentApps.filter(a => a.status === 'ממתינה').length

  const kpis = [
    { label: 'משרות פעילות',   value: activeJobs, icon: <Briefcase size={20} />, color: 'var(--purple)', bg: 'linear-gradient(135deg, var(--purple-050) 0%, var(--purple-100) 100%)', tint: 'rgba(75,46,131,.07)' },
    { label: 'סה"כ הגשות',    value: totalApps,  icon: <Users size={20} />,     color: 'var(--teal-600)', bg: 'linear-gradient(135deg, var(--teal-050) 0%, var(--teal-100) 100%)',     tint: 'rgba(0,167,181,.06)'  },
    { label: 'חדשות (שבוע)',  value: newApps,    icon: <Bell size={20} />,      color: 'var(--amber)',    bg: 'linear-gradient(135deg, var(--amber-bg) 0%, #FDE68A 100%)',            tint: 'rgba(194,120,25,.07)' },
    { label: 'ממתינות לטיפול', value: pending,   icon: <Clock size={20} />,     color: 'var(--green)',    bg: 'linear-gradient(135deg, var(--green-bg) 0%, #BBF7D0 100%)',            tint: 'rgba(21,128,61,.06)'  },
  ]

  return (
    <div className="p-4 md:p-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-[30px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
            שלום, {firstName}
          </h1>
          <span className="brand-line" />
          <p className="text-[14px] font-bold mt-2" style={{ color: 'var(--purple)' }}>{institutionName}</p>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>ניהול הגיוס שלך — פשוט, מסודר, אנושי</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/institution/candidates"
            className="flex items-center gap-2 h-10 px-4 rounded-[10px] border text-[14px] font-semibold"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
            <Users size={15} />חיפוש מועמדות
          </Link>
          <Link href="/institution/jobs/new"
            className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white"
            style={{ background: 'var(--purple)' }}>
            <Plus size={15} />משרה חדשה
          </Link>
        </div>
      </div>

      {/* ציטוט יומי */}
      <ChabadQuote />

      {/* KPI row */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {kpis.map(k => (
          <div key={k.label} className="stat-card">
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `radial-gradient(ellipse 100% 70% at 95% 0%, ${k.tint} 0%, transparent 55%)`,
              borderRadius: '20px',
              zIndex: 0,
            }} />
            <div className="stat-card__icon" style={{ background: k.bg, color: k.color, boxShadow: `0 2px 8px ${k.tint}` }}>
              {k.icon}
            </div>
            <p className="stat-card__value" style={{ color: k.color }}>{k.value}</p>
            <p className="stat-card__label">{k.label}</p>
          </div>
        ))}
      </div>

      {/* מצאי את שליחת החינוך הבאה שלך */}
      {matchedCandidates.length > 0 && (
        <div className="mb-6">
          {/* Section header */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.1em] mb-0.5" style={{ color: 'var(--teal-600)' }}>
                מועמדות מומלצות
              </p>
              <h2 className="text-[18px] font-extrabold leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
                מצאי את שליחת החינוך הבאה שלך
              </h2>
            </div>
            <Link href="/institution/candidates"
              className="hidden sm:flex items-center gap-1 text-[12.5px] font-bold no-underline"
              style={{ color: 'var(--purple)' }}>
              כל המועמדות <ArrowLeft size={13} />
            </Link>
          </div>

          {/* Candidate cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {matchedCandidates.map((cand, idx) => {
              const name = cand.profiles?.full_name ?? 'מועמדת'
              const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
              const as = AVAIL_STYLE[cand.availability_status] ?? { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              return (
                <div key={cand.id}
                  className="rounded-[20px] overflow-hidden"
                  style={{
                    background: '#fff',
                    border: '1px solid var(--line)',
                    boxShadow: '0 2px 12px rgba(75,46,131,.08)',
                    transition: 'box-shadow 220ms, transform 220ms, border-color 220ms',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 12px 32px rgba(75,46,131,.18)'
                    el.style.transform = 'translateY(-3px)'
                    el.style.borderColor = 'var(--purple-200)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 2px 12px rgba(75,46,131,.08)'
                    el.style.transform = 'translateY(0)'
                    el.style.borderColor = 'var(--line)'
                  }}
                >
                  {/* Gradient header with avatar */}
                  <div className="h-[80px] flex items-end px-5 pb-0 relative"
                    style={{ background: GRADIENTS[idx % 3] }}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,.4) 0%, transparent 55%)' }} />
                    {/* Avatar overlapping into body */}
                    <div className="relative z-10 translate-y-[50%] w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center text-[17px] font-extrabold text-white shrink-0"
                      style={{ background: GRADIENTS[idx % 3], boxShadow: '0 4px 12px rgba(0,0,0,.2)' }}>
                      {initials}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 pt-10 pb-5">
                    <h3 className="text-[15px] font-extrabold mb-0.5" style={{ color: 'var(--ink)' }}>{name}</h3>

                    <div className="flex flex-wrap gap-1.5 mb-3 mt-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={as}>
                        {cand.availability_status}
                      </span>
                      {cand.academic_level && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                          {cand.academic_level}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mb-4">
                      {cand.specialization && (
                        <p className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                          <GraduationCap size={13} style={{ color: 'var(--teal-600)', flexShrink: 0 }} />
                          {cand.specialization}
                        </p>
                      )}
                      {(cand.city || cand.district) && (
                        <p className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                          <MapPin size={12} style={{ color: 'var(--red)', flexShrink: 0 }} />
                          {cand.city ?? cand.district}
                        </p>
                      )}
                    </div>

                    <Link href="/institution/candidates"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-extrabold no-underline transition-all"
                      style={{
                        background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)',
                        color: '#fff',
                        boxShadow: '0 3px 10px rgba(75,46,131,.25)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <Users size={14} />
                      הזמן לראיון
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* My jobs */}
        <div className="rounded-[18px] border overflow-hidden" style={{ background: 'linear-gradient(160deg, #FDFCFF 0%, #FAF8FE 100%)', borderColor: 'var(--line)', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>המשרות שלי</h2>
            <Link href="/institution/jobs" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--purple)' }}>
              הכל <ArrowLeft size={13} />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[14px] mb-2" style={{ color: 'var(--ink-3)' }}>עדיין לא פרסמת משרות</p>
              <Link href="/institution/jobs/new" className="text-[13px] font-bold" style={{ color: 'var(--purple)' }}>
                + פרסמי משרה ראשונה
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
              {jobs.slice(0, 5).map(job => {
                const ss = STATUS_STYLE[job.status] ?? STATUS_STYLE['בוטלה']
                return (
                  <Link key={job.id} href={`/institution/jobs/${job.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-all"
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                        {job.city && <span>{job.city}</span>}
                        {job.job_type && <span>{job.job_type}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.newAppCount > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
                          +{job.newAppCount} חדש
                        </span>
                      )}
                      <span className="text-[12px] font-medium" style={{ color: 'var(--ink-3)' }}>
                        {job.appCount} הגשות
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={ss}>
                        {job.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="rounded-[18px] border overflow-hidden" style={{ background: 'linear-gradient(160deg, #FDFCFF 0%, #FAF8FE 100%)', borderColor: 'var(--line)', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>הגשות אחרונות</h2>
          </div>
          {recentApps.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין הגשות עדיין</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
              {recentApps.slice(0, 6).map(app => (
                <Link key={app.id} href={`/institution/jobs/${app.job_id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-all"
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                      {app.candidates?.profiles?.full_name ?? '—'}
                    </p>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--ink-3)' }}>
                      {app.jobs?.title ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {app.status === 'ממתינה' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                        <Clock size={10} />ממתינה
                      </span>
                    )}
                    {app.status === 'התקבלה' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                        <CheckCircle size={10} />התקבלה
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>{fmtDate(app.applied_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
