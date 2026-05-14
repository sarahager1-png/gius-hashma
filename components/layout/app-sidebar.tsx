'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Users, Briefcase, Building2, BarChart3,
  Settings, LogOut, ClipboardList, UserPlus, Sparkles,
  ShieldCheck, Mail, History, HelpCircle, MessageCircle, Send, UserCog, Inbox,
  FileStack, CalendarDays, BellRing, Upload, ScrollText, MailOpen, Star,
  BookOpen, Radio, CalendarCheck,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  badge?: number
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const NAV_GROUPS: Record<UserRole, NavGroup[]> = {
  'מועמדת': [
    {
      items: [
        { href: '/dashboard',       label: 'בית',           icon: LayoutDashboard },
      ],
    },
    {
      label: 'חיפוש ומשרות',
      items: [
        { href: '/jobs',            label: 'משרות פתוחות',  icon: Briefcase       },
        { href: '/my-applications', label: 'הגשות שלי',     icon: ClipboardList   },
        { href: '/my-invitations',  label: 'הזמנות לראיון', icon: Mail            },
        { href: '/book-interview',  label: 'קביעת ראיון',   icon: CalendarCheck   },
      ],
    },
    {
      label: 'תקשורת',
      items: [
        { href: '/inbox',           label: 'הודעות',        icon: MailOpen        },
        { href: '/notifications',   label: 'התראות',        icon: BellRing        },
        { href: '/history',         label: 'היסטוריה',      icon: History         },
      ],
    },
    {
      label: 'חשבון',
      items: [
        { href: '/profile',         label: 'הפרופיל שלי',  icon: Users           },
        { href: '/help',            label: 'הנחיות',        icon: HelpCircle      },
      ],
    },
  ],
  'מוסד': [
    {
      items: [
        { href: '/dashboard',                label: 'בית',             icon: LayoutDashboard },
      ],
    },
    {
      label: 'ניהול גיוס',
      items: [
        { href: '/institution/jobs',         label: 'משרות',           icon: Briefcase       },
        { href: '/institution/matches',      label: 'התאמות',          icon: Sparkles        },
        { href: '/institution/applications', label: 'הגשות',           icon: FileStack       },
        { href: '/institution/candidates',   label: 'מועמדות',         icon: Users           },
      ],
    },
    {
      label: 'תקשורת',
      items: [
        { href: '/institution/inquiries',    label: 'פניות',           icon: Inbox           },
        { href: '/institution/interviews',   label: 'לוח ראיונות',    icon: CalendarDays    },
        { href: '/institution/invitations',  label: 'הזמנות שנשלחו',  icon: Send            },
        { href: '/notifications',            label: 'התראות',          icon: BellRing        },
      ],
    },
    {
      label: 'חשבון',
      items: [
        { href: '/history',                  label: 'היסטוריה',        icon: History         },
        { href: '/institution/profile',      label: 'פרופיל המוסד',   icon: UserCog         },
        { href: '/settings',                 label: 'הגדרות',          icon: Settings        },
        { href: '/help',                     label: 'הנחיות',          icon: HelpCircle      },
      ],
    },
  ],
  'מנהלת מערכת': [
    {
      items: [
        { href: '/dashboard',                label: 'דשבורד ראשי',    icon: LayoutDashboard },
      ],
    },
    {
      label: 'ניווט ומיון',
      items: [
        { href: '/candidates',               label: 'מועמדות',         icon: Users           },
        { href: '/admin/matches',            label: 'שלבי המיון',      icon: Sparkles        },
        { href: '/admin/interview-slots',    label: 'ראיונות',         icon: CalendarCheck   },
        { href: '/admin/reports',            label: 'המלצות ושיבוצים', icon: BarChart3       },
      ],
    },
    {
      label: 'תפעול',
      items: [
        { href: '/admin/candidate-requests', label: 'בקשות הצטרפות',  icon: UserPlus        },
        { href: '/jobs',                     label: 'משרות',           icon: Briefcase       },
        { href: '/admin/institutions',       label: 'מוסדות',          icon: Building2       },
        { href: '/admin/surveys',            label: 'סקרי משוב',       icon: Star            },
        { href: '/admin/import',             label: 'ייבוא CSV',       icon: Upload          },
      ],
    },
    {
      label: 'תקשורת',
      items: [
        { href: '/messages',                 label: 'הודעות',          icon: MessageCircle   },
        { href: '/admin/communication',      label: 'תקשורת ותבניות', icon: Radio           },
        { href: '/admin/messages-log',       label: 'יומן הודעות',    icon: BellRing        },
      ],
    },
    {
      label: 'מערכת',
      items: [
        { href: '/admin/audit',              label: 'יומן פעולות',    icon: ScrollText      },
        { href: '/admin/admins',             label: 'מנהלי מערכת',    icon: ShieldCheck     },
        { href: '/settings',                 label: 'הגדרות',          icon: Settings        },
        { href: '/help',                     label: 'הנחיות',          icon: HelpCircle      },
      ],
    },
  ],
  'אדמין מערכת': [
    {
      items: [
        { href: '/dashboard',                label: 'דשבורד ראשי',    icon: LayoutDashboard },
      ],
    },
    {
      label: 'ניווט ומיון',
      items: [
        { href: '/candidates',               label: 'מועמדות',         icon: Users           },
        { href: '/admin/matches',            label: 'שלבי המיון',      icon: Sparkles        },
        { href: '/admin/interview-slots',    label: 'ראיונות',         icon: CalendarCheck   },
        { href: '/admin/reports',            label: 'המלצות ושיבוצים', icon: BarChart3       },
      ],
    },
    {
      label: 'תפעול',
      items: [
        { href: '/admin/candidate-requests', label: 'בקשות הצטרפות',  icon: UserPlus        },
        { href: '/jobs',                     label: 'משרות',           icon: Briefcase       },
        { href: '/admin/institutions',       label: 'מוסדות',          icon: Building2       },
        { href: '/admin/surveys',            label: 'סקרי משוב',       icon: Star            },
        { href: '/admin/import',             label: 'ייבוא CSV',       icon: Upload          },
      ],
    },
    {
      label: 'תקשורת',
      items: [
        { href: '/messages',                 label: 'הודעות',          icon: MessageCircle   },
        { href: '/admin/communication',      label: 'תקשורת ותבניות', icon: Radio           },
        { href: '/admin/messages-log',       label: 'יומן הודעות',    icon: BellRing        },
      ],
    },
    {
      label: 'מערכת',
      items: [
        { href: '/admin/audit',              label: 'יומן פעולות',    icon: ScrollText      },
        { href: '/admin/admins',             label: 'מנהלי מערכת',    icon: ShieldCheck     },
        { href: '/settings',                 label: 'הגדרות',          icon: Settings        },
        { href: '/help',                     label: 'הנחיות',          icon: HelpCircle      },
      ],
    },
  ],
}

