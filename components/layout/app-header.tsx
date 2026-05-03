'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Bell, ChevronDown, Menu, X, KeyRound, User, Settings, LogOut, CheckCheck } from 'lucide-react'

interface Props {
  fullName: string | null
  role: string
}

interface Notif {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  'מועמדת':      'מועמדת',
  'מוסד':        'מוסד חינוך',
  'מנהל רשת':   'מנהל מערכת',
  'אדמין מערכת': 'אדמין מערכת',
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)   return 'עכשיו'
  if (diff < 3600) return `לפני ${Math.round(diff / 60)} דק׳`
  if (diff < 86400) return `לפני ${Math.round(diff / 3600)} שע׳`
  return `לפני ${Math.round(diff / 86400)} ימים`
}

const NOTIF_ICON: Record<string, string> = {
  application_viewed:   '👁',
  application_accepted: '🎉',
  application_rejected: '📋',
  interview_scheduled:  '📅',
  invitation_accepted:  '✅',
  interview_confirmed:  '✅',
}

export default function AppHeader({ fullName, role }: Props) {
  const [search, setSearch]             = useState('')
  const [menuOpen, setMenuOpen]         = useState(false)
  const [bellOpen, setBellOpen]         = useState(false)
  const [userOpen, setUserOpen]         = useState(false)
  const [notifs, setNotifs]             = useState<Notif[]>([])
  const [notifsLoaded, setNotifsLoaded] = useState(false)

  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const router  = useRouter()
  const supabase = createClient()

  const unread   = notifs.filter(n => !n.read).length
  const initials = fullName
    ? fullName.split(' ').slice(0, 2).map(w => w[0]).join('')
    : '?'

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : [])
      .then((data: Notif[]) => { setNotifs(data); setNotifsLoaded(true) })
      .catch(() => setNotifsLoaded(true))
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dashboard-sidebar-open', menuOpen)
  }, [menuOpen])

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'close') setMenuOpen(false)
    }
    window.addEventListener('sidebar-close', handler)
    return () => window.removeEventListener('sidebar-close', handler)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const profileHref = role === 'מועמדת' ? '/profile' : '/settings'
  const isAdmin = ['מנהל רשת', 'אדמין מערכת'].includes(role)

  return (
    <header
      className="dashboard-header flex items-center gap-3 px-4 md:gap-4 md:px-5"
      style={{
        background: 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 0 rgba(75,46,131,.07)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn hidden items-center justify-center w-9 h-9 rounded-[9px] shrink-0 transition-all"
        style={{
          color: 'var(--ink-3)',
          border: '1.5px solid var(--line)',
          background: menuOpen ? 'var(--bg-2)' : 'transparent',
        }}
        onClick={() => setMenuOpen(v => !v)}
        aria-label="תפריט"
      >
        {menuOpen ? <X size={16} strokeWidth={2.5} /> : <Menu size={16} strokeWidth={2.5} />}
      </button>

      {/* Brand — visible on mobile only (desktop shows sidebar) */}
      <Link
        href="/dashboard"
        className="md:hidden flex items-center gap-2 shrink-0 no-underline"
      >
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)' }}
        >
          <Image
            src="/logo-chabad.png"
            alt=""
            width={20}
            height={20}
            className="object-contain"
            style={{ filter: 'brightness(10) saturate(0)' }}
            onError={() => {}}
          />
        </div>
        <span
          className="text-[13px] font-extrabold"
          style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}
        >
          מערכת גיוס
        </span>
      </Link>

      {/* Search */}
      <div
        className="header-search flex-1 max-w-[480px] relative ms-auto md:ms-0"
        role="search"
      >
        <span
          className="absolute inset-y-0 end-3 flex items-center pointer-events-none"
          style={{ color: 'var(--ink-4)' }}
        >
          <Search size={14} strokeWidth={2.5} />
        </span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && search.trim()) {
              const base = isAdmin ? '/candidates' : '/jobs'
              router.push(`${base}?q=${encodeURIComponent(search.trim())}`)
              setSearch('')
            }
          }}
          placeholder={isAdmin ? 'חיפוש מועמדות, מוסדות, משרות…' : 'חיפוש משרות…'}
          className="w-full h-9 rounded-[9px] text-[13px] font-medium"
          style={{
            background: 'var(--bg-2)',
            border: '1.5px solid var(--line)',
            color: 'var(--ink)',
            paddingInlineEnd: '34px',
            paddingInlineStart: '12px',
          }}
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 ms-auto">

        {/* Bell */}
        <div ref={bellRef} className="relative hidden md:block">
          <button
            onClick={() => { setBellOpen(v => !v); setUserOpen(false) }}
            className="relative flex w-9 h-9 rounded-[9px] items-center justify-center transition-all"
            style={{
              color: bellOpen ? 'var(--purple)' : 'var(--ink-3)',
              background: bellOpen ? 'var(--purple-050)' : 'transparent',
              border: '1.5px solid',
              borderColor: bellOpen ? 'var(--purple-100)' : 'var(--line)',
            }}
            aria-label="התראות"
          >
            <Bell size={16} strokeWidth={2} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -start-1 flex items-center justify-center text-[9px] font-black text-white rounded-full"
                style={{
                  background: 'var(--teal)',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 3px',
                }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute top-11 end-0 w-80 rounded-[16px] overflow-hidden z-50"
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-extrabold" style={{ color: 'var(--ink)' }}>
                    התראות
                  </span>
                  {unread > 0 && (
                    <span
                      className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    style={{ color: 'var(--ink-4)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--purple)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-4)'}
                  >
                    <CheckCheck size={12} />
                    סמני הכל
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {!notifsLoaded ? (
                  <p className="text-[13px] text-center py-10" style={{ color: 'var(--ink-4)' }}>
                    טוען…
                  </p>
                ) : notifs.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell size={24} style={{ color: 'var(--ink-5)', margin: '0 auto 8px' }} />
                    <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>אין התראות</p>
                  </div>
                ) : notifs.slice(0, 15).map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: n.read ? 'transparent' : 'var(--purple-050)',
                      borderBottom: '1px solid var(--line-soft)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'var(--purple-050)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 text-[14px]"
                      style={{ background: n.read ? 'var(--bg-2)' : 'var(--purple-100)' }}
                    >
                      {NOTIF_ICON[n.type] ?? '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[12.5px] font-bold leading-tight"
                        style={{ color: 'var(--ink)' }}
                      >
                        {n.title}
                      </p>
                      <p
                        className="text-[11.5px] mt-0.5 leading-snug line-clamp-2"
                        style={{ color: 'var(--ink-3)' }}
                      >
                        {n.body}
                      </p>
                      <p className="text-[10.5px] mt-1" style={{ color: 'var(--ink-4)' }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: 'var(--purple)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 mx-1" style={{ background: 'var(--line)' }} />

        {/* User chip */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen(v => !v); setBellOpen(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] border transition-all"
            style={{
              borderColor: userOpen ? 'var(--purple-200)' : 'var(--line)',
              background: userOpen ? 'var(--purple-050)' : 'transparent',
            }}
            aria-label="תפריט משתמש"
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)' }}
            >
              {initials}
            </div>
            {/* Name */}
            <div className="hidden sm:block text-right leading-none">
              <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
                {fullName?.split(' ')[0] ?? '—'}
              </div>
              <div
                className="flex items-center gap-1 text-[10.5px] font-medium mt-0.5"
                style={{ color: 'var(--ink-4)' }}
              >
                {isAdmin && <KeyRound size={9} />}
                {ROLE_LABELS[role] ?? role}
              </div>
            </div>
            <ChevronDown
              size={13}
              className="hidden sm:block"
              style={{
                color: 'var(--ink-4)',
                transform: userOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 200ms',
              }}
            />
          </button>

          {userOpen && (
            <div
              className="absolute top-11 end-0 w-52 rounded-[14px] overflow-hidden z-50 py-1"
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <Link
                href={profileHref}
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold no-underline transition-colors"
                style={{ color: 'var(--ink)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <User size={14} style={{ color: 'var(--ink-4)' }} />
                {role === 'מועמדת' ? 'הפרופיל שלי' : 'הגדרות'}
              </Link>
              {role !== 'מועמדת' && (
                <Link
                  href="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold no-underline transition-colors"
                  style={{ color: 'var(--ink)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Settings size={14} style={{ color: 'var(--ink-4)' }} />
                  הגדרות
                </Link>
              )}
              <div className="my-1 h-px mx-3" style={{ background: 'var(--line)' }} />
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition-colors"
                style={{ color: 'var(--red)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <LogOut size={14} />
                התנתקות
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <div className="dashboard-sidebar-overlay" onClick={() => setMenuOpen(false)} />
    </header>
  )
}
