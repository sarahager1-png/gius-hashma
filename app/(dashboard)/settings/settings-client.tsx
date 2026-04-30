'use client'

import { useRouter } from 'next/navigation'
import { Users, MessageCircle, Download, Building2, Calendar } from 'lucide-react'

interface SettingItem {
  icon: React.ComponentType<{ size?: number }>
  title: string
  desc: string
  action: 'link' | 'export-placements' | 'export-candidates'
  href?: string
  label: string
}

const ITEMS: SettingItem[] = [
  {
    icon: Building2,
    title: 'פרופיל מערכת',
    desc: 'שם הרשת, לוגו, פרטי יצירת קשר',
    action: 'link',
    href: '/profile',
    label: 'עריכה',
  },
  {
    icon: Users,
    title: 'ניהול משתמשים',
    desc: 'הוספת מנהלים, עריכת הרשאות',
    action: 'link',
    href: '/admin/admins',
    label: 'ניהול',
  },
  {
    icon: MessageCircle,
    title: 'הודעות למועמדות',
    desc: 'שליחת הודעת WhatsApp לקבוצת מועמדות',
    action: 'link',
    href: '/messages',
    label: 'פתחי',
  },
  {
    icon: Calendar,
    title: 'שנת הכשרה',
    desc: 'הגדרת תאריכי שנת תשפ״ה–תשפ״ו',
    action: 'link',
    href: '/admin/reports',
    label: 'דוחות',
  },
  {
    icon: Download,
    title: 'ייצוא שיבוצים (CSV)',
    desc: 'הורדת כל השיבוצים המאושרים לקובץ Excel',
    action: 'export-placements',
    label: 'ייצוא',
  },
  {
    icon: Download,
    title: 'ייצוא מועמדות (CSV)',
    desc: 'הורדת כל מאגר המועמדות לקובץ Excel',
    action: 'export-candidates',
    label: 'ייצוא',
  },
]

export default function SettingsClient() {
  const router = useRouter()

  function handleAction(item: SettingItem) {
    if (item.action === 'link' && item.href) {
      router.push(item.href)
    } else if (item.action === 'export-placements') {
      window.location.href = '/api/admin/reports/export?type=placements'
    } else if (item.action === 'export-candidates') {
      window.location.href = '/api/admin/reports/export?type=candidates'
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="page-title mb-1">הגדרות</h1>
      <span className="brand-line mb-6 block" />

      <div className="space-y-3">
        {ITEMS.map(item => {
          const Icon = item.icon
          return (
            <div key={item.title}
              className="rounded-[14px] border p-5 flex items-center gap-4"
              style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px]" style={{ color: 'var(--ink)' }}>{item.title}</div>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{item.desc}</p>
              </div>
              <button
                onClick={() => handleAction(item)}
                className="h-9 px-4 rounded-[10px] border text-[13px] font-semibold transition-all shrink-0"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)' }}
              >
                {item.label}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-[12px] font-medium mt-8" style={{ color: 'var(--ink-4)' }}>
        גיוס והשמה · רשת אהלי יוסף יצחק · גרסה 1.0
      </p>
    </div>
  )
}
