'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Briefcase, FileText, User, Search,
  Building2, Users, BarChart3, LogOut, Menu, X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = NAV_BY_ROLE[role] ?? []

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#5B3AAB] to-[#3D2480]">
      {/* Logo */}
      <div
        className="flex flex-col items-center px-5 py-5 gap-2"
        style={{
          background: 'linear-gradient(135deg, #4A2D90 0%, #5B3AAB 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.3)',
        }}
      >
        <Image
          src="/logo-chabad.png"
          alt="רשת אהלי יוסף יצחק"
          width={140}
          height={56}
          className="object-contain brightness-[5] opacity-95"
        />
        <div
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: '#C9A84C' }}
        >
          גיוס והשמה
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 group',
                isActive
                  ? 'text-[#1A0A3C] shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')}
              style={isActive
                ? { background: 'linear-gradient(90deg, #C9A84C, #F0D080)', boxShadow: '0 2px 12px rgba(201,168,76,0.4)' }
                : {}}
            >
              <Icon className={['h-4 w-4 transition-all', isActive ? 'text-[#1A0A3C]' : 'text-white/60 group-hover:text-white'].join(' ')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="px-3 py-2 mb-1">
          <div className="text-white text-sm font-semibold truncate">{fullName ?? '—'}</div>
          <div className="text-white/40 text-xs">{role}</div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          <span>התנתקות</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-[#5B3AAB] text-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={[
          'fixed top-0 right-0 z-50 h-full w-64 shadow-2xl transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex h-full w-60 flex-shrink-0 flex-col overflow-y-auto"
        style={{ boxShadow: '4px 0 24px rgba(201,168,76,0.25), 2px 0 8px rgba(201,168,76,0.15)' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
