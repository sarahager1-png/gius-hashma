'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Users, Briefcase, Building2, BarChart3,
  Settings, LogOut, ClipboardList, KeyRound, UserPlus, Sparkles,
  ShieldCheck, Mail, History, HelpCircle, MessageCircle, Send, UserCog, Inbox,
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
    { href: '/history',         label: 'היסטוריה',       icon: History         },
    { href: '/profile',         label: 'הפרופיל שלי',   icon: Users           },
    { href: '/help',            label: 'הנחיות',         icon: HelpCircle      },
  ],
  'מוסד': [
    { href: '/dashboard',                  label: 'בית',              icon: LayoutDashboard },
    { href: '/institution/jobs',           label: 'משרות',            icon: Briefcase       },
    { href: '/institution/candidates',     label: 'מועמדות',          icon: Users           },
    { href: '/institution/inquiries',      label: 'פניות',            icon: Inbox           },
    { href: '/institution/invitations',    label: 'הזמנות שנשלחו',   icon: Send            },
    { href: '/history',                    label: 'היסטוריה',         icon: History         },
    { href: '/institution/profile',        label: 'פרופיל המוסד',    icon: UserCog         },
    { href: '/help',                       label: 'הנחיות',           icon: HelpCircle      },
  ],
  'מנהל רשת': [
    { href: '/dashboard',                label: 'בית',           icon: LayoutDashboard },
    { href: '/admin/candidate-requests', label: 'בקשות הצטרפות', icon: UserPlus        },
    { href: '/admin/matches',            label: 'התאמות',        icon: Sparkles        },
    { href: '/candidates',               label: 'מועמדות',       icon: Users           },
    { href: '/jobs',                     label: 'משרות',         icon: Briefcase       },
    { href: '/admin/institutions',       label: 'מוסדות',        icon: Building2       },
    { href: '/messages',                 label: 'הודעות',        icon: MessageCircle   },
    { href: '/admin/reports',            label: 'דוחות שיבוצים', icon: BarChart3       },
    { href: '/admin/access-codes',       label: 'קודי גישה',     icon: KeyRound        },
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
    { href: '/admin/reports',            label: 'דוחות שיבוצים', icon: BarChart3       },
    { href: '/admin/access-codes',       label: 'קודי גישה',     icon: KeyRound        },
    { href: '/admin/admins',             label: 'מנהלי מערכת',   icon: ShieldCheck     },
    { href: '/settings',                 label: 'הגדרות',        icon: Settings        },
    { href: '/help',                     label: 'הנחיות',        icon: HelpCircle      },
  ],
}

interface Props {
  role: UserRole
  fullName: string | null
  pendingInstitutions?: number
}

export default function AppSidebar({ role, fullName: _fullName, pendingInstitutions = 0 }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const main = (NAV_MAIN[role] ?? []).map(item =>
    item.href === '/admin/institutions' && pendingInstitutions > 0
      ? { ...item, badge: pendingInstitutions }
      : item
  )

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
      {/* Brand top strip */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #00A7B5 100%)' }}
      />

      {/* Logo — dominant identity anchor */}
      <div
        className="px-3 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}
      >
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-[14px]"
          style={{ background: 'rgba(255,255,255,.07)' }}
        >
          <div
            className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,.12)' }}
          >
            <Image
              src="/logo-chabad.png"
              alt="רשת חינוך חבד"
              width={34}
              height={34}
              className="object-contain"
              style={{ filter: 'brightness(10) saturate(0)' }}
              onError={() => {}}
            />
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] font-black leading-tight truncate"
              style={{ color: '#fff', letterSpacing: '-.02em' }}
            >
              מערכת גיוס
            </div>
            <div
              className="text-[11px] font-bold mt-0.5 truncate"
              style={{ color: '#00A7B5', letterSpacing: '.04em' }}
            >
              גיוס והשמה
            </div>
          </div>
        </div>
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
          מערכת עלייה · תשפ״ה–תשפ״ו
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
