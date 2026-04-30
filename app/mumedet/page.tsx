'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Search, FileText, Star, Eye, EyeOff } from 'lucide-react'

const STATS = [
  { n: '50+', label: 'משרות פתוחות' },
  { n: '80+', label: 'בתי ספר שותפים' },
  { n: '300+', label: 'מועמדות רשומות' },
]
const FEATURES = [
  { icon: Search,   title: 'חיפוש משרות',    desc: 'סנני לפי מחוז, סוג משרה ושעות — מצאי בדיוק את מה שמתאים' },
  { icon: FileText, title: 'פרופיל מקצועי', desc: 'בני פרופיל שלם עם קורות חיים, ניסיון וכישורים' },
  { icon: Star,     title: 'מעקב הגשות',    desc: 'ראי את סטטוס כל בקשה בזמן אמת ועדכוני מוסדות' },
]

export default function MumedetLanding() {
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')
  const [pending, setPending] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPending(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('אימייל או סיסמה שגויים'); setPending(false) }
    else window.location.href = '/dashboard'
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '13px', fontWeight: 600 }}>חזרה</span>
            </a>
            <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,.95)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
              <Image src="/logo-chabad.png" alt="לוגו" width={28} height={28} className="object-contain" />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 0 44px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '999px', padding: '5px 14px', marginBottom: '16px' }}>
              <GraduationCap size={13} color="white" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '.05em' }}>פורטל המועמדת</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-.03em', lineHeight: 1.15, margin: '0 0 10px' }}>
              מצאי את<br />המשרה המושלמת
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.75)', margin: '0 0 28px', lineHeight: 1.6 }}>
              הצטרפי לרשת מועמדות ההוראה הגדולה ביותר בחינוך חב״ד
            </p>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.12)', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.18)' }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{ flex: 1, padding: '13px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-.02em' }}>{s.n}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

        {/* Login card — overlaps hero */}
        <div style={{ marginTop: '-20px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(91,58,171,.14)', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--purple), var(--teal))' }} />
          <div style={{ padding: '22px 24px 20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 3px', letterSpacing: '-.01em' }}>כניסה למערכת</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 16px' }}>התחברי כדי להמשיך</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink-2)', marginBottom: '5px' }}>אימייל</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required dir="ltr"
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid var(--line)', fontSize: '14px', outline: 'none', background: 'var(--bg-2)', color: 'var(--ink)', fontFamily: 'inherit', transition: 'all .15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)'; e.currentTarget.style.background = 'white' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--bg-2)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-2)' }}>סיסמה</label>
                  <a href="/login" style={{ fontSize: '12px', color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>שכחתי סיסמה</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required dir="ltr"
                    style={{ width: '100%', height: '42px', padding: '0 40px 0 12px', borderRadius: '10px', border: '1.5px solid var(--line)', fontSize: '14px', outline: 'none', background: 'var(--bg-2)', color: 'var(--ink)', fontFamily: 'inherit', transition: 'all .15s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)'; e.currentTarget.style.background = 'white' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--bg-2)' }} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && (
                <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>{error}</div>
              )}
              <button type="submit" disabled={pending} style={{ height: '44px', borderRadius: '11px', background: pending ? 'var(--ink-4)' : 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', color: 'white', fontWeight: 800, fontSize: '14.5px', border: 'none', cursor: pending ? 'default' : 'pointer', boxShadow: pending ? 'none' : '0 4px 14px rgba(91,58,171,.25)', fontFamily: 'inherit', marginTop: '2px' }}>
                {pending ? 'מתחברת...' : 'כניסה לפורטל המועמדת'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: '14px', paddingTop: '13px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--ink-4)' }}>טרם נרשמת? </span>
              <a href="/register/candidate" style={{ fontSize: '13px', color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>הרשמה כמועמדת ←</a>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', paddingBottom: '40px' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'white', borderRadius: '14px', padding: '14px 12px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '34px', height: '34px', background: 'var(--purple-050)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <Icon size={16} color="var(--purple)" />
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '3px' }}>{title}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-4)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
