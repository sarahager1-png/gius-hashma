'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, Download, Building2, Calendar, KeyRound, Eye, EyeOff, CheckCircle, Trash2 } from 'lucide-react'
import type { UserRole } from '@/lib/types'
import PushToggle from '@/components/push-toggle'

interface SettingItem {
  icon: React.ComponentType<{ size?: number }>
  title: string
  desc: string
  action: 'link' | 'export-placements' | 'export-candidates'
  href?: string
  label: string
  roles: UserRole[]
}

const ITEMS: SettingItem[] = [
  {
    icon: Building2,
    title: 'פרופיל מערכת',
    desc: 'שם הרשת, לוגו, פרטי יצירת קשר',
    action: 'link',
    href: '/profile',
    label: 'עריכה',
    roles: ['מנהלת מערכת', 'אדמין מערכת'],
  },
  {
    icon: Users,
    title: 'ניהול משתמשים',
    desc: 'הוספת מנהלים, עריכת הרשאות',
    action: 'link',
    href: '/admin/admins',
    label: 'ניהול',
    roles: ['מנהלת מערכת', 'אדמין מערכת'],
  },
  {
    icon: MessageCircle,
    title: 'הודעות למועמדות',
    desc: 'שליחת הודעת WhatsApp לקבוצת מועמדות',
    action: 'link',
    href: '/messages',
    label: 'פתחי',
    roles: ['מנהלת מערכת', 'אדמין מערכת'],
  },
  {
    icon: Calendar,
    title: 'שנת הכשרה',
    desc: 'הגדרת תאריכי שנת תשפ״ה–תשפ״ו',
    action: 'link',
    href: '/admin/reports',
    label: 'דוחות',
    roles: ['מנהלת מערכת', 'אדמין מערכת'],
  },
  {
    icon: Download,
    title: 'ייצוא שיבוצים (CSV)',
    desc: 'הורדת כל השיבוצים המאושרים לקובץ Excel',
    action: 'export-placements',
    label: 'ייצוא',
    roles: ['מנהלת מערכת', 'אדמין מערכת'],
  },
  {
    icon: Download,
    title: 'ייצוא מועמדות (CSV)',
    desc: 'הורדת כל מאגר המועמדות לקובץ Excel',
    action: 'export-candidates',
    label: 'ייצוא',
    roles: ['מנהלת מערכת', 'אדמין מערכת'],
  },
]

interface Props { role: UserRole }

