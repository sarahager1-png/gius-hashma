'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Sparkles, ClipboardCheck, HeartHandshake } from 'lucide-react'

function LoginPageInner() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
    const err = searchParams.get('error')
    if (err === 'oauth')    setError('שגיאה בהתחברות עם Google — בדקי שהחשבון מורשה')
    if (err === 'exchange') setError('שגיאה בקבלת הסשן — נסי שוב')
  }, [searchParams])

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

        @keyframes shimG        { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes shimGold     { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp       { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes pulseGlow    { 0%,100%{opacity:.28} 50%{opacity:.6} }
        @keyframes pulseWarm    { 0%,100%{opacity:.18} 50%{opacity:.42} }
        @keyframes lightLeak    { 0%,100%{opacity:.03} 50%{opacity:.08} }
        @keyframes grainAnim    { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(1px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(2px,-2px)} }
        @keyframes floatCard    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes dustRise     { 0%{opacity:0;transform:translateY(0)} 15%{opacity:.55} 85%{opacity:.18} 100%{opacity:0;transform:translateY(-90px)} }

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lg-root {
          height: 100svh; overflow: hidden;
          display: flex; direction: rtl;
          font-family: 'Heebo', system-ui, sans-serif;
          background: #060F1A;
        }

        /* ══ HERO PANEL (right, 44%) ══ */
        .lg-hero {
          width: 44%; flex-shrink: 0;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
        }
        @media(max-width:1023px){ .lg-hero { display:none; } }

        .lg-hero-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse 160% 45% at 50% 0%,   rgba(0,195,225,.65)  0%, rgba(0,140,185,.22) 40%, transparent 62%),
            radial-gradient(ellipse 60%  55% at 50% 50%,  rgba(201,168,76,.07)  0%, transparent 58%),
            radial-gradient(ellipse 45%  35% at 92% 80%,  rgba(201,168,76,.10)  0%, transparent 55%),
            radial-gradient(ellipse 35%  28% at 6%  65%,  rgba(0,140,180,.06)   0%, transparent 55%),
            linear-gradient(180deg, #071820 0%, #060F18 100%);
        }
        .lg-hero-bg::before {
          content:''; position:absolute; inset:0;
          background:
            linear-gradient(125deg, rgba(201,168,76,.08) 0%, transparent 40%),
            linear-gradient(245deg, rgba(0,155,195,.04) 0%, transparent 30%);
          animation: lightLeak 14s ease-in-out infinite alternate;
        }
        .lg-hero-bg::after {
          content:''; position:absolute; inset:0;
          background-image:
            radial-gradient(1px 1px at 18% 18%, rgba(255,255,255,.18) 0%, transparent 100%),
            radial-gradient(1px 1px at 74% 10%, rgba(255,255,255,.14) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 44% 32%, rgba(255,255,255,.12) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,.1) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 68%, rgba(255,255,255,.09) 0%, transparent 100%),
            radial-gradient(1px 1px at 62% 80%, rgba(255,255,255,.08) 0%, transparent 100%),
            radial-gradient(1px 1px at 8%  44%, rgba(255,255,255,.11) 0%, transparent 100%),
            radial-gradient(1px 1px at 52% 90%, rgba(255,255,255,.07) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 5%,  rgba(255,255,255,.14) 0%, transparent 100%);
          filter:blur(.3px); opacity:.65;
        }
        .lg-hero-grain {
          position:absolute; inset:0; pointer-events:none; z-index:2;
          opacity:.028;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size:180px 180px;
          animation:grainAnim .4s steps(1) infinite;
        }
        .lg-hero-dust {
          position:absolute; inset:0; pointer-events:none; z-index:2; overflow:hidden;
        }
        .lg-hero-dust::before {
          content:''; position:absolute; bottom:35%; left:46%;
          width:2px; height:2px; border-radius:50%;
          background:rgba(201,168,76,.35);
          box-shadow:14px 9px 0 0 rgba(201,168,76,.18),-20px 16px 0 1px rgba(0,200,235,.12),38px -6px 0 0 rgba(255,255,255,.07),-10px -22px 0 1px rgba(201,168,76,.1);
          animation:dustRise 11s ease-out 1.8s infinite;
        }

        .lg-hero-content {
          position:relative; z-index:10;
          flex:1; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:32px 44px; text-align:center;
        }

        /* logo box — matches landing page */
        .lg-logo-wrap { position:relative; margin-bottom:24px; }
        .lg-logo-box {
          position:relative;
          width:72px; height:72px;
          background:rgba(255,252,248,.93);
          border-radius:20px;
          display:flex; align-items:center; justify-content:center;
          padding:6px; margin:0 auto;
          box-shadow:
            inset 0 1.5px 0 rgba(255,255,255,.95),
            0 4px 20px rgba(0,0,0,.4),
            0 0 36px rgba(0,175,215,.2),
            0 0 70px rgba(201,168,76,.1);
        }
        .lg-logo-box::before {
          content:''; position:absolute; inset:-20px; border-radius:40px;
          background:radial-gradient(ellipse, rgba(0,175,215,.16) 0%, rgba(201,168,76,.09) 55%, transparent 70%);
          filter:blur(22px); animation:pulseGlow 6s ease-in-out infinite; pointer-events:none;
        }
        .lg-logo-box::after {
          content:''; position:absolute; inset:-5px; border-radius:25px;
          border:1px solid rgba(201,168,76,.16);
          animation:pulseWarm 7s ease-in-out infinite; pointer-events:none;
        }

        .lg-hero-eyebrow {
          font-size:10px; font-weight:700; letter-spacing:.18em;
          color:rgba(0,195,225,.55); margin-bottom:8px;
        }
        .lg-hero-divider {
          width:36px; height:1.5px;
          background:linear-gradient(90deg, transparent, rgba(0,195,225,.5), transparent);
          margin:0 auto 16px;
        }
        .lg-hero-name {
          font-size:52px; font-weight:900; letter-spacing:-.04em; line-height:1;
          color:#fff; margin-bottom:6px;
        }
        .lg-hero-sub {
          font-size:12px; font-weight:400; letter-spacing:.08em;
          color:rgba(255,255,255,.32); margin-bottom:44px;
        }

        /* quote card — matches landing style */
        .lg-quote-card {
          width:100%; max-width:298px; margin:0 auto 40px;
          background:rgba(201,168,76,.055);
          backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(201,168,76,.22);
          border-radius:18px; padding:20px 22px;
          box-shadow:0 1px 0 rgba(255,255,255,.07) inset, 0 0 28px rgba(201,168,76,.09);
          position:relative;
        }
        .lg-quote-mark {
          position:absolute; top:-10px; right:18px;
          font-size:40px; line-height:1;
          background:linear-gradient(135deg, #D4A840, #EDD870, #C9941C);
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          font-family:Georgia,serif;
        }
        .lg-quote-text {
          font-size:16px; font-weight:700;
          color:rgba(255,255,255,.88); line-height:1.65; margin-bottom:10px;
        }
        .lg-quote-text em {
          font-style:normal;
          background:linear-gradient(90deg, #C8A040 0%, #EDD070 30%, #F8E898 55%, #EDD070 75%, #C8A040 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation:shimG 8s linear infinite;
        }
        .lg-quote-src {
          font-size:10px; font-weight:700; letter-spacing:.12em;
          background:linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation:shimGold 6s linear infinite; opacity:.8;
        }

        /* feature rows */
        .lg-features { display:flex; flex-direction:column; gap:10px; width:100%; max-width:290px; margin:0 auto; }
        .lg-feat-row {
          display:flex; align-items:center; gap:14px;
          padding:13px 16px; border-radius:15px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);
          transition:background .25s, border-color .25s, transform .25s;
          position:relative; overflow:hidden;
        }
        .lg-feat-row::before {
          content:''; position:absolute; right:0; top:0; bottom:0; width:2px;
          border-radius:0 2px 2px 0;
        }
        .lg-feat-row:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.14); transform:translateX(-2px); }
        .lg-feat-icon {
          width:36px; height:36px; border-radius:11px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }
        .lg-feat-text { font-size:12.5px; font-weight:500; color:rgba(255,255,255,.58); flex:1; text-align:right; line-height:1.4; }

        .lg-hero-footer {
          position:relative; z-index:10; text-align:center; padding:0 0 20px;
          font-size:10px; color:rgba(255,255,255,.12); letter-spacing:.05em;
        }

        /* ══ FORM PANEL (left, 56%) ══ */
        .lg-form {
          flex:1; display:flex; flex-direction:column;
          position:relative; overflow:hidden;
          background:linear-gradient(170deg, #EAF2FA 0%, #DDE8F3 55%, #E6EDF6 100%);
        }
        .lg-form::before {
          content:''; position:absolute; top:-80px; left:50%; transform:translateX(-50%);
          width:90%; height:420px; border-radius:50%;
          background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,175,210,.18) 0%, transparent 65%);
          pointer-events:none;
        }
        .lg-form::after {
          content:''; position:absolute; bottom:-60px; left:-60px;
          width:340px; height:340px; border-radius:50%;
          background:radial-gradient(circle, rgba(201,168,76,.09) 0%, transparent 70%);
          pointer-events:none;
        }
        .lg-form-grain {
          position:absolute; inset:0; pointer-events:none; z-index:1;
          opacity:.007;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size:180px 180px;
          animation:grainAnim .4s steps(1) infinite;
        }

        .lg-topbar {
          position:absolute; top:20px; left:24px; z-index:10;
        }
        .lg-admin-btn {
          display:flex; align-items:center; gap:6px;
          padding:7px 14px; border-radius:10px;
          font-size:12px; font-weight:600;
          color:rgba(26,46,66,.45);
          background:rgba(26,46,66,.06); border:1px solid rgba(26,46,66,.1);
          text-decoration:none; transition:all .2s;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .lg-admin-btn:hover { background:rgba(26,46,66,.1); color:rgba(26,46,66,.75); border-color:rgba(26,46,66,.18); }

        /* Mobile brand */
        .lg-mobile-brand {
          display:none; flex-direction:column;
          align-items:center; padding:52px 24px 20px;
          text-align:center; position:relative; z-index:2;
        }
        @media(max-width:1023px){ .lg-mobile-brand { display:flex; } }
        .lg-mobile-logo {
          width:64px; height:64px; border-radius:18px;
          background:rgba(255,252,248,.95);
          box-shadow:0 4px 20px rgba(26,46,66,.15), 0 0 32px rgba(0,175,215,.12);
          display:flex; align-items:center; justify-content:center;
          margin-bottom:12px;
        }

        /* form area */
        .lg-form-main {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:40px 24px; position:relative; z-index:2;
        }
        .lg-card {
          width:100%; max-width:400px;
          background:rgba(6,16,28,.86);
          backdrop-filter:blur(28px) saturate(140%); -webkit-backdrop-filter:blur(28px) saturate(140%);
          border:1px solid rgba(255,255,255,.13);
          border-top:1px solid rgba(255,255,255,.2);
          border-radius:24px; padding:40px 36px;
          box-shadow:
            0 2px 0 rgba(255,255,255,.08) inset,
            0 28px 80px rgba(10,24,50,.28),
            0 0 60px rgba(0,175,210,.08),
            0 0 0 1px rgba(0,180,220,.06);
          animation:floatCard 6s ease-in-out infinite;
          position:relative;
        }
        .lg-card::before {
          content:''; position:absolute; top:0; left:16px; right:16px; height:1px;
          background:linear-gradient(90deg, transparent, rgba(0,195,225,.45), rgba(201,168,76,.25), transparent);
          border-radius:1px;
        }

        .lg-welcome { margin-bottom:30px; animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both; }
        .lg-eyebrow-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .lg-eyebrow-dot {
          width:6px; height:6px; border-radius:50%; flex-shrink:0;
          background:linear-gradient(135deg, #C9A84C, #E8C96A);
        }
        .lg-eyebrow-text {
          font-size:11px; font-weight:700; letter-spacing:.12em;
          color:rgba(201,168,76,.65); text-transform:uppercase;
        }
        .lg-heading {
          font-size:28px; font-weight:900; color:rgba(255,255,255,.92);
          line-height:1.2; letter-spacing:-.03em; margin-bottom:8px;
        }
        .lg-sub {
          font-size:13.5px; color:rgba(255,255,255,.38);
          line-height:1.65; font-weight:400;
        }

        /* Tabs */
        .lg-tabs {
          display:flex; gap:8px;
          background:transparent; border:none;
          margin-bottom:24px;
          animation:fadeUp .5s .1s cubic-bezier(.16,1,.3,1) both;
        }
        .lg-tab {
          flex:1; padding:11px 10px;
          font-size:13px; font-weight:700;
          color:rgba(255,255,255,.38);
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.1);
          border-radius:13px; cursor:pointer;
          transition:all .22s cubic-bezier(.16,1,.3,1);
          font-family:'Heebo',system-ui,sans-serif;
          backdrop-filter:blur(10px);
          letter-spacing:-.01em;
        }
        .lg-tab.active {
          color:#fff;
          background:rgba(0,175,210,.3);
          border-color:rgba(0,195,225,.4);
          box-shadow:0 4px 18px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.12), 0 0 18px rgba(0,195,225,.14);
        }
        .lg-tab:hover:not(.active) { color:rgba(255,255,255,.72); background:rgba(255,255,255,.11); border-color:rgba(255,255,255,.18); transform:translateY(-1px); }

        /* Google button — matches landing page */
        .lg-goog-btn {
          width:100%; height:52px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; gap:11px;
          font-family:'Heebo',system-ui,sans-serif; font-size:14.5px; font-weight:700;
          cursor:pointer; outline:none; position:relative; overflow:hidden;
          background:linear-gradient(160deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.06) 100%);
          border:1px solid rgba(255,255,255,.2);
          color:#fff; transition:all .28s cubic-bezier(.16,1,.3,1); letter-spacing:-.01em;
          box-shadow:inset 0 1.5px 0 rgba(255,255,255,.15), 0 4px 20px rgba(0,0,0,.25), 0 0 0 1px rgba(0,180,220,.04);
          animation:fadeUp .6s .2s cubic-bezier(.16,1,.3,1) both;
        }
        .lg-goog-btn::before {
          content:''; position:absolute; inset:0; border-radius:inherit;
          background:linear-gradient(160deg,rgba(255,255,255,.08) 0%,transparent 60%);
          opacity:0; transition:opacity .28s;
        }
        .lg-goog-btn:hover { transform:translateY(-2px); box-shadow:inset 0 1.5px 0 rgba(255,255,255,.18), 0 10px 30px rgba(0,0,0,.35), 0 0 24px rgba(0,190,220,.1); border-color:rgba(255,255,255,.32); }
        .lg-goog-btn:hover::before { opacity:1; }
        .lg-goog-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .lg-goog-icon { background:rgba(255,255,255,.92); border-radius:8px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .lg-divider {
          display:flex; align-items:center; gap:14px;
          margin:18px 0; animation:fadeIn .5s .3s both;
        }
        .lg-divider-line { flex:1; height:1px; background:rgba(255,255,255,.08); }
        .lg-divider-text { font-size:11px; font-weight:600; color:rgba(255,255,255,.25); letter-spacing:.08em; }

        .lg-register {
          display:block; text-align:center; animation:fadeIn .5s .35s both;
        }
        .lg-register a {
          font-size:13px; font-weight:600;
          color:rgba(0,180,204,.65); text-decoration:none;
          border-bottom:1px solid rgba(0,180,204,.2); transition:all .2s;
        }
        .lg-register a:hover { color:rgba(0,200,224,.95); border-color:rgba(0,200,224,.45); }

        .lg-error {
          margin-top:12px; padding:10px 14px;
          border-radius:12px; font-size:13px; font-weight:600;
          color:#FCA5A5; background:rgba(200,60,60,.14);
          border:1px solid rgba(200,60,60,.25); text-align:center;
          animation:fadeUp .3s ease both;
        }

        .lg-form-footer {
          position:relative; z-index:2; text-align:center; padding:0 0 20px;
          font-size:10.5px; color:rgba(26,46,66,.3); letter-spacing:.04em;
        }
      `}</style>

      <div className="lg-root">

        {/* ══ Hero Panel ══ */}
        <div className="lg-hero">
          <div className="lg-hero-bg" />
          <div className="lg-hero-grain" />
          <div className="lg-hero-dust" />

          <div className="lg-hero-content" style={{ opacity: mounted ? 1 : 0, transition: 'opacity .8s ease' }}>

            <div className="lg-logo-wrap">
              <div className="lg-logo-box">
                <Image src="/logo-chabad.png" alt="השביל" width={58} height={58} style={{ objectFit:'contain' }} />
              </div>
            </div>

            <div className="lg-hero-eyebrow">מערכת גיוס והשמה · רשת חינוך חב״ד</div>
            <div className="lg-hero-divider" />
            <div className="lg-hero-name">הַשְּׁבִיל</div>
            <div className="lg-hero-sub">מערכת חכמה לגיוס והשמה</div>

            <div className="lg-quote-card">
              <div className="lg-quote-mark">&ldquo;</div>
              <div className="lg-quote-text" style={{ fontSize:'13px', fontWeight:500, lineHeight:1.75 }}>
                עבודה במוסד של כ&rdquo;ק מו&rdquo;ח אדמו&rdquo;ר זצוקללה&rdquo;ה נבג&rdquo;מ זי&rdquo;ע ובפרט במקצוע <em>החינוך על טהרת הקודש</em> – הרי זה צינור וכלי לקבלת ברכות השי&rdquo;ת בכלל.
              </div>
              <div className="lg-quote-src">הרבי · התקשרות · עמוד 115</div>
            </div>

            <div className="lg-features">
              {([
                { Icon: Sparkles,       color: '#00B4CC', text: 'התאמה חכמה של משרות ומועמדות' },
                { Icon: ClipboardCheck, color: '#C9A84C', text: 'ניהול הגשות ומעקב בזמן אמת'   },
                { Icon: HeartHandshake, color: '#7B5AC4', text: 'ליווי אישי לאורך כל התהליך'   },
              ] as { Icon: React.ElementType; color: string; text: string }[]).map(({ Icon, color, text }) => (
                <div key={text} className="lg-feat-row" style={{ '--accent': color } as React.CSSProperties}>
                  <div className="lg-feat-icon" style={{ background:`${color}18`, border:`1px solid ${color}30`, boxShadow:`0 0 12px ${color}22` }}>
                    <Icon size={17} color={color} style={{ filter:`drop-shadow(0 0 4px ${color}88)` }} />
                  </div>
                  <span className="lg-feat-text">{text}</span>
                  <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'2.5px', background:`linear-gradient(180deg, transparent, ${color}55, transparent)`, borderRadius:'0 2px 2px 0' }} />
                </div>
              ))}
            </div>
          </div>

          <div className="lg-hero-footer">
            הַשְּׁבִיל · עתודות לשליחות · 2026
          </div>
        </div>

        {/* ══ Form Panel ══ */}
        <div className="lg-form">
          <div className="lg-form-grain" />

          <div className="lg-topbar">
            <a href="/register/admin" className="lg-admin-btn">
              <KeyRound size={12} />
              הנהלה
            </a>
          </div>

          {/* Mobile brand */}
          <div className="lg-mobile-brand">
            <div className="lg-mobile-logo">
              <Image src="/logo-chabad.png" alt="השביל" width={44} height={44} style={{ objectFit:'contain' }} />
            </div>
            <div style={{ fontSize:'22px', fontWeight:900, color:'#1A2E42', letterSpacing:'-.03em', marginBottom:'4px' }}>
              הַשְּׁבִיל
            </div>
            <div style={{ fontSize:'13px', color:'#5A7085' }}>
              מערכת חכמה לגיוס והשמה
            </div>
          </div>

          <div className="lg-form-main">
            <div className="lg-card" style={{ opacity: mounted ? 1 : 0, transition: 'opacity .6s .1s ease' }}>

              <div className="lg-welcome">
                <div className="lg-eyebrow-row">
                  <div className="lg-eyebrow-dot" />
                  <span className="lg-eyebrow-text">כניסה למערכת</span>
                </div>
                <h1 className="lg-heading">ברוכה הבאה,</h1>
                <p className="lg-sub">
                  היכנסי עם חשבון Google שלך כדי<br />
                  לגשת למערכת הגיוס וההשמה
                </p>
              </div>

              <div className="lg-tabs">
                <button className="lg-tab active">מועמדת</button>
                <a href="/mosad" className="lg-tab" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>מוסד</a>
              </div>

              <button onClick={signInWithGoogle} disabled={loading} className="lg-goog-btn">
                {loading ? (
                  <span>מתחברת...</span>
                ) : (
                  <>
                    <div className="lg-goog-icon"><GoogleIcon /></div>
                    <span>כניסה עם Google</span>
                  </>
                )}
              </button>

              {error && <div className="lg-error">{error}</div>}

              <div className="lg-divider">
                <div className="lg-divider-line" />
                <span className="lg-divider-text">או</span>
                <div className="lg-divider-line" />
              </div>

              <div className="lg-register">
                <a href="/register">הגשת מועמדות חדשה ←</a>
              </div>

            </div>
          </div>

          <div className="lg-form-footer">
            © 2026 רשת חינוך חב״ד · כל הזכויות שמורות
          </div>
        </div>

      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
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
