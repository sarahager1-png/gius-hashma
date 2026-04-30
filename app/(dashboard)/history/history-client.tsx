'use client'

import { useState } from 'react'
import { Calendar, Send, Mail, Video, CheckCircle2, XCircle, Eye, Check, X } from 'lucide-react'

type HistoryEvent = {
  id: string
  ts: string
  type: 'application' | 'view' | 'invite' | 'interview' | 'success' | 'rejection'
  title: string
  subtitle: string
  tag: string
  invitationId?: string
  interviewId?: string
}

const TYPE_CFG: Record<HistoryEvent['type'], {
  icon: React.ReactNode
  accent: string
  bg: string
  tagBg: string
  tagColor: string
}> = {
  application: {
    icon: <Send size={14} />,
    accent: 'var(--purple)',
    bg: '#F5F3FF',
    tagBg: '#EDE9FE',
    tagColor: 'var(--purple)',
  },
  view: {
    icon: <Eye size={14} />,
    accent: '#0369A1',
    bg: '#F0F9FF',
    tagBg: '#E0F2FE',
    tagColor: '#0369A1',
  },
  invite: {
    icon: <Mail size={14} />,
    accent: '#7C3AED',
    bg: '#FAF5FF',
    tagBg: '#EDE9FE',
    tagColor: '#6D28D9',
  },
  interview: {
    icon: <Video size={14} />,
    accent: '#0F766E',
    bg: '#F0FDFA',
    tagBg: '#CCFBF1',
    tagColor: '#0F766E',
  },
  success: {
    icon: <CheckCircle2 size={14} />,
    accent: '#1A7A4A',
    bg: '#F0FDF4',
    tagBg: '#DCFCE7',
    tagColor: '#166534',
  },
  rejection: {
    icon: <XCircle size={14} />,
    accent: '#71717A',
    bg: '#FAFAFA',
    tagBg: '#F4F4F5',
    tagColor: '#52525B',
  },
}

function fmtDt(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `היום · ${time}`
  if (diffDays === 1) return `אתמול · ${time}`
  if (diffDays < 7) return `לפני ${diffDays} ימים · ${time}`
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(events: HistoryEvent[]) {
  const groups: { label: string; events: HistoryEvent[] }[] = []
  const map = new Map<string, HistoryEvent[]>()

  for (const e of events) {
    const d = new Date(e.ts)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
    let label: string
    if (diffDays === 0) label = 'היום'
    else if (diffDays === 1) label = 'אתמול'
    else if (diffDays < 7) label = 'השבוע'
    else if (diffDays < 30) label = 'החודש'
    else label = d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })

    if (!map.has(label)) {
      map.set(label, [])
      groups.push({ label, events: map.get(label)! })
    }
    map.get(label)!.push(e)
  }
  return groups
}

interface Props {
  events: HistoryEvent[]
  role: string
}

