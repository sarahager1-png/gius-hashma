'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Search, Star, MessageCircle, Bell,
  CheckCircle, ClipboardList, MapPin, BookOpen, Users, Building2,
} from 'lucide-react'

/* ─────────────────────────── data ─────────────────────────── */

const JOURNEY = [
  { n: '01', title: 'נרשמים',           sub: 'פתיחת פרופיל מהירה', color: '#C9A84C', glow: 'rgba(201,168,76,.35)' },
  { n: '02', title: 'בונים פרופיל',      sub: 'המערכת לומדת את הכישורים וההעדפות שלך', color: '#00B4CC', glow: 'rgba(0,180,204,.3)' },
  { n: '03', title: 'מקבלים התאמות',    sub: 'התאמה חכמה לפי אזור, גיל, סוג מוסד ושליחות', color: '#7B5AC4', glow: 'rgba(123,90,196,.3)' },
  { n: '04', title: 'מתחברים למוסדות', sub: 'תקשורת ישירה ועדכונים בזמן אמת', color: '#00B4CC', glow: 'rgba(0,180,204,.3)' },
  { n: '05', title: 'מתחילים שליחות',   sub: 'כניסה לתפקיד שמתאים באמת', color: '#C9A84C', glow: 'rgba(201,168,76,.35)' },
]

const FEATURES = [
  { icon: FileText,      title: 'פרופיל מקצועי',         desc: 'התמחות, ניסיון, כישורים וביו', c: '#7B5AC4' },
  { icon: Search,        title: 'חיפוש מתקדם',            desc: 'סנני לפי עיר, מחוז, סוג ותחום', c: '#00B4CC' },
  { icon: Star,          title: 'התאמות חכמות',           desc: 'המערכת מציגה משרות שמתאימות לך', c: '#C9A84C' },
  { icon: CheckCircle,   title: 'מעקב הגשות',             desc: 'סטטוס בזמן אמת לכל מועמדות', c: '#15803D' },
  { icon: MessageCircle, title: 'תקשורת ישירה',           desc: 'מוסדות פונים ישירות למועמדת', c: '#7B5AC4' },
  { icon: Bell,          title: 'עדכוני WhatsApp',         desc: 'כל עדכון מגיע ב-WhatsApp', c: '#00B4CC' },
  { icon: ClipboardList, title: 'קורות חיים',              desc: 'העלאת PDF/Word או קישור', c: '#C9A84C' },
  { icon: MapPin,        title: 'לפי מיקום',               desc: 'משרות קרובות לפי עיר ומחוז', c: '#15803D' },
]

/* ─────────────────────────── Google SVG ─────────────────────────── */
const GoogleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

