import { Send, Eye, CalendarCheck, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

/**
 * ApplicationTimeline — visual stage tracker for a single application.
 * Stages: הוגשה → נצפתה → ראיון → התקבלה (terminal node flips to נדחתה / בוטלה).
 * RTL, mobile-first. Shared by candidate (my-applications) and institution inbox.
 */

const PURPLE = '#5B3AAB'
const CYAN = '#00B4CC'
const GREEN = '#15803D'
const RED = '#B91C1C'
const GRAY = '#9CA3AF'

type Interview = { scheduled_at: string } | null | undefined

export interface ApplicationTimelineProps {
  status: string // ממתינה | נצפתה | התקבלה | נדחתה | בוטלה
  appliedAt?: string | null
  /** updated_at — used as the "viewed/decision" timestamp */
  updatedAt?: string | null
  placementDate?: string | null
  interview?: Interview
  /** compact = smaller dots/labels for dense lists */
  compact?: boolean
}

type StepState = 'done' | 'current' | 'pending'

function fmt(d?: string | null) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

export default function ApplicationTimeline({
  status,
  appliedAt,
  updatedAt,
  placementDate,
  interview,
  compact = false,
}: ApplicationTimelineProps) {
  const hasInterview = !!interview?.scheduled_at
  const isAccepted = status === 'התקבלה'
  const isRejected = status === 'נדחתה'
  const isCancelled = status === 'בוטלה'
  const isTerminal = isAccepted || isRejected || isCancelled
  const viewed = status !== 'ממתינה' || hasInterview

  // terminal node — label + color flip
  const decisionLabel = isAccepted ? 'התקבלה' : isRejected ? 'נדחתה' : isCancelled ? 'בוטלה' : 'החלטה'
  const decisionColor = isAccepted ? GREEN : isRejected ? RED : isCancelled ? GRAY : GRAY
  const DecisionIcon = isAccepted ? CheckCircle2 : isRejected ? XCircle : isCancelled ? MinusCircle : CheckCircle2

  const steps: {
    key: string
    label: string
    date: string
    Icon: typeof Send
    state: StepState
    color: string
  }[] = [
    {
      key: 'applied',
      label: 'הוגשה',
      date: fmt(appliedAt),
      Icon: Send,
      state: 'done',
      color: PURPLE,
    },
    {
      key: 'viewed',
      label: 'נצפתה',
      date: '',
      Icon: Eye,
      state: viewed ? 'done' : 'current',
      color: PURPLE,
    },
    {
      key: 'interview',
      label: 'ראיון',
      date: fmt(interview?.scheduled_at),
      Icon: CalendarCheck,
      state: hasInterview ? 'done' : viewed && !isTerminal ? 'current' : 'pending',
      color: PURPLE,
    },
    {
      key: 'decision',
      label: decisionLabel,
      date: isAccepted ? fmt(placementDate ?? updatedAt) : isTerminal ? fmt(updatedAt) : '',
      Icon: DecisionIcon,
      state: isTerminal ? 'done' : 'pending',
      color: decisionColor,
    },
  ]

  // progress line fill = up to the last "done" step
  const lastDone = steps.reduce((acc, s, i) => (s.state === 'done' ? i : acc), 0)
  const fillPct = (lastDone / (steps.length - 1)) * 100

  const dot = compact ? 26 : 32
  const iconSize = compact ? 13 : 15
  const labelSize = compact ? 10.5 : 11.5

  return (
    <div dir="rtl" style={{ width: '100%' }}>
      <div style={{ position: 'relative', padding: '4px 2px 0' }}>
        {/* track */}
        <div
          style={{
            position: 'absolute',
            top: dot / 2 + 4,
            right: dot / 2,
            left: dot / 2,
            height: 3,
            borderRadius: 99,
            background: '#ECEAF3',
          }}
        />
        {/* fill (RTL → grows from the right) */}
        <div
          style={{
            position: 'absolute',
            top: dot / 2 + 4,
            right: dot / 2,
            width: `calc((100% - ${dot}px) * ${fillPct / 100})`,
            height: 3,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
            transition: 'width .5s ease',
          }}
        />
        {/* nodes */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          {steps.map(s => {
            const isDone = s.state === 'done'
            const isCurrent = s.state === 'current'
            const bg = isDone ? s.color : '#fff'
            const fg = isDone ? '#fff' : isCurrent ? CYAN : GRAY
            const ring = isCurrent ? `0 0 0 4px ${CYAN}22` : 'none'
            const border = isDone ? 'none' : `2px solid ${isCurrent ? CYAN : '#E3E0EC'}`
            return (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  flex: '0 0 auto',
                  width: dot + 18,
                }}
              >
                <div
                  style={{
                    width: dot,
                    height: dot,
                    borderRadius: '50%',
                    background: bg,
                    border,
                    boxShadow: ring,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: fg,
                    transition: 'all .3s ease',
                  }}
                >
                  <s.Icon size={iconSize} strokeWidth={2.4} />
                </div>
                <span
                  style={{
                    fontSize: labelSize,
                    fontWeight: isDone || isCurrent ? 700 : 600,
                    color: isDone ? s.color : isCurrent ? CYAN : '#A8A2B5',
                    lineHeight: 1.1,
                    textAlign: 'center',
                  }}
                >
                  {s.label}
                </span>
                {s.date && (
                  <span style={{ fontSize: labelSize - 1.5, color: '#B4AEC0', lineHeight: 1 }}>
                    {s.date}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
