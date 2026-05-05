'use client'

import { Clock, CheckCircle, Phone } from 'lucide-react'

const WA_LINK = `https://wa.me/972503339770?text=${encodeURIComponent('שלום, שלחתי בקשת הצטרפות למערכת הגיוס ואני ממתינה לאישור')}`

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(94,61,174,.10) 0%, transparent 60%), var(--bg)', fontFamily: 'Heebo, system-ui, sans-serif' }}>
      <div className="bg-white rounded-[24px] p-8 w-full max-w-sm text-center"
        style={{ boxShadow: '0 20px 60px rgba(15,11,35,.12)', border: '1px solid var(--line)' }}>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'var(--purple-050)' }}>
          <Clock size={38} style={{ color: 'var(--purple)' }} />
        </div>

        <h1 className="text-[22px] font-extrabold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
          הבקשה ממתינה לאישור
        </h1>
        <p className="text-[13.5px] leading-relaxed mb-6" style={{ color: 'var(--ink-3)' }}>
          פרטייך התקבלו בהצלחה.<br />
          מנהלת המערכת תאשר את הצטרפותך בהקדם.<br />
          <strong style={{ color: 'var(--ink)' }}>עם האישור תישלח אליך הודעת SMS</strong> ותוכלי להיכנס עם Google.
        </p>

        {/* Steps */}
        <div className="rounded-[14px] p-4 mb-5 text-start"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
          {[
            { done: true,  label: 'הגשת בקשת הצטרפות' },
            { done: false, label: 'אישור מנהלת המערכת — תוך 24 שעות' },
            { done: false, label: 'כניסה עם Google' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2"
              style={{ borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: s.done ? 'var(--purple)' : 'var(--line)', color: s.done ? '#fff' : 'var(--ink-4)' }}>
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

        {/* WA contact */}
        <a href={WA_LINK} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[12px] mb-3 text-[13.5px] font-bold no-underline transition-all"
          style={{ background: '#E7FBF0', color: '#166534', border: '1px solid #bbf7d0' }}>
          <Phone size={15} />
          יש שאלה? שלחי הודעת WhatsApp
        </a>

        <a href="/"
          className="block text-center text-[12.5px] font-semibold"
          style={{ color: 'var(--ink-4)', textDecoration: 'none' }}>
          ← חזרה לדף הבית
        </a>
      </div>
    </div>
  )
}
