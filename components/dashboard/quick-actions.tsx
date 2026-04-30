'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Check, Search, MessageCircle, FileText, ChevronLeft } from 'lucide-react'

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
    { icon: Check,          title: 'אישור מוסד חדש',   desc: pending > 0 ? `${pending} מוסדות ממתינים לאישור` : 'אין מוסדות ממתינים', href: '/admin/institutions', badge: pending || undefined },
    { icon: Search,         title: 'חיפוש מועמדת',     desc: 'מועמדות לפי תחום ומיקום',      href: '/candidates'       },
    { icon: MessageCircle,  title: 'הודעה למועמדות',   desc: 'שליחת WhatsApp לקבוצה נבחרת', href: '/messages'         },
    { icon: FileText,       title: 'דוח חודשי',        desc: 'שיבוצים, מגמות וייצוא',        href: '/admin/reports'    },
  ]

  return (
    <div className="rounded-[14px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-3.5" style={{ paddingTop: 18 }}>
        <div className="flex-1">
          <h3 className="text-[16.5px] font-bold" style={{ color: 'var(--ink)' }}>פעולות מהירות</h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--ink-4)' }}>קיצורי דרך נפוצים</p>
        </div>
        <Link href="/dashboard"
          className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-1.5 rounded-lg transition-all no-underline"
          style={{ color: 'var(--purple)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--purple-050)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          הכל
          <ChevronLeft size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pb-5">
        {ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              className="relative flex flex-col gap-2.5 p-4 rounded-[12px] border text-start transition-all"
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
                  className="absolute top-3 start-3 min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-extrabold flex items-center justify-center"
                  style={{ background: 'var(--teal)', color: 'var(--ink)' }}
                >
                  {action.badge}
                </span>
              )}
              <span
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"
                style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}
              >
                <Icon size={20} />
              </span>
              <div>
                <div className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{action.title}</div>
                <div className="text-[12.5px] font-medium mt-0.5" style={{ color: 'var(--ink-3)' }}>{action.desc}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
