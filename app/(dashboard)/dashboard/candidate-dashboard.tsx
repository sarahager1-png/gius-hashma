'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ClipboardList, User, Clock, CheckCircle, XCircle, Eye, MapPin, ArrowLeft, Calendar, Bell, Check } from 'lucide-react'
import ChabadQuote from '@/components/dashboard/chabad-quote'

interface Application {
  id: string
  status: string
  applied_at: string
  jobs: { title: string; city: string | null; institutions: { institution_name: string } | null } | null
}

interface Job {
  id: string
  title: string
  city: string | null
  job_type: string | null
  institutions: { institution_name: string } | null
}

interface MatchedJob {
  id: string
  title: string
  city: string | null
  district: string | null
  job_type: string | null
  specialization: string | null
  description: string | null
  institutions: { institution_name: string; institution_type: string | null; city: string | null } | null
}

interface Interview {
  id: string
  scheduled_at: string
  location: string | null
  notes: string | null
  candidate_confirmed: boolean | null
  applications: { jobs: { title: string; institutions: { institution_name: string } | null } | null } | null
}

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  created_at: string
}

interface Invitation {
  id: string
  status: string
  scheduled_at: string | null
  created_at: string
  jobs: { title: string; city: string | null; job_type: string | null } | null
  institutions: { institution_name: string } | null
}

interface Props {
  fullName: string | null
  availabilityStatus: string
  profileScore: number
  matchedJobs: MatchedJob[]
  totalJobs: number
  myApplications: Application[]
  suggestedJobs: Job[]
  upcomingInterviews: Interview[]
  notifications: Notification[]
  pendingInvitations: Invitation[]
}

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  'ממתינה': { bg: 'var(--purple-050)', color: 'var(--purple)',  icon: <Clock size={13} /> },
  'נצפתה':  { bg: '#E0F2FE',          color: '#0369A1',        icon: <Eye size={13} /> },
  'התקבלה': { bg: 'var(--green-bg)',   color: 'var(--green)',   icon: <CheckCircle size={13} /> },
  'נדחתה':  { bg: 'var(--red-bg)',     color: 'var(--red)',     icon: <XCircle size={13} /> },
  'בוטלה':  { bg: '#F4F4F5',          color: '#71717A',        icon: <XCircle size={13} /> },
}

const AVAIL_STYLE: Record<string, { bg: string; color: string }> = {
  "מחפשת סטאג'":      { bg: 'var(--purple-050)', color: 'var(--purple)'  },
  'פתוחה להצעות':     { bg: 'var(--teal-050)',   color: 'var(--teal-600)'},
  'משובצת':           { bg: 'var(--green-bg)',   color: 'var(--green)'   },
  'בוגרת מחפשת משרה': { bg: 'var(--amber-bg)',   color: 'var(--amber)'   },
  'לא פעילה':          { bg: '#F4F4F5',          color: '#71717A'        },
}

const NOTIF_STYLE: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  'application_accepted':  { bg: 'var(--green-bg)',   border: '#86EFAC', icon: <CheckCircle size={16} style={{ color: 'var(--green)' }} /> },
  'application_rejected':  { bg: 'var(--amber-bg)',   border: '#FED7AA', icon: <Clock size={16} style={{ color: 'var(--amber)' }} /> },
  'application_viewed':    { bg: 'var(--teal-050)',   border: '#99E4EC', icon: <Bell size={16} style={{ color: 'var(--teal-600)' }} /> },
  'interview_scheduled':   { bg: 'var(--purple-050)', border: 'var(--purple-100)', icon: <Calendar size={16} style={{ color: 'var(--purple)' }} /> },
  'new_application':       { bg: 'var(--teal-050)',   border: '#99E4EC', icon: <Bell size={16} style={{ color: 'var(--teal-600)' }} /> },
}

function fmtDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  return `לפני ${days} ימים`
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

