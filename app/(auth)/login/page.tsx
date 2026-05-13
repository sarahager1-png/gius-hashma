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
          from { opacity: 0; transform: translateY(20px); }
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
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(-2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.32; }
        }

        .login-root {
          height: 100vh;
          overflow: hidden;
          display: flex;
          direction: rtl;
          font-family: 'Heebo', system-ui, sans-serif;
          background: #F5F3F9;
        }

        /* ── Hero panel (right, 42%) ── */
        .hero-panel {
          width: 42%;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #1A0D38;
        }
        @media (max-width: 1023px) { .hero-panel { display: none; } }

        .hero-grad-base {
          position: absolute; inset: 0;
          background: linear-gradient(160deg,
            #0D0820 0%, #1E1040 25%, #2A1558 50%, #1A0D38 75%, #120828 100%
          );
        }
        .hero-grad-purple {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 120% 80% at 50% -10%,
            rgba(91,63,163,.55) 0%, transparent 65%
          );
          animation: pulse-glow 5s ease-in-out infinite;
        }
        .hero-grad-gold {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 40% at 80% 85%,
            rgba(212,176,106,.18) 0%, transparent 60%
          );
        }
        .hero-grad-left {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 55% 45% at -10% 40%,
            rgba(67,40,116,.35) 0%, transparent 65%
          );
        }
        .hero-pattern {
          position: absolute; inset: 0;
          opacity: 0.045;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpolygon points='40,8 46.9,24.6 65,21 54.5,35.8 65,50.6 46.9,47 40,63.6 33.1,47 15,50.6 25.5,35.8 15,21 33.1,24.6' fill='none' stroke='white' stroke-width='0.8'/%3E%3C/svg%3E");
          background-size: 80px 80px;
        }
        .hero-grid {
          position: absolute; inset: 0;
          opacity: 0.035;
          background-image:
            linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .hero-orb-1 {
          position: absolute; top: 10%; right: -8%;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(91,63,163,.28) 0%, transparent 70%);
          animation: float1 9s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute; bottom: 12%; left: -10%;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.15) 0%, transparent 70%);
          animation: float2 11s ease-in-out infinite;
        }
        .hero-gold-line {
          position: absolute; top: 0; left: 50%;
          transform: translateX(-50%);
          width: 1px; height: 100%;
          background: linear-gradient(180deg,
            transparent 0%, rgba(212,176,106,.15) 30%,
            rgba(212,176,106,.22) 50%, rgba(212,176,106,.08) 75%, transparent 100%
          );
        }

        .hero-content {
          position: relative; z-index: 10;
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 40px;
          text-align: center;
          overflow: hidden;
        }

        /* Logo */
        .hero-logo-wrap { position: relative; margin-bottom: 32px; }
        .hero-logo-halo {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 130px; height: 130px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.22) 0%, transparent 70%);
        }
        .hero-logo-img {
          position: relative; z-index: 1;
          width: 64px; height: 64px; object-fit: contain;
          filter: brightness(0) invert(1); opacity: 0.9;
        }

        .hero-gold-divider {
          width: 40px; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,176,106,.7), transparent);
          margin: 0 auto 10px;
        }
        .hero-name-badge {
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.14em;
          color: rgba(212,176,106,.6);
          text-transform: uppercase;
          margin-bottom: 36px;
        }

        /* System name */
        .hero-system-name {
          font-size: 48px; font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 6px;
          text-shadow: 0 2px 24px rgba(0,0,0,.4);
        }
        .hero-system-sub {
          font-size: 13px; font-weight: 400;
          color: rgba(255,255,255,.38);
          letter-spacing: 0.06em;
          margin-bottom: 44px;
        }

        /* Quote block */
        .hero-quote-block {
          width: 100%; max-width: 280px;
          margin: 0 auto 40px;
          padding: 22px 24px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(212,176,106,.18);
          backdrop-filter: blur(8px);
          position: relative;
        }
        .hero-quote-mark {
          position: absolute;
          top: -14px; right: 20px;
          font-size: 52px; line-height: 1;
          color: rgba(212,176,106,.35);
          font-family: Georgia, serif;
        }
        .hero-quote-text {
          font-size: 17px; font-weight: 700;
          color: rgba(255,255,255,.88);
          line-height: 1.55;
          letter-spacing: 0.01em;
          margin-bottom: 12px;
        }
        .hero-quote-text em {
          font-style: normal;
          background: linear-gradient(90deg, #D4B06A 0%, #F0D08A 50%, #D4B06A 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }
        .hero-quote-source {
          font-size: 11px; font-weight: 600;
          color: rgba(212,176,106,.55);
          letter-spacing: 0.08em;
        }

        /* Feature rows */
        .hero-features {
          display: flex; flex-direction: column; gap: 10px;
          width: 100%; max-width: 270px; margin: 0 auto;
        }
        .hero-feature-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 12px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.05);
          transition: background 200ms;
        }
        .hero-feature-row:hover { background: rgba(255,255,255,.06); }
        .hero-feature-icon {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 15px;
          background: rgba(212,176,106,.1);
          border: 1px solid rgba(212,176,106,.15);
        }
        .hero-feature-text {
          font-size: 12.5px; font-weight: 500;
          color: rgba(255,255,255,.6);
          text-align: right; flex: 1;
        }

        .hero-footer {
          position: relative; z-index: 10;
          text-align: center; padding: 0 0 22px;
          font-size: 10.5px; color: rgba(255,255,255,.15);
          letter-spacing: 0.04em;
        }

        /* ── Form panel (left, 58%) ── */
        .form-panel {
          flex: 1; display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          background: #FAF9FC;
          height: 100vh;
        }
        .form-panel-grad-1 {
          position: absolute; top: -120px; right: -120px;
          width: 480px; height: 480px; border-radius: 50%;
          background: radial-gradient(circle, rgba(91,63,163,.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .form-panel-grad-2 {
          position: absolute; bottom: -80px; left: -80px;
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .form-panel-dots {
          position: absolute; inset: 0; opacity: 0.022;
          background-image: radial-gradient(circle, #432874 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none;
        }

        .form-topbar {
          position: absolute; top: 20px; left: 24px; z-index: 10;
        }
        .form-admin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 12px; font-weight: 600;
          color: rgba(67,40,116,.5);
          background: rgba(67,40,116,.06);
          border: 1px solid rgba(67,40,116,.1);
          text-decoration: none; transition: all 200ms;
        }
        .form-admin-btn:hover {
          background: rgba(67,40,116,.12); color: #432874;
          border-color: rgba(67,40,116,.22);
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
          background: linear-gradient(135deg, #432874 0%, #5B3FA3 100%);
          box-shadow: 0 8px 28px rgba(67,40,116,.32);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }

        .form-main {
          flex: 1; display: flex;
          align-items: center; justify-content: center;
          padding: 40px 24px; position: relative; z-index: 1;
        }
        .form-card { width: 100%; max-width: 400px; }

        .form-welcome {
          margin-bottom: 36px;
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
          font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.1em; color: rgba(67,40,116,.5);
          text-transform: uppercase;
        }
        .form-heading {
          font-size: 30px; font-weight: 900;
          color: #1A0D38; line-height: 1.18;
          letter-spacing: -0.03em; margin-bottom: 8px;
        }
        .form-sub {
          font-size: 14px; color: #6B6688;
          line-height: 1.65; font-weight: 400;
        }

        /* Tabs */
        .form-tabs {
          display: flex; gap: 0;
          border: 1.5px solid rgba(67,40,116,.15);
          border-radius: 12px; overflow: hidden;
          margin-bottom: 28px;
          animation: fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .form-tab {
          flex: 1; padding: 10px;
          font-size: 13px; font-weight: 600;
          color: rgba(67,40,116,.45);
          background: transparent; border: none;
          cursor: pointer; transition: all 200ms;
          font-family: 'Heebo', system-ui, sans-serif;
        }
        .form-tab.active {
          background: linear-gradient(135deg, #432874, #5B3FA3);
          color: #ffffff;
        }
        .form-tab:first-child { border-radius: 10px 0 0 10px; }
        .form-tab:last-child  { border-radius: 0 10px 10px 0; }

        .form-google-btn {
          position: relative; width: 100%; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-family: 'Heebo', system-ui, sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 260ms cubic-bezier(0.16,1,0.3,1);
          border: none; outline: none;
          animation: fadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both;
          overflow: hidden;
        }
        .form-google-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, #432874 0%, #5B3FA3 60%, #432874 100%);
          background-size: 200% 100%;
          transition: background-position 400ms ease;
        }
        .form-google-btn:hover::before { background-position: 100% 0; }
        .form-google-btn::after {
          content: ''; position: absolute; inset: 0;
          box-shadow: 0 8px 32px rgba(67,40,116,.38), 0 2px 8px rgba(67,40,116,.22);
          border-radius: 16px; transition: opacity 260ms;
        }
        .form-google-btn:hover::after {
          box-shadow: 0 12px 40px rgba(67,40,116,.52), 0 4px 12px rgba(67,40,116,.3);
        }
        .form-google-btn:active { transform: scale(0.985); }
        .form-google-btn:disabled { opacity: 0.68; cursor: not-allowed; transform: none; }
        .form-google-btn span { position: relative; z-index: 1; color: #ffffff; }
        .form-google-btn .btn-icon {
          position: relative; z-index: 1;
          background: rgba(255,255,255,.12); border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .form-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 22px 0;
          animation: fadeIn 0.5s 0.3s both;
        }
        .form-divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(67,40,116,.12), transparent);
        }
        .form-divider-text {
          font-size: 11.5px; font-weight: 600;
          color: rgba(107,102,136,.5); letter-spacing: 0.06em;
        }

        .form-register-link {
          display: block; text-align: center;
          animation: fadeIn 0.5s 0.35s both;
        }
        .form-register-link a {
          font-size: 13.5px; font-weight: 600;
          color: #5B3AAB; text-decoration: none;
          border-bottom: 1px solid rgba(91,58,171,.2);
          transition: border-color 200ms;
        }
        .form-register-link a:hover { border-color: rgba(91,58,171,.6); }

        .form-error {
          margin-top: 12px; padding: 10px 14px;
          border-radius: 12px; font-size: 13px; font-weight: 600;
          color: #C83B3B; background: #FEE8E8;
          border: 1px solid #FECACA; text-align: center;
          animation: fadeUp 0.3s ease both;
        }

        .form-footer {
          position: relative; z-index: 1;
          text-align: center; padding: 0 0 20px;
          font-size: 11px; color: rgba(107,102,136,.38);
        }
      `}</style>

      <div className="login-root">

        {/* ══ Hero Panel ══ */}
        <div className="hero-panel">
          <div className="hero-grad-base" />
          <div className="hero-grad-purple" />
          <div className="hero-grad-gold" />
          <div className="hero-grad-left" />
          <div className="hero-pattern" />
          <div className="hero-grid" />
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
          <div className="hero-gold-line" />

          <div className="hero-content" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 800ms ease' }}>

            <div className="hero-logo-wrap">
              <div className="hero-logo-halo" />
              <Image
                src="/logo-chabad.png"
                alt="רשת אהלי יוסף יצחק"
                width={64} height={64}
                className="hero-logo-img"
              />
            </div>

            <div className="hero-gold-divider" />
            <div className="hero-name-badge">מערכת גיוס והשמה · רשת חינוך חב״ד</div>

            <div className="hero-system-name">הַשְּׁבִיל</div>
            <div className="hero-system-sub">מצאי את שביל השליחות שלך</div>

            {/* Quote block */}
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
            השביל · רשת חינוך חב״ד · 2026
          </div>
        </div>

        {/* ══ Form Panel ══ */}
        <div className="form-panel">
          <div className="form-panel-grad-1" />
          <div className="form-panel-grad-2" />
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
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#1A0D38', letterSpacing: '-0.03em', marginBottom: '4px' }}>
              הַשְּׁבִיל
            </div>
            <div style={{ fontSize: '13px', color: '#6B6688' }}>
              מערכת גיוס והשמה · רשת חינוך חב״ד
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
                <button className="form-tab">מוסד</button>
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
