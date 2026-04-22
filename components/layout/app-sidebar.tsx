'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Briefcase, FileText, User, Search,
  Building2, Users, CheckSquare, BarChart3, LogOut,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  'מועמדת': [
    { href: '/dashboard', label: 'ראשי', icon: LayoutDashboard },
    { href: '/jobs', label: 'משרות', icon: Briefcase },
    { href: '/my-applications', label: 'הגשות שלי', icon: FileText },
    { href: '/profile', label: 'הפרופיל שלי', icon: User },
  ],
  'מוסד': [
    { href: '/dashboard', label: 'ראשי', icon: LayoutDashboard },
    { href: '/institution/jobs', label: 'המשרות שלי', icon: Briefcase },
    { href: '/institution/candidates', label: 'חיפוש מועמדות', icon: Search },
  ],
  'מנהל רשת': [
    { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { href: '/admin/institutions', label: 'מוסדות', icon: Building2 },
    { href: '/admin/candidates', label: 'מועמדות', icon: Users },
    { href: '/admin/reports', label: 'דוחות', icon: BarChart3 },
  ],
  'אדמין מערכת': [
    { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { href: '/admin/institutions', label: 'מוסדות', icon: Building2 },
    { href: '/admin/candidates', label: 'מועמדות', icon: Users },
    { href: '/admin/reports', label: 'דוחות', icon: BarChart3 },
  ],
}

interface Props {
  role: UserRole
  fullName: string | null
}

export default function AppSidebar({ role, fullName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const nav = NAV_BY_ROLE[role] ?? []

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-60 min-h-screen flex flex-col"
      style={{ background: '#5B3AAB' }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="text-white font-bold text-lg">גיוס והשמה</div>
        <div className="text-white/50 text-xs mt-0.5">רשת שלוחי חב"ד</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-white/70 text-xs mb-1">{role}</div>
        <div className="text-white text-sm font-medium truncate mb-3">{fullName ?? '—'}</div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <LogOut size={15} />
          יציאה
        </button>
      </div>
    </aside>
  )
}