const INST_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'שלהבות חב"ד': { bg: 'var(--purple-050)', color: 'var(--purple)'   },
  'בית חינוך':   { bg: 'var(--teal-050)',   color: 'var(--teal-600)' },
  'קהילתי':      { bg: 'var(--amber-bg)',   color: 'var(--amber)'    },
}

export default function CandidateDashboard({ fullName, availabilityStatus, profileScore, matchedJobs, totalJobs, myApplications, suggestedJobs, upcomingInterviews, notifications: initialNotifs, pendingInvitations: initialInvitations }: Props) {
  const firstName = fullName?.split(' ')[0] ?? ''
  const pending  = myApplications.filter(a => a.status === 'ממתינה').length
  const accepted = myApplications.filter(a => a.status === 'התקבלה').length
  const as = AVAIL_STYLE[availabilityStatus] ?? AVAIL_STYLE['לא פעילה']

  const [notifs, setNotifs] = useState(initialNotifs)
  const [interviews, setInterviews] = useState(upcomingInterviews)
  const [invitations, setInvitations] = useState(initialInvitations)
  const unread = notifs.filter(n => !n.read).length

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function respondToInvitation(invId: string, status: 'התקבלה' | 'נדחתה') {
    await fetch(`/api/invitations/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setInvitations(prev => prev.filter(i => i.id !== invId))
  }

  async function confirmInterview(ivId: string, confirmed: boolean) {
    await fetch(`/api/interviews/${ivId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed }),
    })
    setInterviews(prev => prev.map(iv => iv.id === ivId ? { ...iv, candidate_confirmed: confirmed } : iv))
  }

  const kpis = [
    { label: 'משרות פתוחות',    value: totalJobs,              icon: <Briefcase size={20} />,    color: 'var(--purple)',    bg: 'linear-gradient(135deg, var(--purple-050) 0%, var(--purple-100) 100%)', tint: 'rgba(75,46,131,.07)' },
    { label: 'הגשות שלי',       value: myApplications.length,  icon: <ClipboardList size={20} />, color: 'var(--teal-600)', bg: 'linear-gradient(135deg, var(--teal-050) 0%, var(--teal-100) 100%)',   tint: 'rgba(0,167,181,.06)' },
    { label: 'ממתינות לתגובה',  value: pending,                 icon: <Clock size={20} />,        color: 'var(--amber)',    bg: 'linear-gradient(135deg, var(--amber-bg) 0%, #FDE68A 100%)',           tint: 'rgba(194,120,25,.07)' },
    { label: 'התקבלו',          value: accepted,                icon: <CheckCircle size={20} />,  color: 'var(--green)',    bg: 'linear-gradient(135deg, var(--green-bg) 0%, #BBF7D0 100%)',           tint: 'rgba(21,128,61,.06)' },
  ]

  return (
    <div className="p-4 md:p-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-[30px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
            שלום{firstName ? `, ${firstName}` : ''}
            <span className="ms-2 text-[var(--purple)]">👋</span>
          </h1>
          <span className="brand-line" />
          <p className="text-[13.5px] font-semibold mt-2" style={{ color: 'var(--ink-3)' }}>
            כאן מחברים אנשי חינוך למקומות של שליחות
          </p>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-3)' }}>
            הנה מה שקורה בפרופיל שלך היום
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[12.5px] font-bold px-2.5 py-1 rounded-full" style={as}>
              {availabilityStatus}
            </span>
            {unread > 0 && (
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
                <Bell size={11} />{unread} חדש
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/jobs"
            className="flex items-center gap-2 h-10 px-5 rounded-[12px] text-[14px] font-bold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)',
              boxShadow: '0 4px 16px rgba(75,46,131,.3)',
            }}>
            <Briefcase size={15} />עיון במשרות
          </Link>
        </div>
      </div>

      {/* ציטוט יומי */}
      <ChabadQuote />

      {/* Profile completion bar — only when < 100% */}
      {profileScore < 100 && (
        <div className="rounded-[14px] border mb-4 px-5 py-4 flex items-center gap-4"
          style={{ background: '#fff', borderColor: 'var(--purple-200)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>השלמת פרופיל</span>
              <span className="text-[13px] font-extrabold" style={{ color: profileScore >= 80 ? 'var(--green)' : 'var(--purple)' }}>
                {profileScore}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--bg-3)' }}>
              <div className="h-2 rounded-full transition-all"
                style={{
                  width: `${profileScore}%`,
                  background: profileScore >= 80
                    ? 'var(--green)'
                    : 'linear-gradient(90deg, var(--purple) 0%, var(--teal) 100%)',
                }} />
            </div>
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--ink-3)' }}>
              פרופיל מלא = סיכוי גבוה יותר להתאמה — השלימי עיר, מחוז, התמחות ורמה אקדמית
            </p>
          </div>
          <a href="/profile"
            className="shrink-0 text-[13px] font-bold px-3.5 py-2 rounded-[10px] no-underline transition-all"
            style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
            השלמי ←
          </a>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="rounded-[20px] border overflow-hidden relative"
            style={{ background: 'linear-gradient(145deg, #FDFCFF 0%, #FAF8FE 100%)', borderColor: 'var(--line)', boxShadow: '0 2px 12px rgba(75,46,131,.10)', transition: 'box-shadow 240ms, transform 240ms' }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(75,46,131,.20)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(75,46,131,.10)'
            }}
          >
            {/* Signature brand bar */}
            <div className="absolute top-0 inset-x-0 h-[4px] rounded-t-[20px]"
              style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #00A7B5 100%)' }} />
            {/* Corner tint */}
            <div className="absolute inset-0 pointer-events-none rounded-[20px]"
              style={{ background: `radial-gradient(ellipse 100% 70% at 95% 0%, ${k.tint} 0%, transparent 55%)` }} />
            <div className="p-5 relative">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
                style={{ background: k.bg, color: k.color, boxShadow: `0 2px 8px ${k.tint}` }}>
                {k.icon}
              </div>
              <p className="text-[44px] font-black leading-none mb-1" style={{ color: k.color, letterSpacing: '-.05em' }}>{k.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--ink-4)' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending invitations from institutions */}
      {invitations.length > 0 && (
        <div className="rounded-[16px] border mb-4" style={{ background: '#fff', borderColor: '#C4B5FD', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--purple)' }} />
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>הזמנות ממוסדות</h2>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full mr-1" style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
              {invitations.length}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
            {invitations.map(inv => {
              const jobTitle = (inv.jobs as unknown as { title: string } | null)?.title ?? '—'
              const instName = (inv.institutions as unknown as { institution_name: string } | null)?.institution_name ?? '—'
              const jobType = (inv.jobs as unknown as { job_type: string | null } | null)?.job_type
              const city = (inv.jobs as unknown as { city: string | null } | null)?.city
              const dt = inv.scheduled_at
                ? new Date(inv.scheduled_at).toLocaleString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                : null
              return (
                <div key={inv.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{jobTitle}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {instName}{city && ` · ${city}`}{jobType && ` · ${jobType}`}
                      </p>
                      {dt && (
                        <p className="text-[12px] mt-1 font-semibold flex items-center gap-1" style={{ color: 'var(--purple)' }}>
                          <Calendar size={11} />ראיון מוצע: {dt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondToInvitation(inv.id, 'התקבלה')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-bold"
                      style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <Check size={14} />קבלת ההזמנה
                    </button>
                    <button onClick={() => respondToInvitation(inv.id, 'נדחתה')}
                      className="flex-1 py-2 rounded-[8px] text-[13px] font-bold"
                      style={{ background: 'var(--bg-3)', color: 'var(--ink-3)' }}>
                      לא יכולה כרגע
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notifications + Interviews row */}
      {(notifs.length > 0 || interviews.length > 0) && (
        <div className={`grid gap-4 mb-4 grid-cols-1 ${interviews.length > 0 && notifs.length > 0 ? 'lg:grid-cols-2' : ''}`}>

          {/* Notifications */}
          {notifs.length > 0 && (
            <div className="rounded-[16px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                <h2 className="text-[14px] font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                  <Bell size={14} />הודעות
                  {unread > 0 && (
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#FDF3E3', color: '#B45309' }}>{unread}</span>
                  )}
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {notifs.slice(0, 5).map(n => {
                  const ns = NOTIF_STYLE[n.type] ?? NOTIF_STYLE['new_application']
                  return (
                    <div key={n.id} className="px-5 py-3.5"
                      style={{ background: n.read ? 'transparent' : ns.bg + '60' }}
                      onClick={() => !n.read && markRead(n.id)}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{ns.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{n.title}</p>
                          {n.body && <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--ink-3)' }}>{n.body}</p>}
                          <p className="text-[11px] mt-1" style={{ color: 'var(--ink-4)' }}>{fmtDate(n.created_at)}</p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--amber)' }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upcoming interviews */}
          {interviews.length > 0 && (
            <div className="rounded-[16px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                <h2 className="text-[14px] font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                  <Calendar size={14} />ראיונות קרובים
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {interviews.map(iv => {
                  const job = (iv.applications as unknown as { jobs: { title: string; institutions: { institution_name: string } | null } | null } | null)?.jobs
                  return (
                    <div key={iv.id} className="px-5 py-4">
                      <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{job?.title ?? '—'}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {job?.institutions?.institution_name}
                      </p>
                      <p className="text-[12px] mt-1.5 font-semibold" style={{ color: 'var(--purple)' }}>
                        📅 {fmtDt(iv.scheduled_at)}
                      </p>
                      {iv.location && <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>📍 {iv.location}</p>}
                      {iv.notes && <p className="text-[12px] mt-0.5 italic" style={{ color: 'var(--ink-4)' }}>{iv.notes}</p>}

                      {/* Confirm / Decline */}
                      {iv.candidate_confirmed === null ? (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => confirmInterview(iv.id, true)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 rounded-[8px]"
                            style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                            <Check size={13} />אישור הגעה
                          </button>
                          <button onClick={() => confirmInterview(iv.id, false)}
                            className="flex-1 text-[12px] font-bold py-2 rounded-[8px]"
                            style={{ background: 'var(--bg-3)', color: 'var(--ink-3)' }}>
                            לא יכולה
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          {iv.candidate_confirmed
                            ? <span className="text-[12px] font-bold flex items-center gap-1" style={{ color: 'var(--green)' }}><Check size={12} />אישרת הגעה</span>
                            : <span className="text-[12px] font-bold" style={{ color: 'var(--red)' }}>ביטלת</span>
                          }
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* הטובות לשליחות חינוכית */}
      {matchedJobs.length > 0 && (
        <div className="mb-6">
          {/* Section header */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.1em] mb-0.5" style={{ color: 'var(--teal-600)' }}>
                הזדמנויות עבורך
              </p>
              <h2 className="text-[18px] font-extrabold leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
                הטובות לשליחות חינוכית ברשת חינוך חב״ד
              </h2>
            </div>
            <Link href="/jobs"
              className="hidden sm:flex items-center gap-1 text-[12.5px] font-bold no-underline"
              style={{ color: 'var(--purple)' }}>
              כל המשרות <ArrowLeft size={13} />
            </Link>
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedJobs.map((job, idx) => {
              const inst = job.institutions
              const instType = inst?.institution_type ?? ''
              const itc = INST_TYPE_COLORS[instType] ?? { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              const gradients = [
                'linear-gradient(135deg, #4B2E83 0%, #00A7B5 100%)',
                'linear-gradient(135deg, #2D1B5C 0%, #4B2E83 100%)',
                'linear-gradient(135deg, #007680 0%, #00A7B5 100%)',
              ]
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}
                  className="group rounded-[20px] overflow-hidden no-underline flex flex-col transition-all"
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
                  {/* Gradient header */}
                  <div className="h-[72px] flex items-end px-5 pb-3 relative"
                    style={{ background: gradients[idx % 3] }}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,.3) 0%, transparent 60%)' }} />
                    {instType && (
                      <span className="relative text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,.18)', color: '#fff', border: '1px solid rgba(255,255,255,.25)' }}>
                        {instType}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col p-5">
                    <h3 className="text-[16px] font-extrabold leading-tight mb-1"
                      style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
                      {job.title}
                    </h3>
                    {inst?.institution_name && (
                      <p className="text-[12.5px] font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>
                        {inst.institution_name}
                      </p>
                    )}

                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.city && (
                        <span className="flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                          <MapPin size={10} strokeWidth={2.5} />{job.city}
                        </span>
                      )}
                      {job.job_type && (
                        <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                          {job.job_type}
                        </span>
                      )}
                      {job.specialization && (
                        <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--teal-050)', color: 'var(--teal-600)' }}>
                          {job.specialization}
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-[12.5px] leading-relaxed mb-4 line-clamp-2 flex-1"
                        style={{ color: 'var(--ink-3)' }}>
                        {job.description}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="mt-auto pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--line-soft)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
                        {inst?.city ?? job.city ?? ''}
                      </span>
                      <span className="flex items-center gap-1 text-[12.5px] font-extrabold"
                        style={{ color: 'var(--purple)' }}>
                        לפרטים ←
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Recent applications */}
        <div className="rounded-[16px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>הגשות אחרונות</h2>
            <Link href="/my-applications" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--purple)' }}>
              הכל <ArrowLeft size={13} />
            </Link>
          </div>
          {myApplications.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>עדיין לא הגשת מועמדויות</p>
              <Link href="/jobs" className="text-[13px] font-bold mt-1 block" style={{ color: 'var(--purple)' }}>
                חפשי משרות →
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
              {myApplications.slice(0, 5).map(app => {
                const ss = STATUS_STYLE[app.status] ?? STATUS_STYLE['בוטלה']
                return (
                  <div key={app.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {app.jobs?.title ?? '—'}
                      </p>
                      <p className="text-[12px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--ink-3)' }}>
                        {app.jobs?.institutions?.institution_name}
                        {app.jobs?.city && <><span>·</span><MapPin size={10} />{app.jobs.city}</>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>
                        {ss.icon}{app.status}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>{fmtDate(app.applied_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Suggested jobs */}
        <div className="rounded-[16px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>משרות פתוחות</h2>
            <Link href="/jobs" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--purple)' }}>
              הכל <ArrowLeft size={13} />
            </Link>
          </div>
          {suggestedJobs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין משרות פתוחות כרגע</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
              {suggestedJobs.slice(0, 5).map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`}
                  className="block px-5 py-3.5 transition-all"
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                    {job.institutions?.institution_name && <span>{job.institutions.institution_name}</span>}
                    {job.city && <><span>·</span><span className="flex items-center gap-0.5"><MapPin size={10} />{job.city}</span></>}
                    {job.job_type && <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>{job.job_type}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="text-[13px] font-bold uppercase tracking-[.08em] mb-4" style={{ color: 'var(--ink-3)' }}>פעולות מהירות</h2>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <Link href="/jobs"
            className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[14px] font-semibold text-white"
            style={{ background: 'var(--purple)' }}>
            <Briefcase size={15} />חפשי משרות
          </Link>
          <Link href="/my-applications"
            className="flex items-center gap-2 h-10 px-5 rounded-[10px] border text-[14px] font-semibold"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
            <ClipboardList size={15} />הגשות שלי
          </Link>
          <Link href="/profile"
            className="flex items-center gap-2 h-10 px-5 rounded-[10px] border text-[14px] font-semibold"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
            <User size={15} />הפרופיל שלי
          </Link>
        </div>
      </div>
    </div>
  )
}