interface Props {
  role: UserRole
  fullName: string | null
  pendingInstitutions?: number
  pendingApplications?: number
  pendingInquiries?: number
  pendingCandidateReqs?: number
}

export default function AppSidebar({
  role,
  pendingInstitutions  = 0,
  pendingApplications  = 0,
  pendingInquiries     = 0,
  pendingCandidateReqs = 0,
}: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const groups: NavGroup[] = (NAV_GROUPS[role] ?? []).map(group => ({
    ...group,
    items: group.items.map(item => {
      if (item.href === '/admin/candidate-requests' && pendingCandidateReqs > 0)
        return { ...item, badge: pendingCandidateReqs }
      if (item.href === '/admin/institutions' && pendingInstitutions > 0)
        return { ...item, badge: pendingInstitutions }
      if (item.href === '/institution/applications' && pendingApplications > 0)
        return { ...item, badge: pendingApplications }
      if (item.href === '/institution/inquiries' && pendingInquiries > 0)
        return { ...item, badge: pendingInquiries }
      return item
    }),
  }))

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const roleLabel: Record<UserRole, string> = {
    'מועמדת':       'פרופיל מועמדת',
    'מוסד':         'פרופיל מוסד',
    'מנהלת מערכת': 'ניהול מערכת',
    'אדמין מערכת': 'ניהול מערכת',
  }

  return (
    <aside className="dashboard-sidebar flex flex-col" dir="rtl">

      {/* ── Brand ── */}
      <div className="shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <Link href="/dashboard" className="no-underline block" style={{ padding: '18px 16px 14px' }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="rounded-[14px] shrink-0 overflow-hidden flex items-center justify-center"
              style={{
                width: '52px', height: '52px',
                background: 'rgba(255,255,255,.95)',
                border: '1px solid rgba(255,255,255,.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,.25), 0 1px 4px rgba(0,0,0,.2)',
              }}
            >
              <Image
                src="/logo-chabad.png"
                alt="רשת חינוך חב״ד"
                width={42} height={42}
                className="object-contain"
                style={{ display: 'block' }}
                onError={() => {}}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{
                fontSize: '17px', fontWeight: 900,
                color: '#ffffff', letterSpacing: '-.03em',
                lineHeight: 1.2,
              }}>
                עתודות לשליחות
              </div>
              <div style={{
                fontSize: '10.5px', fontWeight: 600,
                color: 'rgba(212,176,106,.7)',
                letterSpacing: '.03em',
                marginTop: '3px',
              }}>
                רשת אהלי יוסף יצחק
              </div>
            </div>
          </div>

          {/* Role pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px',
            borderRadius: '8px',
            background: 'rgba(0,167,181,.15)',
            border: '1px solid rgba(0,167,181,.25)',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#00D4E8',
              boxShadow: '0 0 6px rgba(0,212,232,.7)',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '11px', fontWeight: 700,
              color: 'rgba(0,212,232,.9)',
              letterSpacing: '.02em',
            }}>
              {roleLabel[role]}
            </span>
          </div>
        </Link>

        {/* Brand gradient line */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, rgba(75,46,131,0) 0%, rgba(75,46,131,.6) 30%, rgba(0,167,181,.8) 70%, rgba(0,167,181,0) 100%)',
        }} />
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 10px' }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: group.label ? '4px' : '8px' }}>
            {group.label && (
              <p style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.22)',
                padding: '8px 10px 5px',
                margin: 0,
              }}>
                {group.label}
              </p>
            )}
            <ul className="list-none p-0 m-0 flex flex-col" style={{ gap: '1px' }}>
              {group.items.map(item => (
                <NavItemRow key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0" style={{
        borderTop: '1px solid rgba(255,255,255,.06)',
        padding: '10px 10px 14px',
      }}>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 rounded-[10px] transition-all"
          style={{
            padding: '9px 12px',
            fontSize: '13px', fontWeight: 600,
            color: 'rgba(255,255,255,.35)',
            background: 'transparent',
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,60,60,.12)'
            e.currentTarget.style.color = '#FF8080'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,.35)'
          }}
        >
          <LogOut size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
  )
}

function NavItemRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  function handleClick() {
    window.dispatchEvent(new CustomEvent('sidebar-close', { detail: 'close' }))
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={handleClick}
        className="flex items-center gap-2.5 no-underline transition-all"
        style={{
          padding: '8px 10px',
          borderRadius: '10px',
          fontSize: '13.5px',
          fontWeight: active ? 700 : 500,
          position: 'relative',
          ...(active ? {
            background: 'linear-gradient(90deg, rgba(0,167,181,.2) 0%, rgba(255,255,255,.07) 100%)',
            color: '#ffffff',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07)',
            borderInlineEnd: '3px solid #00D4E8',
          } : {
            color: 'rgba(255,255,255,.52)',
            background: 'transparent',
          }),
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = 'rgba(255,255,255,.07)'
            e.currentTarget.style.color = 'rgba(255,255,255,.85)'
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,.52)'
          }
        }}
      >
        {/* Icon */}
        <span style={{
          flexShrink: 0, display: 'flex',
          color: active ? '#00D4E8' : 'rgba(255,255,255,.28)',
          filter: active ? 'drop-shadow(0 0 5px rgba(0,167,181,.55))' : 'none',
          transition: 'color 150ms, filter 150ms',
        }}>
          <Icon size={15} strokeWidth={active ? 2.5 : 2} />
        </span>

        {/* Label */}
        <span className="truncate flex-1">{item.label}</span>

        {/* Badge */}
        {item.badge != null && item.badge > 0 && (
          <span style={{
            marginInlineStart: 'auto',
            fontSize: '10.5px', fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '100px',
            background: '#00A7B5',
            color: '#fff',
            minWidth: '20px',
            textAlign: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,167,181,.4)',
          }}>
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  )
}