export default function SettingsClient({ role }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [oldPw, setOldPw]           = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showOld, setShowOld]       = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwError, setPwError]       = useState('')
  const [pwSuccess, setPwSuccess]   = useState(false)

  // Account deletion state
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError]     = useState('')

  const visibleItems = ITEMS.filter(i => i.roles.includes(role))

  function handleAction(item: SettingItem) {
    if (item.action === 'link' && item.href) {
      router.push(item.href)
    } else if (item.action === 'export-placements') {
      window.open('/api/admin/reports/export?type=placements', '_blank')
    } else if (item.action === 'export-candidates') {
      window.open('/api/admin/reports/export?type=candidates', '_blank')
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPw.length < 8) {
      setPwError('הסיסמה החדשה חייבת להכיל לפחות 8 תווים')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('הסיסמאות אינן תואמות')
      return
    }

    setPwLoading(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email ?? '',
      password: oldPw,
    })
    if (signInErr) {
      setPwError('הסיסמה הנוכחית שגויה')
      setPwLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) {
      setPwError('שגיאה בעדכון הסיסמה')
    } else {
      setPwSuccess(true)
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'מחק') return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setDeleteError(d.error ?? 'שגיאה במחיקת החשבון')
        setDeleteLoading(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      setDeleteError('שגיאה בלתי צפויה')
      setDeleteLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '40px', padding: '0 40px 0 12px',
    borderRadius: '10px', border: '1.5px solid var(--line)',
    fontSize: '14px', outline: 'none', background: 'var(--bg-2)',
    color: 'var(--ink)', fontFamily: 'inherit', transition: 'all .15s',
    direction: 'ltr',
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="page-title mb-1">הגדרות</h1>
      <span className="brand-line mb-6 block" />

      {/* Push notifications */}
      <div
        className="rounded-[14px] border p-5 mb-6"
        style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}
      >
        <PushToggle />
      </div>

      {/* Password change — visible to all roles */}
      <div
        className="rounded-[14px] border p-5 mb-6"
        style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
            <KeyRound size={18} />
          </div>
          <div>
            <div className="font-bold text-[15px]" style={{ color: 'var(--ink)' }}>שינוי סיסמה</div>
            <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>עדכני את הסיסמה לחשבון שלך</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="flex items-center gap-2 rounded-[10px] p-3 mb-4 text-[13px] font-semibold"
            style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
            <CheckCircle size={15} />
            הסיסמה עודכנה בהצלחה
          </div>
        )}
        {pwError && (
          <div className="rounded-[10px] p-3 mb-4 text-[13px] font-semibold"
            style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--ink-2)' }}>סיסמה נוכחית</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'white' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg-2)' }}
              />
              <button type="button" onClick={() => setShowOld(p => !p)}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 0, display: 'flex' }}>
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--ink-2)' }}>סיסמה חדשה</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                placeholder="לפחות 8 תווים"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'white' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg-2)' }}
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 0, display: 'flex' }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--ink-2)' }}>אימות סיסמה חדשה</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                placeholder="••••••••"
                style={{ ...inputStyle, padding: '0 12px' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'white' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg-2)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="h-10 rounded-[10px] text-[13.5px] font-bold text-white transition-all"
            style={{
              background: pwLoading ? 'var(--ink-4)' : 'var(--purple)',
              boxShadow: pwLoading ? 'none' : '0 4px 12px rgba(91,58,171,.25)',
            }}
          >
            {pwLoading ? 'מעדכן...' : 'עדכני סיסמה'}
          </button>
        </form>
      </div>

      {/* Role-specific admin items */}
      {visibleItems.length > 0 && (
        <div className="space-y-3">
          {visibleItems.map(item => {
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
      )}

      {/* Danger zone — account deletion */}
      <div
        className="rounded-[14px] border p-5 mt-6"
        style={{ background: '#FFF5F5', borderColor: '#FCA5A5', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <Trash2 size={18} />
          </div>
          <div>
            <div className="font-bold text-[15px]" style={{ color: '#DC2626' }}>מחיקת חשבון</div>
            <p className="text-[13px] mt-0.5" style={{ color: '#9F1239' }}>פעולה זו בלתי הפיכה — כל הנתונים ימחקו לצמיתות</p>
          </div>
        </div>

        {deleteError && (
          <div className="rounded-[10px] p-3 mb-3 text-[13px] font-semibold"
            style={{ background: '#FEE2E2', color: '#DC2626' }}>
            {deleteError}
          </div>
        )}

        <label className="block text-[12px] font-bold mb-1.5" style={{ color: '#9F1239' }}>
          לאישור מחיקה, הקלידי &quot;מחק&quot;
        </label>
        <input
          type="text"
          value={deleteConfirm}
          onChange={e => setDeleteConfirm(e.target.value)}
          placeholder='מחק'
          className="w-full h-10 px-3 rounded-[10px] border text-[14px] outline-none mb-3"
          style={{
            borderColor: '#FCA5A5',
            background: '#fff',
            color: 'var(--ink)',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'מחק' || deleteLoading}
          className="h-10 px-5 rounded-[10px] text-[13.5px] font-bold text-white transition-all"
          style={{
            background: deleteConfirm === 'מחק' && !deleteLoading ? '#DC2626' : '#FCA5A5',
            cursor: deleteConfirm === 'מחק' && !deleteLoading ? 'pointer' : 'not-allowed',
          }}
        >
          {deleteLoading ? 'מוחק...' : 'מחקי את החשבון שלי לצמיתות'}
        </button>
      </div>

      <p className="text-[12px] font-medium mt-8" style={{ color: 'var(--ink-4)' }}>
        גיוס והשמה · רשת אהלי יוסף יצחק · גרסה 1.0
      </p>
    </div>
  )
}
