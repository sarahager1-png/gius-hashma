'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, CheckCircle, Phone } from 'lucide-react'

const WA_LINK = `https://wa.me/972503339770?text=${encodeURIComponent('שלום, המוסד שלנו נרשם למערכת הגיוס ואנחנו ממתינים לאישור')}`

export default function InstitutionPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(94,61,174,.10) 0%, transparent 60%), var(--bg)', fontFamily: 'Heebo, system-ui, sans-serif' }}>
      <div className="bg-white rounded-[24px] p-8 w-full max-w-sm text-center"
        style={{ boxShadow: '0 20px 60px rgba(15,11,35,.12)', border: '1px solid var(--line)' }}>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="rounded-2xl bg-white p-2.5 shadow-sm border border-purple-100">
            <Image src="/logo-chabad.png" alt="לוגו הרשת" width={120} height={38} className="object-contain" priority />
          </div>
        </div>

        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--teal-050)' }}>
          <Clock size={28} style={{ color: 'var(--teal-600)' }} />
        </div>

        <h1 className="text-[22px] font-extrabold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
          ברוכה הבאה למערכת השביל! 🎉
        </h1>
        <p className="text-[13.5px] leading-relaxed mb-1" style={{ color: 'var(--ink-3)' }}>
          פרטי המוסד התקבלו בהצלחה.
        </p>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--ink-4)' }}>
          מנהלת המערכת תאשר את הצטרפותך בהקדם.<br />
          <strong style={{ color: 'var(--ink)' }}>עם האישור תישלח הודעה</strong> ותוכלי להיכנס למערכת.
        </p>

        <div className="rounded-[14px] p-4 mb-5 text-start"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
          {[
            { done: true,  label: 'הרשמת המוסד' },
            { done: false, label: 'אישור מנהלת המערכת — תוך 24 שעות' },
            { done: false, label: 'גישה מלאה לפורטל המוסד' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2"
              style={{ borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: s.done ? 'var(--teal-600)' : 'var(--line)', color: s.done ? '#fff' : 'var(--ink-4)' }}>
                {s.done
                  ? <CheckCircle size={12} />
                  : <span style={{ fontSize: '10px', fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span className="text-[12.5px]"
                style={{ color: s.done ? 'var(--ink)' : 'var(--ink-4)', fontWeight: s.done ? 700 : 500 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <a href={WA_LINK} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[12px] mb-3 text-[13.5px] font-bold no-underline"
          style={{ background: '#E7FBF0', color: '#166534', border: '1px solid #bbf7d0' }}>
          <Phone size={15} />
          יש שאלה? שלחו הודעת WhatsApp
        </a>

        <Link href="/"
          className="block text-center text-[12.5px] font-semibold"
          style={{ color: 'var(--ink-4)', textDecoration: 'none' }}>
          ← חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