export default function HistoryClient({ events: initialEvents, role }: Props) {
  const [events, setEvents] = useState<HistoryEvent[]>(initialEvents)
  const [acting, setActing] = useState<string | null>(null)

  async function respondInvitation(invitationId: string, eventId: string, accept: boolean) {
    setActing(invitationId)
    const res = await fetch(`/api/invitations/${invitationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: accept ? 'התקבלה' : 'נדחתה' }),
    })
    if (res.ok) {
      setEvents(prev => prev.map(e =>
        e.id === eventId
          ? {
              ...e,
              tag: accept ? 'התקבלה' : 'נדחתה',
              title: accept ? 'קיבלת הזמנה לראיון' : 'דחית הזמנה',
              type: accept ? 'success' : 'rejection',
              invitationId: undefined,
            }
          : e
      ))
    }
    setActing(null)
  }

  async function confirmInterview(interviewId: string, eventId: string, confirmed: boolean) {
    setActing(interviewId)
    const res = await fetch(`/api/interviews/${interviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed }),
    })
    if (res.ok) {
      setEvents(prev => prev.map(e =>
        e.id === eventId
          ? {
              ...e,
              tag: confirmed ? 'אושר' : 'בוטל',
              title: confirmed ? 'אישרת ראיון' : 'ביטלת ראיון',
              type: confirmed ? 'success' : 'rejection',
              interviewId: undefined,
            }
          : e
      ))
    }
    setActing(null)
  }

  const groups = groupByDate(events)

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">היסטוריה</h1>
          <span className="brand-line" />
          <p className="page-subtitle">
            {events.length > 0
              ? `${events.length} אירועים · ${role === 'מועמדת' ? 'ציר הזמן שלך' : 'פעילות המוסד'}`
              : 'אין אירועים עדיין'}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[16px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Calendar size={40} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-3)' }}>עדיין אין פעילות להצגה</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>
            {role === 'מועמדת' ? 'הגישי למשרות והיסטוריית הפעילות שלך תופיע כאן' : 'פעילות הגיוס תופיע כאן'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold tracking-[.1em] uppercase px-2 py-1 rounded-md"
                  style={{ background: 'var(--surface-2, #F4F4F5)', color: 'var(--ink-3)' }}>
                  {group.label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
              </div>

              <div className="relative">
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    width: 2,
                    background: 'linear-gradient(to bottom, var(--purple-200, #DDD6FE), transparent)',
                    right: 19,
                    borderRadius: 2,
                  }}
                />

                <div className="space-y-3">
                  {group.events.map(event => {
                    const cfg = TYPE_CFG[event.type]
                    const isPendingInvite = event.type === 'invite' && event.invitationId
                    const isPendingInterview = event.type === 'interview' && event.interviewId
                    const isActing = acting === event.invitationId || acting === event.interviewId
                    return (
                      <div key={event.id} className="flex items-start gap-4" style={{ paddingRight: 40 }}>
                        <div
                          className="absolute flex items-center justify-center rounded-full shrink-0"
                          style={{
                            right: 10,
                            width: 22,
                            height: 22,
                            background: cfg.bg,
                            border: `2px solid ${cfg.accent}`,
                            color: cfg.accent,
                            marginTop: 14,
                          }}
                        >
                          {cfg.icon}
                        </div>

                        <div
                          className="flex-1 rounded-[12px] border p-4"
                          style={{
                            background: '#fff',
                            borderColor: isPendingInvite ? cfg.accent : 'var(--line)',
                            borderRight: `3px solid ${cfg.accent}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>
                                {event.title}
                              </p>
                              <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--ink-3)' }}>
                                {event.subtitle}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span
                                className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: cfg.tagBg, color: cfg.tagColor }}
                              >
                                {event.tag}
                              </span>
                              <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                                {fmtDt(event.ts)}
                              </span>
                            </div>
                          </div>

                          {isPendingInvite && (
                            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                              <button
                                onClick={() => respondInvitation(event.invitationId!, event.id, true)}
                                disabled={isActing}
                                className="flex items-center gap-1.5 h-8 px-4 rounded-[8px] text-[12.5px] font-bold text-white transition-all"
                                style={{ background: '#1A7A4A', opacity: isActing ? 0.6 : 1 }}>
                                <Check size={13} />
                                {isActing ? 'שומר...' : 'אישור'}
                              </button>
                              <button
                                onClick={() => respondInvitation(event.invitationId!, event.id, false)}
                                disabled={isActing}
                                className="flex items-center gap-1.5 h-8 px-4 rounded-[8px] text-[12.5px] font-bold transition-all"
                                style={{ background: '#FEE2E2', color: '#B91C1C', opacity: isActing ? 0.6 : 1 }}>
                                <X size={13} />
                                דחייה
                              </button>
                            </div>
                          )}

                          {isPendingInterview && (
                            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                              <p className="text-[12px] w-full mb-2" style={{ color: 'var(--ink-3)' }}>
                                אשרי את הגעתך לראיון:
                              </p>
                              <button
                                onClick={() => confirmInterview(event.interviewId!, event.id, true)}
                                disabled={isActing}
                                className="flex items-center gap-1.5 h-8 px-4 rounded-[8px] text-[12.5px] font-bold text-white transition-all"
                                style={{ background: '#1A7A4A', opacity: isActing ? 0.6 : 1 }}>
                                <Check size={13} />
                                {isActing ? 'שומר...' : 'אגיע לראיון'}
                              </button>
                              <button
                                onClick={() => confirmInterview(event.interviewId!, event.id, false)}
                                disabled={isActing}
                                className="flex items-center gap-1.5 h-8 px-4 rounded-[8px] text-[12.5px] font-bold transition-all"
                                style={{ background: '#FEE2E2', color: '#B91C1C', opacity: isActing ? 0.6 : 1 }}>
                                <X size={13} />
                                לא אוכל
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
