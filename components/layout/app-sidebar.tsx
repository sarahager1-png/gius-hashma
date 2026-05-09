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
  FileStack, CalendarDays, BellRing,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  badge?: number
}

const NAV_MAIN: Record<UserRole, NavItem[]> = {
  'מועמדת': [
    { href: '/dashboard',       label: 'בית',            icon: LayoutDashboard },
    { href: '/jobs',            label: 'משרות',          icon: Briefcase       },
    { href: '/my-applications', label: 'הגשות שלי',      icon: ClipboardList   },
    { href: '/my-invitations',  label: 'הזמנות לראיון',  icon: Mail            },
    { href: '/notifications',   label: 'התראות',         icon: BellRing        },
    { href: '/history',         label: 'היסטוריה',       icon: History         },
    { href: '/profile',         label: 'הפרופיל שלי',   icon: Users           },
    { href: '/help',            label: 'הנחיות',         icon: HelpCircle      },
  ],
  'מוסד': [
    { href: '/dashboard',                   label: 'בית',              icon: LayoutDashboard },
    { href: '/institution/jobs',            label: 'משרות',            icon: Briefcase       },
    { href: '/institution/matches',         label: 'התאמות',           icon: Sparkles        },
    { href: '/institution/applications',    label: 'הגשות',            icon: FileStack       },
    { href: '/institution/candidates',      label: 'מועמדות',          icon: Users           },
    { href: '/institution/inquiries',       label: 'פניות',            icon: Inbox           },
    { href: '/institution/interviews',       label: 'לוח ראיונות',     icon: CalendarDays    },
    { href: '/institution/invitations',     label: 'הזמנות שנשלחו',   icon: Send            },
    { href: '/notifications',                label: 'התראות',           icon: BellRing        },
    { href: '/history',                     label: 'היסטוריה',         icon: History         },
    { href: '/institution/profile',         label: 'פרופיל המוסד',    icon: UserCog         },
    { href: '/settings',                    label: 'הגדרות',           icon: Settings        },
    { href: '/help',                        label: 'הנחיות',           icon: HelpCircle      },
  ],
  'מנהלת מערכת': [
    { href: '/dashboard',                label: 'בית',           icon: LayoutDashboard },
    { href: '/admin/candidate-requests', label: 'בקשות הצטרפות', icon: UserPlus        },
    { href: '/admin/matches',            label: 'התאמות',        icon: Sparkles        },
    { href: '/candidates',               label: 'מועמדות',       icon: Users           },
    { href: '/jobs',                     label: 'משרות',         icon: Briefcase       },
    { href: '/admin/institutions',       label: 'מוסדות',        icon: Building2       },
    { href: '/messages',                 label: 'הודעות',        icon: MessageCircle   },
    { href: '/admin/messages-log',       label: 'יומן הודעות',   icon: BellRing        },
    { href: '/admin/reports',            label: 'דוחות שיבוצים', icon: BarChart3       },
    { href: '/admin/admins',             label: 'מנהלי מערכת',   icon: ShieldCheck     },
    { href: '/settings',                 label: 'הגדרות',        icon: Settings        },
    { href: '/help',                     label: 'הנחיות',        icon: HelpCircle      },
  ],
  'אדמין מערכת': [
    { href: '/dashboard',                label: 'בית',           icon: LayoutDashboard },
    { href: '/admin/candidate-requests', label: 'בקשות הצטרפות', icon: UserPlus        },
    { href: '/admin/matches',            label: 'התאמות',        icon: Sparkles        },
    { href: '/candidates',               label: 'מועמדות',       icon: Users           },
    { href: '/jobs',                     label: 'משרות',         icon: Briefcase       },
    { href: '/admin/institutions',       label: 'מוסדות',        icon: Building2       },
    { href: '/messages',                 label: 'הודעות',        icon: MessageCircle   },
    { href: '/admin/messages-log',       label: 'יומן הודעות',   icon: BellRing        },
    { href: '/admin/reports',            label: 'דוחות שיבוצים', icon: BarChart3       },
    { href: '/admin/admins',             label: 'מנהלי מערכת',   icon: ShieldCheck     },
    { href: '/settings',                 label: 'הגדרות',        icon: Settings        },
    { href: '/help',                     label: 'הנחיות',        icon: HelpCircle      },
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

  const main = (NAV_MAIN[role] ?? []).map(item => {
    if (item.href === '/admin/candidate-requests' && pendingCandidateReqs > 0)
      return { ...item, badge: pendingCandidateReqs }
    if (item.href === '/admin/institutions' && pendingInstitutions > 0)
      return { ...item, badge: pendingInstitutions }
    if (item.href === '/institution/applications' && pendingApplications > 0)
      return { ...item, badge: pendingApplications }
    if (item.href === '/institution/inquiries' && pendingInquiries > 0)
      return { ...item, badge: pendingInquiries }
    return item
  })

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="dashboard-sidebar flex flex-col" dir="rtl">
      {/* Brand */}
      <div
        className="px-4 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3 no-underline">
          {/* Logo container */}
          <div
            className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Image
              src="/logo-chabad.png"
              alt="רשת אהלי יוסף יצחק"
              width={30}
              height={30}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
              onError={() => {}}
            />
          </div>
          {/* Text */}
          <div className="min-w-0">
            <div
              className="font-black leading-tight truncate"
              style={{ fontSize: '16px', color: '#fff', letterSpacing: '-.025em' }}
            >
              מערכת גיוס
            </div>
            <div
              className="font-semibold mt-0.5 truncate"
              style={{ fontSize: '11px', color: 'rgba(255,255,255,.42)', letterSpacing: '.01em' }}
            >
              רשת אהלי יוסף יצחק
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p
          className="text-[9.5px] font-bold tracking-[.16em] uppercase px-2 mb-2.5"
          style={{ color: 'rgba(255,255,255,.25)' }}
        >
          ניווט
        </p>
        <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
          {main.map(item => (
            <NavItemRow key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </ul>
      </nav>

      {/* Footer — logout */}
      <div
        className="px-3 pb-5 pt-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}
      >
        <div
          className="text-[10px] font-semibold mb-3 px-2"
          style={{ color: 'rgba(255,255,255,.2)' }}
        >
          מערכת עלייה · תשפ״ו–תשפ״ז
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all"
          style={{
            color: 'rgba(255,255,255,.4)',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,60,60,.15)'
            e.currentTarget.style.color = '#FF6B6B'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,.4)'
          }}
        >
          <LogOut size={15} strokeWidth={2} />
          התנתקות
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
        className="flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13.5px] font-semibold no-underline transition-all"
        style={active ? {
          background: 'linear-gradient(90deg, rgba(0,167,181,.18) 0%, rgba(255,255,255,.10) 100%)',
          color: '#ffffff',
          fontWeight: 700,
          borderInlineEnd: '4px solid #00A7B5',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.1)',
        } : {
          color: 'rgba(255,255,255,.58)',
          background: 'transparent',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = 'rgba(255,255,255,.09)'
            e.currentTarget.style.color = 'rgba(255,255,255,.90)'
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,.58)'
          }
        }}
      >
        <span style={{
          flexShrink: 0,
          display: 'flex',
          color: active ? '#00D4E8' : 'rgba(255,255,255,.32)',
          transition: 'color 150ms',
          filter: active ? 'drop-shadow(0 0 4px rgba(0,167,181,.6))' : 'none',
        }}>
          <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        </span>
        <span className="truncate">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span
            className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: 'var(--teal)',
              color: '#fff',
              minWidth: '18px',
              textAlign: 'center',
            }}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  )
}
