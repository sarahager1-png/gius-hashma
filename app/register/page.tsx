'use client'

import Image from 'next/image'
import { GraduationCap, School, ShieldCheck } from 'lucide-react'

const ROLES = [
  {
    href: '/register/candidate',
    icon: GraduationCap,
    title: 'מועמדת',
    description: "מחפשת סטאג' או משרה בבית ספר יסודי ברשת",
    bg: 'var(--teal-050)',
    color: 'var(--teal-600)',
    border: 'var(--teal-100)',
  },
  {
    href: '/register/institution',
    icon: School,
    title: 'מוסד',
    description: 'בית ספר יסודי המחפש מועמדות',
    bg: 'var(--purple-050)',
    color: 'var(--purple)',
    border: 'var(--purple-100)',
  },
  {
    href: '/register/admin',
    icon: ShieldCheck,
    title: 'מנהל מערכת',
    description: 'כניסה לצוות המטה בלבד — נדרש אישור',
    bg: '#FEF3E2',
    color: 'var(--amber)',
    border: '#FDE8C4',
  },
]

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      dir="rtl"
      style={{ background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="rounded-[24px] overflow-hidden" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.13)', border: '1px solid var(--line)' }}>
          <div className="h-[5px]" style={{ background: 'linear-gradient(90deg, var(--purple), var(--teal))' }} />

          {/* Logo */}
          <div className="flex flex-col items-center pt-7 pb-5 px-8">
            <div className="w-14 h-14 rounded-[16px] mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', boxShadow: '0 4px 16px rgba(91,58,171,.25)' }}>
              <Image src="/logo-chabad.png" alt="רשת אהלי יוסף יצחק" width={36} height={36} className="object-contain brightness-[10]" />
            </div>
            <div className="text-[11px] font-semibold tracking-wide text-center mb-0.5" style={{ color: 'var(--ink-4)', letterSpacing: '.04em' }}>
              רשת אהלי יוסף יצחק לובאוויטש
            </div>
            <div className="text-[17px] font-extrabold text-center" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
              הרשמה למערכת
            </div>
          </div>

          <div className="mx-8 h-px" style={{ background: 'var(--line)' }} />

          {/* Role cards */}
          <div className="px-8 py-6 space-y-3">
            <p className="text-[12.5px] font-bold mb-4" style={{ color: 'var(--ink-3)' }}>בחרי את סוג ההרשמה:</p>
            {ROLES.map(role => {
              const Icon = role.icon
              return (
                <a
                  key={role.href}
                  href={role.href}
                  className="flex items-center gap-4 p-4 rounded-[14px] no-underline transition-all"
                  style={{ background: role.bg, border: `1.5px solid ${role.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = role.color; e.currentTarget.style.transform = 'translateX(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = role.border; e.currentTarget.style.transform = 'none' }}
                >
                  <div className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                    style={{ background: '#fff', color: role.color, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{role.title}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{role.description}</div>
                  </div>
                  <span className="text-[18px]" style={{ color: 'var(--ink-4)' }}>‹</span>
                </a>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>
              כבר רשומה?{' '}
              <a href="/login" className="font-bold" style={{ color: 'var(--purple)' }}>כניסה למערכת ←</a>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[11.5px]" style={{ color: 'var(--ink-4)' }}>
          © 2025 רשת חינוך חב״ד
        </p>
      </div>
    </div>
  )
}
