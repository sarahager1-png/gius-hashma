'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, User, Briefcase, Clock, FileText, X, ChevronLeft } from 'lucide-react'

type FeedFilter = 'הכל' | 'שיבוץ' | 'הגשות'

interface ActivityItem {
  id: number
  type: string
  color: 'green' | 'purple' | 'teal' | 'amber' | 'red'
  icon: 'check' | 'user' | 'briefcase' | 'clock' | 'file' | 'x'
  text: string
  time: string
}

const ICONS = { check: Check, user: User, briefcase: Briefcase, clock: Clock, file: FileText, x: X }

const RING: Record<string, React.CSSProperties> = {
  green:  { background: '#E4F6ED', color: 'var(--green)' },
  purple: { background: 'var(--purple-050)', color: 'var(--purple)' },
  teal:   { background: 'var(--teal-050)', color: 'var(--teal-600)' },
  amber:  { background: '#FBEFD7', color: 'var(--amber)' },
  red:    { background: 'var(--red-bg)', color: 'var(--red)' },
}

interface Props { since: string; until: string }

export default function ActivityFeed({ since, until }: Props) {
  const [filter, setFilter] = useState<FeedFilter>('הכל')

  const { data = [] } = useQuery<ActivityItem[]>({
    queryKey: ['activity', since, until],
    queryFn: () => fetch(`/api/activity?since=${since}&until=${until}`).then(r => r.json()),
  })

  return (
    <div className="rounded-[14px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-3.5" style={{ paddingTop: 18 }}>
        <div className="flex-1">
          <h3 className="text-[16.5px] font-bold" style={{ color: 'var(--ink)' }}>פעילות אחרונה</h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>עדכון נצבת מהמערכת</p>
        </div>
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
          {(['הכל', 'שיבוץ', 'הגשות'] as FeedFilter[]).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
              style={filter === s
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
                : { background: 'transparent', color: 'var(--ink-3)' }
              }
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div>
        {data.map((item, i) => {
          const Icon = ICONS[item.icon]
          return (
            <div key={item.id}
              className="flex gap-3 px-5 py-3.5 transition-all cursor-default"
              style={{ borderBottom: i < data.length - 1 ? '1px solid var(--line-soft)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={RING[item.color]}>
                <Icon size={16} strokeWidth={item.icon === 'check' ? 2.3 : 2} />
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13.5px] leading-snug"
                  style={{ color: 'var(--ink)', lineHeight: 1.45 }}
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
                <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>{item.time}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-center px-5 pt-2.5 pb-4.5" style={{ borderTop: '1px solid var(--line-soft)', paddingBottom: 18 }}>
        <button className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--purple)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-050)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          צפייה בכל הפעילות
        </button>
      </div>
    </div>
  )
}
