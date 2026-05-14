'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Briefcase, Search, MessageCircle, CheckCircle,
  Calendar, ClipboardList, Bell, FileStack,
  Building2, LogIn, Settings, GraduationCap,
} from 'lucide-react'

/* ─────────────────────────── data ─────────────────────────── */

const STEPS = [
  {
    n: '01',
    title: 'כניסה עם Google',
    sub: 'כנסו עם המייל שבו המוסד שלכם רשום במערכת — הפרופיל נפתח אוטומטית',
    color: '#00B4CC',
    glow: 'rgba(0,180,204,.35)',
  },
  {
    n: '02',
    title: 'עדכון פרטי המוסד',
    sub: 'שם המוסד, עיר, סוג, תיאור ופרטי קשר — הכל עדכני מהרגע הראשון',
    color: '#C9A84C',
    glow: 'rgba(201,168,76,.35)',
  },
  {
    n: '03',
    title: 'פרסום משרות',
    sub: 'יצירת משרה בכמה קליקים — תתקבלנה מועמדויות מיד',
    color: '#7B5AC4',
    glow: 'rgba(123,90,196,.35)',
  },
]

const ACTIONS = [
  { icon: Settings,      title: 'עדכון פרטי המוסד',   desc: 'שם, עיר, סוג מוסד, תיאור ופרטי קשר',          c: '#00B4CC', bg: 'rgba(0,180,204,.12)' },
  { icon: Briefcase,     title: 'פרסום משרות',         desc: 'סטאג׳, חלקי, מלא — עם תיאור ותחום',           c: '#C9A84C', bg: 'rgba(201,168,76,.12)' },
  { icon: Search,        title: 'עיון במועמדות',        desc: 'סנן לפי התמחות, מחוז, ניסיון',                c: '#7B5AC4', bg: 'rgba(123,90,196,.12)' },
  { icon: ClipboardList, title: 'ניהול בקשות',          desc: 'צפה, סמן "נצפתה", קבל החלטה',                 c: '#00B4CC', bg: 'rgba(0,180,204,.12)' },
  { icon: Calendar,      title: 'לוח ראיונות',          desc: 'תיאום ראיונות — המועמדת מאשרת מ-WhatsApp',    c: '#C9A84C', bg: 'rgba(201,168,76,.12)' },
  { icon: FileStack,     title: 'קורות חיים',           desc: 'PDF/Word ישירות מפרופיל המועמדת',              c: '#7B5AC4', bg: 'rgba(123,90,196,.12)' },
  { icon: MessageCircle, title: 'הודעות ישירות',        desc: 'פנייה ישירה למועמדת מהמערכת',                 c: '#15803D', bg: 'rgba(21,128,61,.12)' },
  { icon: Bell,          title: 'עדכוני WhatsApp',      desc: 'כל מועמדות חדשה מגיעה ב-WhatsApp',            c: '#00B4CC', bg: 'rgba(0,180,204,.12)' },
]

/* ─────────────────────────── icons ─────────────────────────── */
const GoogleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

