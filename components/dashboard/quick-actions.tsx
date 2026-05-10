'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Check, MessageCircle, BarChart3,
  Star, CalendarDays, Upload, Users, Briefcase, Bell,
} from 'lucide-react'

interface QA {
  icon: React.ComponentType<{ size?: number }>
  title: string
  desc: string
  href: string
  badge?: number
}

export default function QuickActions() {
  const { data: pending = 0 } = useQuery<number>({
    queryKey: ['pending-institutions'],
    queryFn: () =>
      fetch('/api/institutions/pending-count').then(r => r.json()).then(d => d.count ?? 0),
  })

  const ACTIONS: QA[] = [
    { icon: Check,        title: 'אישור מוסדות',       desc: pending > 0 ? `${pending} ממתינים לאישור` : 'אין ממתינים',     href: '/admin/institutions',  badge: pending || undefined },
    { icon: Users,        title: 'מועמדות',             desc: 'חיפוש וסינון לפי תחום ומיקום',                               href: '/candidates'                                          },
    { icon: Briefcase,    title: 'משרות',               desc: 'כל המשרות הפעילות ברשת',                                     href: '/admin/jobs'                                          },
    { icon: MessageCircle,title: 'הודעות',              desc: 'inbox ושליחת הודעות ישירות',                                  href: '/inbox'                                               },
    { icon: CalendarDays, title: 'ראיונות',             desc: 'לוח ראיונות מתוזמנים',                                       href: '/institution/interviews'                              },
    { icon: Star,         title: 'סקרי משוב',           desc: 'תוצאות שביעות רצון לאחר שיבוץ',                              href: '/admin/surveys'                                       },
    { icon: BarChart3,    title: 'דוחות שיבוצים',       desc: 'מגמות, ייצוא ונתוני שנה',                                    href: '/admin/reports'                                       },
    { icon: Bell,         title: 'התראות מערכת',        desc: 'בקשות גישה, מועמדויות חדשות',                                href: '/admin/candidate-requests'                            },
    { icon: Upload,       title: 'ייבוא CSV',           desc: 'העלאת מועמדות בכמות',                                        href: '/admin/import'                                        },
  ]

  return (
    <div className="rounded-[14px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-5 pt-5 pb-3.5">
        <h3 className="text-[16.5px] font-bold" style={{ color: 'var(--ink)' }}>פעולות מהירות</h3>
        <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>כל מה שהמערכת עושה</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 pb-5">
        {ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              className="relative flex flex-col gap-2 p-3.5 rounded-[12px] border text-start transition-all"
              style={{ borderColor: 'var(--purple-100)', background: '#fff', textDecoration: 'none' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--purple)'
                el.style.background = 'var(--purple-050)'
                el.style.transform = 'translateY(-1px)'
                el.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--purple-100)'
                el.style.background = '#fff'
                el.style.transform = 'none'
                el.style.boxShadow = 'none'
              }}
            >
              {action.badge != null && action.badge > 0 && (
                <span
                  className="absolute top-2.5 start-2.5 min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-extrabold flex items-center justify-center"
                  style={{ background: 'var(--teal)', color: '#fff' }}
                >
                  {action.badge}
                </span>
              )}
              <span
                className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center"
                style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}
              >
                <Icon size={17} />
              </span>
              <div>
                <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{action.title}</div>
                <div className="text-[11.5px] font-medium mt-0.5 leading-snug" style={{ color: 'var(--ink-3)' }}>{action.desc}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
