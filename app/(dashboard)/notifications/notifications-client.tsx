'use client'

import { useState } from 'react'
import { Bell, BellOff, Check, CheckCheck } from 'lucide-react'
import { Notification } from '@/lib/types'

function fmtDt(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `היום · ${time}`
  if (diffDays === 1) return `אתמול · ${time}`
  if (diffDays < 7) return `לפני ${diffDays} ימים · ${time}`
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = []
  const map = new Map<string, Notification[]>()

  for (const n of notifications) {
    const d = new Date(n.created_at)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
    let label: string
    if (diffDays === 0) label = 'היום'
    else if (diffDays === 1) label = 'אתמול'
    else if (diffDays < 7) label = 'השבוע'
    else if (diffDays < 30) label = 'החודש'
    else label = d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })

    if (!map.has(label)) {
      map.set(label, [])
      groups.push({ label, items: map.get(label)! })
    }
    map.get(label)!.push(n)
  }
  return groups
}

interface Props {
  notifications: Notification[]
}

export default function NotificationsClient({ notifications: initial }: Props) {
  const [items, setItems] = useState<Notification[]>(initial)
  const [marking, setMarking] = useState(false)

  const unreadCount = items.filter(n => !n.read).length

  async function markOne(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function markAll() {
    setMarking(true)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setMarking(false)
  }

  const groups = groupByDate(items)

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">התראות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} לא נקראו` : 'הכל נקרא'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            disabled={marking}
            className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
            style={{ background: 'var(--purple)', color: '#fff', opacity: marking ? 0.6 : 1 }}
          >
            <CheckCheck size={15} />
            {marking ? 'מסמן...' : 'סמן הכל כנקרא'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-[16px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <BellOff size={40} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-3)' }}>אין התראות</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>
            התראות חדשות יופיעו כאן
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[11px] font-bold tracking-[.1em] uppercase px-2 py-1 rounded-md"
                  style={{ background: 'var(--surface-2, #F4F4F5)', color: 'var(--ink-3)' }}
                >
                  {group.label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
              </div>

              <div className="space-y-2">
                {group.items.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-[12px] border p-4 transition-all"
                    style={{
                      background: n.read ? '#fff' : '#F5F3FF',
                      borderColor: n.read ? 'var(--line)' : 'var(--purple)',
                      borderRight: `3px solid ${n.read ? 'var(--line)' : 'var(--purple)'}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 mt-0.5"
                      style={{
                        width: 32,
                        height: 32,
                        background: n.read ? '#F4F4F5' : '#EDE9FE',
                        color: n.read ? 'var(--ink-4)' : 'var(--purple)',
                      }}
                    >
                      <Bell size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[14px] font-bold"
                        style={{ color: n.read ? 'var(--ink-3)' : 'var(--ink)' }}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                          {n.body}
                        </p>
                      )}
                      <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-4)' }}>
                        {fmtDt(n.created_at)}
                      </p>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() => markOne(n.id)}
                        title="סמן כנקרא"
                        className="flex items-center justify-center rounded-full shrink-0 transition-all hover:opacity-80"
                        style={{
                          width: 28,
                          height: 28,
                          background: '#EDE9FE',
                          color: 'var(--purple)',
                        }}
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