/* ─────────────────────────── component ─────────────────────────── */
export default function MosadLanding() {
  const [pending, setPending]   = useState(false)
  const [err, setErr]           = useState('')
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  async function signIn() {
    setPending(true); setErr('')
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setErr('שגיאה בכניסה עם Google. נסו שוב.'); setPending(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes floatA { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-14px)} }
        @keyframes floatB { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(8px)}  }
        @keyframes glow   { 0%,100%{opacity:.2} 50%{opacity:.42} }
        @keyframes shimT  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .mo-root {
          background:#0D1520;
          color:#fff;
          font-family:'Heebo',system-ui,sans-serif;
          direction:rtl;
          overflow-x:hidden;
        }

        /* ── HERO ── */
        .mo-hero {
          min-height:100svh;
          position:relative;
          display:flex;
          flex-direction:column;
          overflow:hidden;
        }
        .mo-hero-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse 100% 65% at 50% -5%,  rgba(0,140,160,.55)  0%, transparent 58%),
            radial-gradient(ellipse 60%  48% at 85% 88%,  rgba(201,168,76,.15) 0%, transparent 55%),
            radial-gradient(ellipse 52%  38% at -8% 55%,  rgba(123,90,196,.1)  0%, transparent 52%),
            linear-gradient(170deg, #0E2230 0%, #122838 40%, #0E1E2C 75%, #0D1520 100%);
        }
        .mo-orb { position:absolute; border-radius:50%; pointer-events:none; }
        .mo-orb-1 { top:5%;   right:-10%; width:440px; height:440px; background:radial-gradient(circle, rgba(0,180,204,.14) 0%, transparent 65%); animation:floatA 16s ease-in-out infinite; }
        .mo-orb-2 { bottom:8%; left:-8%;  width:360px; height:360px; background:radial-gradient(circle, rgba(123,90,196,.08) 0%, transparent 65%); animation:floatB 20s ease-in-out infinite; }
        .mo-orb-3 { display:none; }
        .mo-vline { display:none; }

        /* ── NAV ── */
        .mo-nav {
          position:relative; z-index:20;
          display:flex; align-items:center; justify-content:space-between;
          padding:22px 24px 0;
          max-width:1100px; margin:0 auto; width:100%;
        }
        .mo-logo-wrap { display:flex; align-items:center; gap:12px; text-decoration:none; }
        .mo-logo-box {
          width:50px; height:50px; background:#fff; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 18px rgba(0,0,0,.28); padding:4px; flex-shrink:0;
        }
        .mo-logo-name { font-size:20px; font-weight:900; color:#fff; letter-spacing:-.025em; }
        .mo-logo-sub  { font-size:10px; font-weight:500; color:rgba(255,255,255,.4); letter-spacing:.06em; }
        .mo-nav-links { display:flex; align-items:center; gap:6px; }
        .mo-nav-link {
          padding:8px 14px; border-radius:10px; font-size:13px; font-weight:600;
          color:rgba(255,255,255,.55); cursor:pointer; text-decoration:none;
          border:1px solid transparent; transition:all .2s; background:transparent;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .mo-nav-link:hover { color:#fff; background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.1); }
        .mo-nav-cta {
          padding:9px 18px; border-radius:12px; font-size:13px; font-weight:700;
          color:#fff; cursor:pointer; text-decoration:none;
          background:linear-gradient(135deg,rgba(123,90,196,.5),rgba(123,90,196,.3));
          border:1px solid rgba(123,90,196,.3); transition:all .2s;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .mo-nav-cta:hover { background:linear-gradient(135deg,rgba(123,90,196,.7),rgba(123,90,196,.5)); border-color:rgba(123,90,196,.5); }

        /* ── HERO BODY ── */
        .mo-hero-body {
          flex:1; position:relative; z-index:10;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:48px 24px 64px;
          text-align:center;
          max-width:740px; margin:0 auto; width:100%;
        }
        .mo-badge {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(0,180,204,.1); border:1px solid rgba(0,180,204,.25);
          backdrop-filter:blur(12px);
          border-radius:999px; padding:6px 16px; margin-bottom:26px;
          font-size:11.5px; font-weight:700; color:rgba(100,220,235,.85); letter-spacing:.06em;
        }
        .mo-badge-dot { width:6px; height:6px; border-radius:50%; background:#00B4CC; flex-shrink:0; }

        .mo-hero-title {
          font-size:clamp(26px,5vw,42px);
          font-weight:800; line-height:1.15; letter-spacing:-.025em;
          margin:0 0 18px; color:#fff;
        }
        .mo-hero-em {
          background:linear-gradient(90deg, #4ECFDB 0%, #9EF0F8 35%, #4ECFDB 65%, #8EE8F0 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimT 10s linear infinite;
          display:block;
        }
        .mo-hero-sub {
          font-size:clamp(14px,2.2vw,17px); font-weight:400;
          color:rgba(255,255,255,.5); line-height:1.7; margin:0 0 36px;
          max-width:480px;
        }

        /* ── ALREADY REGISTERED BANNER ── */
        .mo-registered-banner {
          width:100%; max-width:400px;
          background:rgba(0,180,204,.08);
          border:1px solid rgba(0,180,204,.25);
          border-radius:16px; padding:14px 18px;
          display:flex; align-items:flex-start; gap:12px;
          margin-bottom:16px; text-align:right;
        }
        .mo-banner-icon {
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:rgba(0,180,204,.18);
          display:flex; align-items:center; justify-content:center;
        }
        .mo-banner-title { font-size:13.5px; font-weight:800; color:#fff; margin-bottom:4px; }
        .mo-banner-sub   { font-size:12px; color:rgba(255,255,255,.5); line-height:1.5; }

        /* ── GLASS CTA CARD ── */
        .mo-card {
          width:100%; max-width:400px;
          background:rgba(255,255,255,.04);
          backdrop-filter:blur(28px) saturate(180%);
          -webkit-backdrop-filter:blur(28px) saturate(180%);
          border:1px solid rgba(255,255,255,.12);
          border-radius:28px;
          padding:28px 28px 24px;
          box-shadow:
            0 24px 64px rgba(0,0,0,.48),
            0 0 0 1px rgba(0,180,204,.07),
            inset 0 1px 0 rgba(255,255,255,.1);
          position:relative; overflow:hidden;
        }
        .mo-card::before {
          content:'';
          position:absolute; top:-55px; left:50%; transform:translateX(-50%);
          width:200px; height:110px; border-radius:50%;
          background:radial-gradient(ellipse, rgba(0,140,160,.45) 0%, transparent 70%);
          pointer-events:none;
        }
        .mo-card-bar {
          height:2px; width:100%;
          background:linear-gradient(90deg,rgba(0,180,204,.7),rgba(201,168,76,.6),rgba(123,90,196,.5));
          border-radius:1px; margin-bottom:22px;
        }
        .mo-card-title { font-size:17px; font-weight:800; color:#fff; margin:0 0 3px; letter-spacing:-.01em; }
        .mo-card-sub   { font-size:12.5px; color:rgba(255,255,255,.42); margin:0 0 20px; }

        /* Google button */
        .mo-goog-btn {
          width:100%; height:54px; border-radius:16px;
          display:flex; align-items:center; justify-content:center; gap:12px;
          font-family:'Heebo',system-ui,sans-serif; font-size:15px; font-weight:700;
          cursor:pointer; outline:none; position:relative; overflow:hidden;
          background:rgba(255,255,255,.08);
          backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
          border:1px solid rgba(255,255,255,.22);
          color:#fff;
          box-shadow:0 4px 20px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.12);
          transition:all .25s; letter-spacing:-.01em;
        }
        .mo-goog-btn:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.35); box-shadow:0 6px 28px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.18); transform:translateY(-1px); }
        .mo-goog-btn:active { transform:scale(.98); }
        .mo-goog-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .mo-goog-icon { background:rgba(255,255,255,.92); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Trust */
        .mo-trust { display:flex; align-items:center; justify-content:center; gap:14px; margin-top:16px; flex-wrap:wrap; }
        .mo-trust-item { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:rgba(255,255,255,.32); }
        .mo-trust-check { width:14px; height:14px; border-radius:50%; background:rgba(21,128,61,.25); border:1px solid rgba(21,128,61,.45); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mo-err { background:rgba(220,38,38,.14); border:1px solid rgba(220,38,38,.28); border-radius:10px; padding:10px 14px; font-size:13px; color:#FCA5A5; margin-top:10px; text-align:center; }

        /* Mumedet link */
        .mo-mm-link {
          display:inline-flex; align-items:center; gap:5px; margin-top:13px;
          font-size:12px; font-weight:600; color:rgba(155,114,207,.65);
          text-decoration:none; letter-spacing:.03em;
          border-bottom:1px solid rgba(155,114,207,.18); padding-bottom:1px;
          transition:all .2s;
        }
        .mo-mm-link:hover { color:rgba(155,114,207,.9); border-color:rgba(155,114,207,.45); }

        /* ── SECTION BASE ── */
        .mo-section { padding:88px 24px; max-width:1100px; margin:0 auto; }
        .mo-section-label {
          font-size:11px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:rgba(0,180,204,.7);
          margin-bottom:12px; text-align:center;
        }
        .mo-section-title {
          font-size:clamp(24px,4.5vw,38px); font-weight:900;
          color:#fff; letter-spacing:-.03em; line-height:1.15;
          text-align:center; margin-bottom:14px;
        }
        .mo-section-sub {
          font-size:15px; color:rgba(255,255,255,.42); line-height:1.65;
          text-align:center; max-width:500px; margin:0 auto 52px;
        }

        /* ── STEPS LIST ── */
        .mo-steps-list { display:flex; flex-direction:column; gap:10px; max-width:560px; margin:0 auto; }
        .mo-step-row {
          display:flex; align-items:flex-start; gap:18px;
          padding:20px 24px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.07);
          border-radius:18px;
          transition:background .25s, border-color .25s, transform .2s;
        }
        .mo-step-row:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.12); transform:translateX(-2px); }
        .mo-step-num-badge {
          width:42px; height:42px; border-radius:50%; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800;
        }
        .mo-step-title { font-size:15px; font-weight:800; color:#fff; margin-bottom:5px; letter-spacing:-.01em; }
        .mo-step-desc  { font-size:13px; color:rgba(255,255,255,.46); line-height:1.6; }

        /* ── ACTIONS GRID ── */
        .mo-actions-grid2 {
          display:grid; grid-template-columns:repeat(2,1fr); gap:10px;
          max-width:640px; margin:0 auto;
        }
        @media(max-width:600px){ .mo-actions-grid2 { grid-template-columns:1fr; } }
        .mo-action-card {
          display:flex; align-items:flex-start; gap:14px;
          padding:16px 18px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.07);
          border-radius:16px;
          transition:background .25s, border-color .25s, transform .2s;
        }
        .mo-action-card:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.13); transform:translateY(-2px); }
        .mo-action-icon-wrap {
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }
        .mo-action-title { font-size:13px; font-weight:800; color:#fff; margin-bottom:3px; letter-spacing:-.01em; }
        .mo-action-desc  { font-size:11.5px; color:rgba(255,255,255,.42); line-height:1.5; }

        /* ── FLOW ── */
        .mo-flow-wrap {
          display:flex; align-items:center; justify-content:center;
          gap:6px; flex-wrap:wrap; padding:8px 0;
        }
        .mo-flow-bubble { padding:8px 16px; border-radius:12px; font-size:12.5px; font-weight:800; }
        .mo-flow-arrow  { color:rgba(255,255,255,.2); font-size:14px; flex-shrink:0; }

        /* ── FINAL CTA ── */
        .mo-final-cta {
          padding:96px 24px;
          background:linear-gradient(160deg, #06121A 0%, #0A1E28 40%, #060E18 100%);
          border-top:1px solid rgba(255,255,255,.05);
          text-align:center; position:relative; overflow:hidden;
        }
        .mo-final-orb {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:600px; height:280px; border-radius:50%;
          background:radial-gradient(ellipse, rgba(0,140,160,.26) 0%, transparent 65%);
          pointer-events:none; animation:glow 6s ease-in-out infinite;
        }
        .mo-final-inner { position:relative; z-index:1; max-width:540px; margin:0 auto; }
        .mo-final-title { font-size:clamp(26px,5vw,44px); font-weight:900; color:#fff; letter-spacing:-.03em; line-height:1.12; margin-bottom:14px; }
        .mo-final-sub   { font-size:15px; color:rgba(255,255,255,.42); line-height:1.65; margin-bottom:36px; }
        .mo-final-btn {
          display:inline-flex; align-items:center; gap:12px;
          padding:16px 36px; border-radius:18px; border:none;
          font-family:'Heebo',system-ui,sans-serif; font-size:16px; font-weight:800;
          cursor:pointer; color:#fff; letter-spacing:-.01em;
          background:linear-gradient(135deg, #006B78, #008C9C 50%, #00B4CC);
          box-shadow:0 8px 36px rgba(0,140,160,.52), 0 0 60px rgba(0,140,160,.16);
          transition:all .25s; position:relative; overflow:hidden;
        }
        .mo-final-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.12),transparent); border-radius:inherit; }
        .mo-final-btn:hover { box-shadow:0 12px 44px rgba(0,140,160,.7), 0 0 80px rgba(0,180,204,.2); transform:translateY(-2px); }
        .mo-final-btn:active { transform:scale(.97); }
        .mo-final-btn:disabled { opacity:.58; cursor:not-allowed; transform:none; }
        .mo-final-g-icon { background:rgba(255,255,255,.14); border-radius:10px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* ── FOOTER ── */
        .mo-footer {
          padding:26px 24px; border-top:1px solid rgba(255,255,255,.05);
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:10px; max-width:1100px; margin:0 auto;
        }
        .mo-footer-left { font-size:11px; color:rgba(255,255,255,.28); }
        .mo-footer-links { display:flex; gap:14px; }
        .mo-footer-link { font-size:11px; color:rgba(255,255,255,.28); text-decoration:none; transition:color .2s; }
        .mo-footer-link:hover { color:rgba(255,255,255,.6); }

        /* fade-in */
        .mo-fadein { opacity:0; animation:fadeUp .72s cubic-bezier(.16,1,.3,1) forwards; }
        .mo-d1 { animation-delay:.1s; }
        .mo-d2 { animation-delay:.22s; }
        .mo-d3 { animation-delay:.36s; }
        .mo-d4 { animation-delay:.5s; }
      `}</style>

      <div className="mo-root">

        {/* ══ HERO ══ */}
        <div className="mo-hero">
          <div className="mo-hero-bg" />
          <div className="mo-orb mo-orb-1" />
          <div className="mo-orb mo-orb-2" />
          <div className="mo-orb mo-orb-3" />
          <div className="mo-vline" />

          {/* NAV */}
          <nav className="mo-nav">
            <a href="/" className="mo-logo-wrap">
              <div className="mo-logo-box">
                <Image src="/logo-chabad.png" alt="השביל" width={42} height={42} style={{ objectFit:'contain' }} />
              </div>
              <div>
                <div className="mo-logo-name">הַשְּׁבִיל</div>
                <div className="mo-logo-sub">מערכת חכמה לגיוס והשמה</div>
              </div>
            </a>
            <div className="mo-nav-links">
              <a href="#steps"   className="mo-nav-link">תהליך הכניסה</a>
              <a href="#actions" className="mo-nav-link">מה עושים</a>
              <a href="/mumedet" className="mo-nav-cta">פורטל מועמדת</a>
            </div>
          </nav>

          {/* HERO BODY */}
          <div className="mo-hero-body" style={{ opacity: visible ? 1 : 0, transition:'opacity .5s ease' }}>

            <div className="mo-badge mo-fadein mo-d1">
              <div className="mo-badge-dot" />
              <Building2 size={12} />
              פורטל מוסד &nbsp;•&nbsp; גיוס והשמה
            </div>

            <h1 className="mo-hero-title mo-fadein mo-d1">
              ברוכים הבאים<br />
              <span className="mo-hero-em">המוסד שלכם רשום</span>
            </h1>

            <p className="mo-hero-sub mo-fadein mo-d2">
              הנתונים שלכם כבר קיימים במערכת —<br />
              כנסו עם Google, עדכנו פרטים ופרסמו משרות
            </p>

            {/* REGISTERED BANNER */}
            <div className="mo-registered-banner mo-fadein mo-d2">
              <div className="mo-banner-icon">
                <CheckCircle size={18} color="#00B4CC" />
              </div>
              <div>
                <div className="mo-banner-title">כבר רשומים במערכת</div>
                <div className="mo-banner-sub">
                  כנסו עם המייל שבו המוסד שלכם רשום — הפרופיל ייפתח אוטומטית ללא שלבי הרשמה נוספים
                </div>
              </div>
            </div>

            {/* GLASS CTA CARD */}
            <div className="mo-card mo-fadein mo-d3">
              <div className="mo-card-bar" />
              <div className="mo-card-title">כניסה למערכת המוסד</div>
              <div className="mo-card-sub">השתמשו במייל שבו המוסד רשום במערכת</div>

              <button className="mo-goog-btn" onClick={signIn} disabled={pending}>
                <div className="mo-goog-icon"><GoogleIcon /></div>
                <span>{pending ? 'מתחבר...' : 'כניסה עם Google'}</span>
              </button>

              {err && <div className="mo-err">{err}</div>}

              <div className="mo-trust">
                {['כניסה מיידית', 'ללא הרשמה', 'עדכוני WhatsApp'].map(t => (
                  <span key={t} className="mo-trust-item">
                    <span className="mo-trust-check">
                      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {t}
                  </span>
                ))}
              </div>

              <div style={{ textAlign:'center' }}>
                <a href="/mumedet" className="mo-mm-link">
                  <GraduationCap size={12} />
                  פורטל מועמדת
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ══ STEPS ══ */}
        <div id="steps">
          <div className="mo-section">
            <div className="mo-section-label">תהליך הכניסה</div>
            <h2 className="mo-section-title">שלושה צעדים פשוטים</h2>
            <p className="mo-section-sub">
              הנתונים שלכם כבר קיימים — תוך דקות תהיו בפנים ומוכנים לגייס
            </p>

            <div className="mo-steps-list">
              {STEPS.map(s => (
                <div key={s.n} className="mo-step-row">
                  <div className="mo-step-num-badge" style={{ background:`${s.color}18`, border:`1.5px solid ${s.color}44`, color:s.color, boxShadow:`0 0 14px ${s.glow}` }}>{s.n}</div>
                  <div>
                    <div className="mo-step-title">{s.title}</div>
                    <div className="mo-step-desc">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ACTIONS ══ */}
        <div id="actions">
          <div className="mo-section" style={{ paddingTop:'72px' }}>
            <div className="mo-section-label">מה עושים בפנים</div>
            <h2 className="mo-section-title">עדכון ופרסום — הכל במקום אחד</h2>
            <p className="mo-section-sub">
              עדכנו את פרטי המוסד, פרסמו משרות ונהלו מועמדויות — הכל ממסך אחד
            </p>

            <div className="mo-actions-grid2">
              {ACTIONS.map(({ icon: Icon, title, desc, c, bg }) => (
                <div key={title} className="mo-action-card">
                  <div className="mo-action-icon-wrap" style={{ background:bg }}>
                    <Icon size={16} color={c} />
                  </div>
                  <div>
                    <div className="mo-action-title">{title}</div>
                    <div className="mo-action-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ APPLICATION FLOW ══ */}
        <div>
          <div className="mo-section" style={{ paddingTop:'56px', paddingBottom:'56px' }}>
            <div className="mo-section-label">מחזור חיים של מועמדות</div>
            <h2 className="mo-section-title" style={{ fontSize:'clamp(22px,3.5vw,32px)', marginBottom:'8px' }}>איך נראה התהליך?</h2>
            <p className="mo-section-sub" style={{ marginBottom:'32px' }}>כל שלב מתעדכן אוטומטית — לכם ולמועמדת</p>

            <div className="mo-flow-wrap">
              {[
                { label:'הגשה',   c:'#00B4CC', bg:'rgba(0,180,204,.15)' },
                { label:'נצפתה',  c:'#C9A84C', bg:'rgba(201,168,76,.12)' },
                { label:'ראיון',  c:'#7B5AC4', bg:'rgba(123,90,196,.12)' },
                { label:'שיבוץ', c:'#15803D', bg:'rgba(21,128,61,.12)' },
                { label:'משוב',   c:'#C9A84C', bg:'rgba(201,168,76,.1)' },
              ].map(({ label, c, bg }, i, arr) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div className="mo-flow-bubble" style={{ background:bg, color:c }}>{label}</div>
                  {i < arr.length - 1 && <span className="mo-flow-arrow">›</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ FINAL CTA ══ */}
        <div className="mo-final-cta">
          <div className="mo-final-orb" />
          <div className="mo-final-inner">
            <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.12em', color:'rgba(0,180,204,.6)', textTransform:'uppercase', marginBottom:'16px' }}>
              <LogIn size={13} style={{ display:'inline', marginLeft:'6px' }} />
              מוכנים להתחיל?
            </div>
            <h2 className="mo-final-title">
              כנסו עם המייל שלכם<br />והתחילו לגייס
            </h2>
            <p className="mo-final-sub">
              הנתונים כבר מחכים לכם — כניסה ראשונה לוקחת דקה
            </p>
            <button className="mo-final-btn" onClick={signIn} disabled={pending}>
              <div className="mo-final-g-icon"><GoogleIcon /></div>
              <span>{pending ? 'מתחבר...' : 'כניסה עם Google'}</span>
            </button>
            <div style={{ marginTop:'16px', fontSize:'11.5px', color:'rgba(255,255,255,.28)' }}>
              השתמשו במייל שבו המוסד רשום במערכת
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="mo-footer">
          <div className="mo-footer-left">
            © 2026 הַשְּׁבִיל · עתודות לשליחות · כל הזכויות שמורות
          </div>
          <div className="mo-footer-links">
            <a href="/"        className="mo-footer-link">עמוד הבית</a>
            <a href="/mumedet" className="mo-footer-link">פורטל מועמדת</a>
          </div>
        </div>

      </div>
    </>
  )
}
