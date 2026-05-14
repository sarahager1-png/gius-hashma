'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { KeyRound } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function signInWithGoogle() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) { setError('שגיאה בכניסה עם Google'); setLoading(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-20px) scale(1.03); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-14px) scale(0.97); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.85; }
        }

        .login-root {
          height: 100vh;
          overflow: hidden;
          display: flex;
          direction: rtl;
          font-family: 'Heebo', system-ui, sans-serif;
          background: #0E0B1D;
        }

        /* ── Hero panel (right, 44%) ── */
        .hero-panel {
          width: 44%;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        @media (max-width: 1023px) { .hero-panel { display: none; } }

        .hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(160deg,
            #110820 0%, #1E1040 25%, #281450 50%, #1A0D38 75%, #0E0818 100%
          );
        }
        .hero-glow-top {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 110% 70% at 50% -5%,
            rgba(100,65,180,.5) 0%, transparent 65%
          );
          animation: pulse-soft 7s ease-in-out infinite;
        }
        .hero-glow-gold {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 55% 38% at 78% 88%,
            rgba(212,176,106,.14) 0%, transparent 60%
          );
        }
        .hero-glow-side {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 50% 42% at -8% 42%,
            rgba(60,35,110,.38) 0%, transparent 65%
          );
        }
        .hero-pattern {
          position: absolute; inset: 0;
          opacity: 0.04;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Cpolygon points='36,6 42.2,22 60,19 50,33 60,47 42.2,44 36,60 29.8,44 12,47 22,33 12,19 29.8,22' fill='none' stroke='white' stroke-width='0.7'/%3E%3C/svg%3E");
          background-size: 72px 72px;
        }
        .hero-grid {
          position: absolute; inset: 0;
          opacity: 0.028;
          background-image:
            linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .hero-orb-1 {
          position: absolute; top: 8%; right: -10%;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(100,65,180,.22) 0%, transparent 70%);
          animation: float1 10s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute; bottom: 10%; left: -12%;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.12) 0%, transparent 70%);
          animation: float2 13s ease-in-out infinite;
        }

        .hero-content {
          position: relative; z-index: 10;
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 44px;
          text-align: center;
        }

        .hero-logo-wrap {
          position: relative; margin-bottom: 28px;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-logo-halo {
          position: absolute;
          width: 110px; height: 110px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.18) 0%, transparent 70%);
        }
        .hero-logo-img {
          position: relative; z-index: 1;
          width: 60px; height: 60px; object-fit: contain;
          filter: brightness(0) invert(1); opacity: 0.88;
        }

        .hero-eyebrow {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(212,176,106,.55);
          margin-bottom: 8px;
        }
        .hero-divider {
          width: 36px; height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(212,176,106,.6), transparent);
          margin: 0 auto 18px;
        }

        .hero-system-name {
          font-size: 52px; font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 7px;
        }
        .hero-system-sub {
          font-size: 12.5px; font-weight: 400;
          color: rgba(255,255,255,.32);
          letter-spacing: 0.08em;
          margin-bottom: 48px;
        }

        .hero-quote-block {
          width: 100%; max-width: 290px;
          margin: 0 auto 44px;
          padding: 24px 26px;
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(212,176,106,.15);
          backdrop-filter: blur(10px);
          position: relative;
        }
        .hero-quote-mark {
          position: absolute; top: -12px; right: 22px;
          font-size: 48px; line-height: 1;
          color: rgba(212,176,106,.3); font-family: Georgia, serif;
        }
        .hero-quote-text {
          font-size: 16.5px; font-weight: 700;
          color: rgba(255,255,255,.85);
          line-height: 1.6; letter-spacing: 0.01em; margin-bottom: 10px;
        }
        .hero-quote-text em {
          font-style: normal;
          background: linear-gradient(90deg, #D4B06A 0%, #F0D08A 50%, #D4B06A 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 8s linear infinite;
        }
        .hero-quote-source {
          font-size: 10.5px; font-weight: 600;
          color: rgba(212,176,106,.5); letter-spacing: 0.08em;
        }

        .hero-features {
          display: flex; flex-direction: column; gap: 9px;
          width: 100%; max-width: 278px; margin: 0 auto;
        }
        .hero-feature-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.05);
          transition: background 200ms;
        }
        .hero-feature-row:hover { background: rgba(255,255,255,.055); }
        .hero-feature-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 14px;
          background: rgba(212,176,106,.09);
          border: 1px solid rgba(212,176,106,.13);
        }
        .hero-feature-text {
          font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,.55); text-align: right; flex: 1;
        }

        .hero-footer {
          position: relative; z-index: 10;
          text-align: center; padding: 0 0 22px;
          font-size: 10px; color: rgba(255,255,255,.12);
          letter-spacing: 0.05em;
        }

        /* ── Form panel (left, 56%) ── */
        .form-panel {
          flex: 1; display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          background: #090717;
          height: 100vh;
        }
        .form-panel::before {
          content: '';
          position: absolute; top: -150px; right: -150px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(80,50,150,.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .form-panel::after {
          content: '';
          position: absolute; bottom: -100px; left: -100px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .form-panel-dots {
          position: absolute; inset: 0; opacity: 0.018;
          background-image: radial-gradient(circle, rgba(180,140,255,1) 1px, transparent 1px);
          background-size: 30px 30px; pointer-events: none;
        }

        .form-topbar {
          position: absolute; top: 20px; left: 24px; z-index: 10;
        }
        .form-admin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 12px; font-weight: 600;
          color: rgba(180,160,220,.45);
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          text-decoration: none; transition: all 200ms;
        }
        .form-admin-btn:hover {
          background: rgba(255,255,255,.08);
          color: rgba(200,180,240,.75);
          border-color: rgba(255,255,255,.14);
        }

        /* Mobile brand */
        .mobile-brand {
          display: none; flex-direction: column;
          align-items: center; padding: 52px 24px 20px;
          text-align: center; position: relative; z-index: 1;
        }
        @media (max-width: 1023px) { .mobile-brand { display: flex; } }
        .mobile-logo-ring {
          width: 68px; height: 68px; border-radius: 20px;
          background: linear-gradient(135deg, #2E1860 0%, #5B3FA3 100%);
          box-shadow: 0 8px 28px rgba(67,40,116,.45);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }

        .form-main {
          flex: 1; display: flex;
          align-items: center; justify-content: center;
          padding: 40px 24px; position: relative; z-index: 1;
        }
        .form-card {
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,.45), 0 8px 32px rgba(0,0,0,.3);
        }

        .form-welcome {
          margin-bottom: 32px;
          animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .form-welcome-eyebrow {
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        }
        .form-welcome-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: linear-gradient(135deg, #D4B06A, #F0D08A); flex-shrink: 0;
        }
        .form-welcome-eyebrow-text {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; color: rgba(212,176,106,.6);
          text-transform: uppercase;
        }
        .form-heading {
          font-size: 28px; font-weight: 900;
          color: rgba(255,255,255,.92); line-height: 1.2;
          letter-spacing: -0.03em; margin-bottom: 8px;
        }
        .form-sub {
          font-size: 13.5px; color: rgba(255,255,255,.38);
          line-height: 1.65; font-weight: 400;
        }

        /* Tabs */
        .form-tabs {
          display: flex; gap: 0;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.03);
          border-radius: 12px; overflow: hidden;
          margin-bottom: 26px;
          animation: fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .form-tab {
          flex: 1; padding: 10px;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,.35);
          background: transparent; border: none;
          cursor: pointer; transition: all 200ms;
          font-family: 'Heebo', system-ui, sans-serif;
        }
        .form-tab.active {
          background: rgba(100,65,180,.45);
          color: rgba(255,255,255,.92);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
        }
        .form-tab:first-child { border-radius: 10px 0 0 10px; }
        .form-tab:last-child  { border-radius: 0 10px 10px 0; }
        .form-tab:hover:not(.active) { background: rgba(255,255,255,.05); color: rgba(255,255,255,.6); }

        /* Google button — glassmorphism style */
        .form-google-btn {
          position: relative; width: 100%; height: 54px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-family: 'Heebo', system-ui, sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 260ms cubic-bezier(0.16,1,0.3,1);
          border: 1px solid rgba(255,255,255,.22);
          outline: none;
          animation: fadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both;
          overflow: hidden;
          color: rgba(255,255,255,.92);
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1);
        }
        .form-google-btn:hover {
          background: rgba(255,255,255,.13);
          border-color: rgba(255,255,255,.35);
          box-shadow: 0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.15);
          transform: translateY(-1px);
        }
        .form-google-btn:active { transform: scale(0.985) translateY(0); }
        .form-google-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .form-google-btn .btn-icon {
          background: rgba(255,255,255,.92); border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .form-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 20px 0;
          animation: fadeIn 0.5s 0.3s both;
        }
        .form-divider-line {
          flex: 1; height: 1px;
          background: rgba(255,255,255,.08);
        }
        .form-divider-text {
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,.25); letter-spacing: 0.08em;
        }

        .form-register-link {
          display: block; text-align: center;
          animation: fadeIn 0.5s 0.35s both;
        }
        .form-register-link a {
          font-size: 13px; font-weight: 600;
          color: rgba(160,130,220,.7); text-decoration: none;
          border-bottom: 1px solid rgba(160,130,220,.2);
          transition: all 200ms;
        }
        .form-register-link a:hover {
          color: rgba(190,165,240,.9);
          border-color: rgba(190,165,240,.45);
        }

        .form-error {
          margin-top: 12px; padding: 10px 14px;
          border-radius: 12px; font-size: 13px; font-weight: 600;
          color: #FF9999; background: rgba(200,60,60,.15);
          border: 1px solid rgba(200,60,60,.25); text-align: center;
          animation: fadeUp 0.3s ease both;
        }

        .form-footer {
          position: relative; z-index: 1;
          text-align: center; padding: 0 0 20px;
          font-size: 10.5px; color: rgba(255,255,255,.12);
        }
      `}</style>

      <div className="login-root">

        {/* ══ Hero Panel ══ */}
        <div className="hero-panel">
          <div className="hero-bg" />
          <div className="hero-glow-top" />
          <div className="hero-glow-gold" />
          <div className="hero-glow-side" />
          <div className="hero-pattern" />
          <div className="hero-grid" />
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />

          <div className="hero-content" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 800ms ease' }}>

            <div className="hero-logo-wrap">
              <div className="hero-logo-halo" />
              <Image
                src="/logo-chabad.png"
                alt="רשת אהלי יוסף יצחק"
                width={60} height={60}
                className="hero-logo-img"
              />
            </div>

            <div className="hero-eyebrow">מערכת גיוס והשמה · רשת חינוך חב״ד</div>
            <div className="hero-divider" />

            <div className="hero-system-name">הַשְּׁבִיל</div>
            <div className="hero-system-sub">מערכת חכמה לגיוס והשמה</div>

            <div className="hero-quote-block">
              <div className="hero-quote-mark">&ldquo;</div>
              <div className="hero-quote-text">
                דְּרָכֶיהָ דַרְכֵי נֹעַם<br/>
                <em>וְכָל נְתִיבוֹתֶיהָ שָׁלוֹם</em>
              </div>
              <div className="hero-quote-source">משלי ג׳, יז</div>
            </div>

            <div className="hero-features">
              {[
                { icon: '✦', text: 'התאמה חכמה של משרות ומועמדות' },
                { icon: '◈', text: 'ניהול הגשות ומעקב בזמן אמת' },
                { icon: '❋', text: 'ליווי אישי לאורך כל התהליך' },
              ].map(({ icon, text }) => (
                <div key={text} className="hero-feature-row">
                  <div className="hero-feature-icon">{icon}</div>
                  <span className="hero-feature-text">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-footer">
            הַשְּׁבִיל · עתודות לשליחות · 2026
          </div>
        </div>

        {/* ══ Form Panel ══ */}
        <div className="form-panel">
          <div className="form-panel-dots" />

          <div className="form-topbar">
            <a href="/register/admin" className="form-admin-btn">
              <KeyRound size={12} />
              הנהלה
            </a>
          </div>

          {/* Mobile brand */}
          <div className="mobile-brand">
            <div className="mobile-logo-ring">
              <Image
                src="/logo-chabad.png"
                alt="השביל"
                width={36} height={36}
                style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'rgba(255,255,255,.9)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
              הַשְּׁבִיל
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.38)' }}>
              מערכת חכמה לגיוס והשמה
            </div>
          </div>

          <div className="form-main">
            <div
              className="form-card"
              style={{ opacity: mounted ? 1 : 0, transition: 'opacity 600ms 100ms ease' }}
            >
              <div className="form-welcome">
                <div className="form-welcome-eyebrow">
                  <div className="form-welcome-dot" />
                  <span className="form-welcome-eyebrow-text">כניסה למערכת</span>
                </div>
                <h1 className="form-heading">ברוכה הבאה,</h1>
                <p className="form-sub">
                  היכנסי עם חשבון Google שלך כדי<br />
                  לגשת למערכת הגיוס וההשמה
                </p>
              </div>

              {/* Tabs */}
              <div className="form-tabs">
                <button className="form-tab active">מועמדת</button>
                <a href="/mosad" className="form-tab" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>מוסד</a>
              </div>

              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="form-google-btn"
              >
                {loading ? (
                  <span>מתחברת...</span>
                ) : (
                  <>
                    <div className="btn-icon"><GoogleIcon /></div>
                    <span>כניסה עם Google</span>
                  </>
                )}
              </button>

              {error && <div className="form-error">{error}</div>}

              <div className="form-divider">
                <div className="form-divider-line" />
                <span className="form-divider-text">או</span>
                <div className="form-divider-line" />
              </div>

              <div className="form-register-link">
                <a href="/register">הגשת מועמדות חדשה ←</a>
              </div>
            </div>
          </div>

          <div className="form-footer">
            © 2026 רשת חינוך חב״ד · כל הזכויות שמורות
          </div>
        </div>
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