/* ─────────────────────────── component ─────────────────────────── */
export default function LandingPage() {
  const [pending, setPending] = useState(false)
  const [err, setErr]         = useState('')
  const [visible, setVisible] = useState(false)
  const journeyRef = useRef<HTMLDivElement>(null)

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
    if (error) { setErr('שגיאה בכניסה עם Google'); setPending(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        /* ── Animations ── */
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes glow   { 0%,100%{opacity:.22} 50%{opacity:.42} }
        @keyframes shimG  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes shimT  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        *, *::before, *::after { box-sizing: border-box; }

        .lp-root {
          background: #061A28;
          color: #fff;
          font-family: 'Heebo', system-ui, sans-serif;
          direction: rtl;
          overflow-x: hidden;
        }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100svh;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .lp-hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 160% 90% at 50% 15%, rgba(0,210,240,.75) 0%, rgba(0,175,210,.5) 28%, rgba(0,130,160,.2) 52%, transparent 72%),
            radial-gradient(ellipse 70%  55% at 85% 85%,  rgba(201,168,76,.18) 0%, transparent 55%),
            radial-gradient(ellipse 55%  40% at -5% 60%,  rgba(123,90,196,.12) 0%, transparent 52%),
            linear-gradient(180deg, #071E30 0%, #061A28 100%);
        }
        .lp-stars { display: none; }
        /* Floating orbs */
        .lp-orb { position:absolute; border-radius:50%; pointer-events:none; }
        .lp-orb-1 { top:5%; right:-10%; width:440px; height:440px; background:radial-gradient(circle, rgba(0,180,204,.14) 0%, transparent 65%); animation:float 16s ease-in-out infinite; }
        .lp-orb-2 { bottom:8%; left:-8%; width:360px; height:360px; background:radial-gradient(circle, rgba(123,90,196,.08) 0%, transparent 65%); animation:float 20s ease-in-out infinite reverse; }
        .lp-orb-3 { display:none; }
        .lp-vline { display:none; }

        /* Atmospheric silhouettes */
        .lp-silhouettes {
          position:absolute; bottom:0; left:0; right:0; height:260px;
          background:linear-gradient(0deg, rgba(201,168,76,.04) 0%, transparent 100%);
          pointer-events:none; overflow:hidden;
        }

        /* ── NAV ── */
        .lp-nav {
          position: relative; z-index:20;
          display:flex; align-items:center; justify-content:space-between;
          padding: 22px 24px 0;
          max-width:1100px; margin:0 auto; width:100%;
        }
        .lp-logo-wrap { display:flex; align-items:center; gap:14px; text-decoration:none; }
        .lp-logo-box {
          width:60px; height:60px; background:#fff; border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 6px 24px rgba(0,0,0,.32); padding:5px; flex-shrink:0;
        }
        .lp-logo-text-name { font-size:26px; font-weight:900; color:#fff; letter-spacing:-.03em; line-height:1; }
        .lp-logo-text-sub  { font-size:10.5px; font-weight:500; color:rgba(255,255,255,.45); letter-spacing:.06em; margin-top:2px; }
        .lp-nav-links { display:flex; align-items:center; gap:6px; }
        .lp-nav-link {
          padding:8px 14px; border-radius:10px; font-size:13px; font-weight:600;
          color:rgba(255,255,255,.55); cursor:pointer; text-decoration:none;
          border:1px solid transparent; transition:all .2s; background:transparent;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .lp-nav-link:hover { color:#fff; background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.1); }
        .lp-nav-cta {
          padding:9px 18px; border-radius:12px; font-size:13px; font-weight:700;
          color:#fff; cursor:pointer; text-decoration:none;
          background:linear-gradient(135deg,rgba(91,58,171,.6),rgba(0,180,204,.5));
          border:1px solid rgba(255,255,255,.15); transition:all .2s;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .lp-nav-cta:hover { background:linear-gradient(135deg,rgba(91,58,171,.8),rgba(0,180,204,.7)); }

        /* ── HERO CONTENT ── */
        .lp-hero-body {
          flex:1; position:relative; z-index:10;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:48px 24px 60px;
          text-align:center;
          max-width:780px; margin:0 auto; width:100%;
        }
        .lp-badge {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
          backdrop-filter:blur(12px);
          border-radius:999px; padding:6px 16px; margin-bottom:28px;
          font-size:12px; font-weight:700; color:rgba(255,255,255,.8); letter-spacing:.06em;
        }
        .lp-badge-dot { width:6px; height:6px; border-radius:50%; background:#C9A84C; }

        .lp-hero-title {
          font-size: clamp(28px, 5vw, 44px);
          font-weight:800; line-height:1.15; letter-spacing:-.025em;
          margin:0 0 16px; color:#fff;
        }
        .lp-hero-title-em {
          background:linear-gradient(90deg, #D4B06A 0%, #F5E090 40%, #D4B06A 70%, #F0D080 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimG 10s linear infinite;
          display:block;
        }
        .lp-hero-sub {
          font-size:clamp(15px,2.5vw,18px); font-weight:400;
          color:rgba(255,255,255,.55); line-height:1.65; margin:0 0 10px;
          max-width:500px;
        }
        .lp-hero-micro {
          font-size:12.5px; font-weight:500; color:rgba(255,255,255,.3);
          letter-spacing:.04em; margin-bottom:44px;
        }
        .lp-hero-micro span { margin:0 6px; color:rgba(201,168,76,.5); }

        /* Not-a-job-search tagline */
        .lp-tagline {
          font-size:13px; font-weight:600;
          color:rgba(201,168,76,.65); letter-spacing:.04em;
          margin-bottom:40px; font-style:italic;
        }

        /* ── GLASS CTA CARD ── */
        .lp-card {
          width:100%; max-width:400px;
          background:rgba(255,255,255,.05);
          backdrop-filter:blur(24px) saturate(180%);
          -webkit-backdrop-filter:blur(24px) saturate(180%);
          border:1px solid rgba(255,255,255,.14);
          border-radius:28px;
          padding:28px 28px 24px;
          box-shadow:
            0 24px 60px rgba(0,0,0,.45),
            0 0 0 1px rgba(255,255,255,.06),
            inset 0 1px 0 rgba(255,255,255,.1);
          position:relative; overflow:hidden;
        }
        .lp-card::before {
          content:'';
          position:absolute; top:-60px; left:50%; transform:translateX(-50%);
          width:220px; height:120px; border-radius:50%;
          background:radial-gradient(ellipse, rgba(91,58,171,.4) 0%, transparent 70%);
          pointer-events:none;
        }
        .lp-card-top-bar {
          height:2px; width:100%;
          background:linear-gradient(90deg,rgba(201,168,76,.6),rgba(0,180,204,.6),rgba(91,58,171,.6));
          border-radius:1px; margin-bottom:22px;
        }
        .lp-card-title { font-size:17px; font-weight:800; color:#fff; margin:0 0 3px; letter-spacing:-.01em; }
        .lp-card-sub   { font-size:12.5px; color:rgba(255,255,255,.45); margin:0 0 20px; }

        /* Google button */
        .lp-goog-btn {
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
        .lp-goog-btn:hover {
          background:rgba(255,255,255,.14);
          border-color:rgba(255,255,255,.35);
          box-shadow:0 6px 28px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.18);
          transform:translateY(-1px);
        }
        .lp-goog-btn:active { transform:scale(.98); }
        .lp-goog-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .lp-goog-icon {
          background:rgba(255,255,255,.92); border-radius:8px;
          width:30px; height:30px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        /* Trust */
        .lp-trust { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:16px; flex-wrap:wrap; }
        .lp-trust-item { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:rgba(255,255,255,.35); }
        .lp-trust-check { width:14px; height:14px; border-radius:50%; background:rgba(21,128,61,.3); border:1px solid rgba(21,128,61,.5); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .lp-err { background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.3); border-radius:10px; padding:10px 14px; font-size:13px; color:#FCA5A5; margin-top:10px; text-align:center; }

        /* ── SECTION BASE ── */
        .lp-section { padding:96px 24px; max-width:1100px; margin:0 auto; }
        .lp-section-label {
          font-size:11px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:rgba(201,168,76,.7);
          margin-bottom:12px; text-align:center;
        }
        .lp-section-title {
          font-size:clamp(26px,4.5vw,40px); font-weight:900;
          color:#fff; letter-spacing:-.03em; line-height:1.15;
          text-align:center; margin-bottom:14px;
        }
        .lp-section-sub {
          font-size:15px; color:rgba(255,255,255,.45); line-height:1.65;
          text-align:center; max-width:520px; margin:0 auto 60px;
        }

        /* ── JOURNEY ── */
        .lp-journey-wrap { position:relative; padding:0 12px; }
        .lp-journey-line {
          position:absolute; top:32px; right:32px; left:32px; height:2px;
          background:linear-gradient(90deg, rgba(201,168,76,.0) 0%, rgba(201,168,76,.25) 20%, rgba(0,180,204,.25) 50%, rgba(91,58,171,.25) 80%, rgba(91,58,171,.0) 100%);
          display:none;
        }
        @media(min-width:640px){ .lp-journey-line { display:block; } }
        .lp-journey-steps { display:flex; flex-direction:column; gap:16px; }
        @media(min-width:640px){ .lp-journey-steps { flex-direction:row; gap:12px; } }

        .lp-step {
          flex:1; display:flex; flex-direction:column; align-items:center;
          gap:14px; text-align:center; position:relative;
          padding:22px 16px 20px;
          background:rgba(255,255,255,.035);
          border:1px solid rgba(255,255,255,.08);
          border-radius:18px; backdrop-filter:blur(12px);
          transition:all .3s;
        }
        .lp-step:hover { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.14); transform:translateY(-3px); }
        .lp-step-num {
          width:48px; height:48px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; letter-spacing:.04em;
          flex-shrink:0; position:relative; z-index:1;
        }
        .lp-step-num-inner { position:absolute; inset:0; border-radius:50%; animation:glow 4s ease-in-out infinite; }
        .lp-step-n { font-size:11px; font-weight:700; color:rgba(255,255,255,.35); letter-spacing:.06em; margin-bottom:2px; }
        .lp-step-title { font-size:14px; font-weight:800; color:#fff; line-height:1.2; margin-bottom:5px; }
        .lp-step-sub { font-size:12px; color:rgba(255,255,255,.45); line-height:1.5; }
        .lp-step-connector {
          display:none; align-items:center; flex-shrink:0; padding-top:20px; color:rgba(255,255,255,.15);
        }
        @media(min-width:640px){ .lp-step-connector { display:flex; } }

        /* ── FEATURES ── */
        .lp-feat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media(min-width:640px){ .lp-feat-grid { grid-template-columns:repeat(4,1fr); } }

        .lp-feat {
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
          border-radius:16px; padding:18px 16px;
          backdrop-filter:blur(10px); transition:all .25s; cursor:default;
        }
        .lp-feat:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.13); transform:translateY(-2px); }
        .lp-feat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
        .lp-feat-title { font-size:13.5px; font-weight:800; color:#fff; margin-bottom:4px; }
        .lp-feat-desc { font-size:11.5px; color:rgba(255,255,255,.4); line-height:1.45; }

        /* ── TRUST SECTION ── */
        .lp-trust-section {
          padding:80px 24px;
          background:linear-gradient(135deg, rgba(91,58,171,.08) 0%, rgba(0,180,204,.05) 100%);
          border-top:1px solid rgba(255,255,255,.05);
          border-bottom:1px solid rgba(255,255,255,.05);
        }
        .lp-trust-inner { max-width:900px; margin:0 auto; text-align:center; }
        .lp-trust-pills { display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:32px; }
        .lp-trust-pill {
          display:flex; align-items:center; gap:8px;
          background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
          border-radius:999px; padding:9px 18px;
          font-size:13px; font-weight:600; color:rgba(255,255,255,.65);
        }
        .lp-trust-pill-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .lp-trust-counters { display:flex; align-items:center; justify-content:center; gap:40px; flex-wrap:wrap; margin-top:44px; }
        .lp-counter-item { text-align:center; }
        .lp-counter-val { font-size:28px; font-weight:900; color:#fff; letter-spacing:-.02em; display:block; }
        .lp-counter-label { font-size:12px; color:rgba(255,255,255,.4); margin-top:3px; }

        /* ── QUOTE ── */
        .lp-quote-section { padding:80px 24px; text-align:center; }
        .lp-quote-wrap {
          max-width:560px; margin:0 auto;
          padding:40px 36px;
          background:rgba(201,168,76,.05);
          border:1px solid rgba(201,168,76,.15);
          border-radius:24px;
          position:relative; overflow:hidden;
        }
        .lp-quote-wrap::before {
          content:'';
          position:absolute; inset:0;
          background:radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,.07) 0%, transparent 70%);
          pointer-events:none;
        }
        .lp-quote-mark { font-size:72px; line-height:1; color:rgba(201,168,76,.25); font-family:Georgia,serif; margin-bottom:-12px; }
        .lp-quote-text { font-size:20px; font-weight:800; color:rgba(255,255,255,.88); line-height:1.5; margin-bottom:16px; letter-spacing:.01em; }
        .lp-quote-author { font-size:12px; font-weight:600; color:rgba(201,168,76,.65); letter-spacing:.06em; }

        /* ── FINAL CTA ── */
        .lp-final-cta {
          padding:100px 24px;
          background:linear-gradient(160deg, #0E1E2C 0%, #0F2030 40%, #0D1A22 100%);
          border-top:1px solid rgba(255,255,255,.05);
          text-align:center; position:relative; overflow:hidden;
        }
        .lp-final-orb {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:600px; height:300px; border-radius:50%;
          background:radial-gradient(ellipse, rgba(91,58,171,.25) 0%, transparent 65%);
          pointer-events:none; animation:glow 6s ease-in-out infinite;
        }
        .lp-final-inner { position:relative; z-index:1; max-width:600px; margin:0 auto; }
        .lp-final-title { font-size:clamp(28px,5vw,48px); font-weight:900; color:#fff; letter-spacing:-.03em; line-height:1.12; margin-bottom:14px; }
        .lp-final-sub { font-size:15px; color:rgba(255,255,255,.45); line-height:1.65; margin-bottom:40px; }
        .lp-final-btn {
          display:inline-flex; align-items:center; gap:12px;
          padding:16px 36px; border-radius:18px; border:none;
          font-family:'Heebo',system-ui,sans-serif; font-size:16px; font-weight:800;
          cursor:pointer; color:#fff; letter-spacing:-.01em;
          background:linear-gradient(135deg,#3D2480,#5B3AAB 50%,#00B4CC);
          box-shadow:0 8px 36px rgba(91,58,171,.55), 0 0 60px rgba(91,58,171,.2);
          transition:all .25s; position:relative; overflow:hidden;
        }
        .lp-final-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);
          border-radius:inherit;
        }
        .lp-final-btn:hover { box-shadow:0 12px 44px rgba(91,58,171,.7), 0 0 80px rgba(0,180,204,.25); transform:translateY(-2px); }
        .lp-final-btn:active { transform:scale(.97); }
        .lp-final-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .lp-final-g-icon { background:rgba(255,255,255,.15); border-radius:10px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* ── FOOTER ── */
        .lp-footer {
          padding:28px 24px; border-top:1px solid rgba(255,255,255,.05);
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:12px; max-width:1100px; margin:0 auto;
        }
        .lp-footer-left { font-size:11.5px; color:rgba(255,255,255,.3); }
        .lp-footer-links { display:flex; gap:16px; }
        .lp-footer-link { font-size:11.5px; color:rgba(255,255,255,.3); text-decoration:none; transition:color .2s; }
        .lp-footer-link:hover { color:rgba(255,255,255,.65); }

        /* ── MOSAD LINK ── */
        .lp-mosad-link {
          display:inline-flex; align-items:center; gap:6px; margin-top:14px;
          font-size:12.5px; font-weight:600; color:rgba(0,180,204,.7);
          text-decoration:none; letter-spacing:.03em;
          border-bottom:1px solid rgba(0,180,204,.2); padding-bottom:1px;
          transition:all .2s;
        }
        .lp-mosad-link:hover { color:rgba(0,180,204,.95); border-color:rgba(0,180,204,.5); }

        /* fade-in */
        .lp-fadein { opacity:0; animation:fadeUp .7s cubic-bezier(.16,1,.3,1) forwards; }
        .lp-delay-1 { animation-delay:.1s; }
        .lp-delay-2 { animation-delay:.22s; }
        .lp-delay-3 { animation-delay:.36s; }
        .lp-delay-4 { animation-delay:.5s; }
      `}</style>

      <div className="lp-root">

        {/* ══ HERO ══ */}
        <div className="lp-hero">
          <div className="lp-hero-bg" />
          <div className="lp-stars" />
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
          <div className="lp-vline" />

          {/* Atmospheric silhouette layer */}
          <div className="lp-silhouettes" />

          {/* NAV */}
          <nav className="lp-nav">
            <div className="lp-logo-wrap">
              <div className="lp-logo-box">
                <Image src="/logo-chabad.png" alt="השביל" width={50} height={50} style={{ objectFit:'contain' }} />
              </div>
              <div>
                <div className="lp-logo-text-name">הַשְּׁבִיל</div>
                <div className="lp-logo-text-sub">מערכת חכמה לגיוס והשמה</div>
              </div>
            </div>
            <div className="lp-nav-links">
              <a href="#journey" className="lp-nav-link">המסלול</a>
              <a href="#features" className="lp-nav-link">יכולות</a>
              <a href="/mosad" className="lp-nav-cta">כניסת מוסד</a>
            </div>
          </nav>

          {/* HERO BODY */}
          <div className="lp-hero-body" style={{ opacity: visible ? 1 : 0, transition:'opacity .5s ease' }}>

            {/* Brand */}
            <div className={`lp-fadein lp-delay-1`} style={{ marginBottom:'28px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
              <div style={{
                width:'76px', height:'76px', background:'#fff', borderRadius:'22px',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 8px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.12)',
                padding:'6px', flexShrink:0,
              }}>
                <Image src="/logo-chabad.png" alt="השביל" width={60} height={60} style={{ objectFit:'contain' }} />
              </div>
              <div style={{ fontSize:'38px', fontWeight:900, color:'#fff', letterSpacing:'-.035em', lineHeight:1 }}>
                הַשְּׁבִיל
              </div>
              <div style={{ fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,.45)', letterSpacing:'.08em' }}>
                מערכת חכמה לגיוס והשמה
              </div>
            </div>

            <div className={`lp-badge lp-fadein lp-delay-1`}>
              <div className="lp-badge-dot" />
              גיוס והשמה &nbsp;•&nbsp; רשת חינוך חב״ד
            </div>

            <h1 className={`lp-hero-title lp-fadein lp-delay-1`}>
              מצאי את<br />
              <span className="lp-hero-title-em">שביל השליחות</span>
              שלך
            </h1>

            <p className={`lp-hero-sub lp-fadein lp-delay-2`}>
              השביל שמחבר בין אנשים לשליחות חינוכית
            </p>

            {/* GLASS CTA CARD */}
            <div className={`lp-card lp-fadein lp-delay-3`}>
              <div className="lp-card-top-bar" />
              <div className="lp-card-title">כניסה למערכת המועמדת</div>
              <div className="lp-card-sub">מועמדת חדשה? הפרופיל נפתח אוטומטית</div>

              <button className="lp-goog-btn" onClick={signIn} disabled={pending}>
                <div className="lp-goog-icon"><GoogleIcon /></div>
                <span>{pending ? 'מחברת...' : 'כניסה / הרשמה עם Google'}</span>
              </button>

              {err && <div className="lp-err">{err}</div>}

              <div className="lp-trust">
                {['הרשמה מהירה', 'עדכוני WhatsApp', 'התאמה אישית למוסדות'].map(t => (
                  <span key={t} className="lp-trust-item">
                    <span className="lp-trust-check">
                      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {t}
                  </span>
                ))}
              </div>

              <div style={{ textAlign:'center' }}>
                <a href="/mosad" className="lp-mosad-link">
                  <Building2 size={13} />
                  כניסה למערכת המוסד
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ══ JOURNEY ══ */}
        <div id="journey" style={{ background:'rgba(255,255,255,.015)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
          <div className="lp-section">
            <div className="lp-section-label">המסלול</div>
            <h2 className="lp-section-title">איך השביל עובד?</h2>
            <p className="lp-section-sub">
              חמישה צעדים פשוטים — מהרגע שנרשמת ועד שמצאת את המקום שלך
            </p>

            <div className="lp-journey-wrap" ref={journeyRef}>
              <div className="lp-journey-line" />
              <div className="lp-journey-steps">
                {JOURNEY.map((s) => (
                  <div key={s.n} className="lp-step">
                    <div className="lp-step-num" style={{
                      background:`radial-gradient(circle, ${s.color}22 0%, ${s.color}10 100%)`,
                      border:`1.5px solid ${s.color}44`,
                      boxShadow:`0 0 18px ${s.glow}`,
                    }}>
                      <div className="lp-step-num-inner" style={{ background:`radial-gradient(circle, ${s.glow} 0%, transparent 70%)` }} />
                      <span style={{ color: s.color, fontSize:'14px', fontWeight:900, position:'relative', zIndex:1 }}>{s.n}</span>
                    </div>
                    <div className="lp-step-title">{s.title}</div>
                    <div className="lp-step-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ FEATURES ══ */}
        <div id="features">
          <div className="lp-section" style={{ paddingTop:'80px' }}>
            <div className="lp-section-label">יכולות המערכת</div>
            <h2 className="lp-section-title">מה מחכה לך במערכת?</h2>
            <p className="lp-section-sub">
              כלים שנבנו עבור שליחות חינוכית — לא תוכנת HR גנרית
            </p>

            <div className="lp-feat-grid">
              {FEATURES.map(({ icon: Icon, title, desc, c }) => (
                <div key={title} className="lp-feat">
                  <div className="lp-feat-icon" style={{ background:`${c}18` }}>
                    <Icon size={17} color={c} />
                  </div>
                  <div className="lp-feat-title">{title}</div>
                  <div className="lp-feat-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TRUST ══ */}
        <div className="lp-trust-section">
          <div className="lp-trust-inner">
            <div className="lp-section-label">הרשת שמאחורינו</div>
            <h2 className="lp-section-title" style={{ marginBottom:'8px' }}>נבנה עבור עולם החינוך החב״די</h2>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,.4)', lineHeight:1.65, maxWidth:'440px', margin:'0 auto' }}>
              פלטפורמה רשמית לרשת חינוך חב״ד — מוסדות, שלוחים ומועמדות
            </p>

            <div className="lp-trust-pills">
              {[
                { label:'בתי חינוך',              dot:'#C9A84C', icon: BookOpen },
                { label:'בתי ספר קהילתיים',       dot:'#7B5AC4', icon: Building2 },
                { label:'בתי ספר שלהבות',         dot:'#00B4CC', icon: Star },
                { label:'תיכונים וחט״ב',           dot:'#15803D', icon: Users },
              ].map(({ label, dot, icon: Icon }) => (
                <div key={label} className="lp-trust-pill">
                  <span className="lp-trust-pill-dot" style={{ background: dot }} />
                  <Icon size={13} color={dot} />
                  {label}
                </div>
              ))}
            </div>

          </div>
        </div>


        {/* ══ QUOTE ══ */}
        <div className="lp-quote-section">
          <div className="lp-quote-wrap">
            <div className="lp-quote-mark">&ldquo;</div>
            <p className="lp-quote-text">
              נהניתי ממה שכותב אודות בתו.. תחי&apos; שרוצה לקבל משרה בבתי-ספר הרשת. ובוודאי יחזקו אותה ברצון הטוב זה והכי נכון, כי עבודה במוסד של כ&quot;ק מו&quot;ח אדמו&quot;ר זצוקללה&quot;ה נבג&quot;מ זי&quot;ע ובפרט במקצוע החינוך על טהרת הקודש – הרי זה צינור וכלי לקבלת ברכות השי&quot;ת בכלל.
            </p>
            <div className="lp-quote-author">התקשרות · יט-לו · עמוד 115</div>
          </div>
        </div>

        {/* ══ FINAL CTA ══ */}
        <div className="lp-final-cta">
          <div className="lp-final-orb" />
          <div className="lp-final-inner">
            <div style={{ fontSize:'11.5px', fontWeight:700, letterSpacing:'.12em', color:'rgba(201,168,76,.65)', textTransform:'uppercase', marginBottom:'16px' }}>
              מוכנות להתחיל?
            </div>
            <h2 className="lp-final-title">
              מוכנות להתחיל<br />את השביל שלכן?
            </h2>
            <p className="lp-final-sub">
              הרשמה קצרה. התאמה אישית. התחלה חדשה.
            </p>
            <button className="lp-final-btn" onClick={signIn} disabled={pending}>
              <div className="lp-final-g-icon"><GoogleIcon /></div>
              <span>{pending ? 'מחברת...' : 'כניסה עם Google'}</span>
            </button>
            <div style={{ marginTop:'18px', fontSize:'12px', color:'rgba(255,255,255,.3)' }}>
              מועמדת חדשה? הפרופיל ייפתח אוטומטית
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="lp-footer">
          <div className="lp-footer-left">
            © 2026 הַשְּׁבִיל · כל הזכויות שמורות
          </div>
          <div className="lp-footer-links">
            <a href="/mosad" className="lp-footer-link">פורטל מוסד</a>
            <a href="/mumedet" className="lp-footer-link">פורטל מועמדת</a>
            <a href="/register/admin" className="lp-footer-link">הנהלה</a>
          </div>
        </div>

      </div>
    </>
  )
}
