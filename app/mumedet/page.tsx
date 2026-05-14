'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Search, Star, MessageCircle, Bell,
  CheckCircle, ClipboardList, MapPin, GraduationCap,
  Building2, Sparkles, ArrowLeft,
} from 'lucide-react'

/* ─────────────────────────── data ─────────────────────────── */

const JOURNEY = [
  { n: '01', title: 'נרשמת',             sub: 'כניסה חד-פעמית עם Google — פרופיל נפתח אוטומטית', color: '#C9A84C', glow: 'rgba(201,168,76,.35)' },
  { n: '02', title: 'בונה פרופיל',        sub: 'התמחות, ניסיון, עיר וסוג משרה מועדף', color: '#9B72CF', glow: 'rgba(155,114,207,.35)' },
  { n: '03', title: 'מגישה מועמדות',     sub: 'חיפוש לפי עיר, התמחות וסוג מוסד — הגשה בקליק', color: '#7B5AC4', glow: 'rgba(123,90,196,.35)' },
  { n: '04', title: 'מקבלת הצעות',       sub: 'מוסדות מגיעים אליך — ראיונות ישירות מ-WhatsApp', color: '#00B4CC', glow: 'rgba(0,180,204,.3)' },
  { n: '05', title: 'מתחילה שליחות',     sub: 'כניסה לתפקיד שמתאים לך ולחזון שלך', color: '#C9A84C', glow: 'rgba(201,168,76,.35)' },
]

const FEATURES = [
  { icon: FileText,       title: 'פרופיל מקצועי',   desc: 'התמחות, ניסיון, כישורים וביו אישי',   c: '#9B72CF' },
  { icon: ClipboardList,  title: 'קורות חיים',        desc: 'העלאת PDF/Word או קישור חיצוני',      c: '#C9A84C' },
  { icon: Search,         title: 'חיפוש מתקדם',      desc: 'מחוז, עיר, סוג מוסד וסוג משרה',       c: '#00B4CC' },
  { icon: CheckCircle,    title: 'מעקב הגשות',        desc: 'סטטוס בזמן אמת — מהגשה ועד שיבוץ',   c: '#15803D' },
  { icon: Star,           title: 'התאמות חכמות',     desc: 'המערכת מציגה משרות שמתאימות לפרופיל', c: '#C9A84C' },
  { icon: Bell,           title: 'עדכוני WhatsApp',   desc: 'כל התפתחות מגיעה ב-WhatsApp',         c: '#00B4CC' },
  { icon: MessageCircle,  title: 'תקשורת ישירה',     desc: 'מוסדות פונים ישירות אלייך',            c: '#9B72CF' },
  { icon: MapPin,         title: 'לפי מיקום',         desc: 'משרות קרובות לפי עיר ומחוז',          c: '#15803D' },
]

const AUTOMATIONS = [
  { icon: Star,          title: 'התאמה חכמה',          desc: 'כשנפתחת משרה שמתאימה לפרופיל שלך — מקבלת התראה מיידית',            c: '#C9A84C', bg: 'rgba(201,168,76,.12)' },
  { icon: Bell,          title: 'עדכון סטטוס',          desc: 'ממתינה → נצפתה → הוזמנה לראיון — כל שלב מגיע ב-WhatsApp',         c: '#9B72CF', bg: 'rgba(155,114,207,.12)' },
  { icon: CheckCircle,   title: 'תזכורת ראיון',         desc: '24 שעות לפני הראיון — תזכורת אוטומטית עם שם המוסד ומיקומו',        c: '#00B4CC', bg: 'rgba(0,180,204,.12)' },
  { icon: MessageCircle, title: 'סקר שביעות רצון',      desc: 'חודש לאחר תחילת השליחות — שאלון קצר לשיפור ולמידה',                 c: '#15803D', bg: 'rgba(21,128,61,.12)' },
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
export default function MumedetLanding() {
  const [pending, setPending] = useState(false)
  const [err, setErr]         = useState('')
  const [visible, setVisible] = useState(false)

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
    if (error) { setErr('שגיאה בכניסה עם Google. נסי שוב.'); setPending(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes floatA { 0%,100%{transform:translateY(0)}        50%{transform:translateY(-14px)} }
        @keyframes floatB { 0%,100%{transform:translateY(-6px)}     50%{transform:translateY(8px)} }
        @keyframes glow   { 0%,100%{opacity:.22} 50%{opacity:.44} }
        @keyframes shimP  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ── Root ── */
        .mm-root {
          background:#110E24;
          color:#fff;
          font-family:'Heebo',system-ui,sans-serif;
          direction:rtl;
          overflow-x:hidden;
        }

        /* ── HERO ── */
        .mm-hero {
          min-height:100svh;
          position:relative;
          display:flex;
          flex-direction:column;
          overflow:hidden;
        }
        .mm-hero-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse 100% 65% at 50% -5%,  rgba(123,90,196,.6)  0%, transparent 58%),
            radial-gradient(ellipse 65%  50% at 85% 85%,  rgba(201,168,76,.18) 0%, transparent 55%),
            radial-gradient(ellipse 55%  40% at -8% 55%,  rgba(0,180,204,.12)  0%, transparent 52%),
            linear-gradient(170deg, #181430 0%, #1E1438 40%, #121E2E 75%, #110E24 100%);
        }
        .mm-stars { display: none; }
        .mm-orb { position:absolute; border-radius:50%; pointer-events:none; }
        .mm-orb-1 { top:5%;   right:-10%; width:440px; height:440px; background:radial-gradient(circle, rgba(123,90,196,.16) 0%, transparent 65%); animation:floatA 16s ease-in-out infinite; }
        .mm-orb-2 { bottom:8%; left:-8%;  width:360px; height:360px; background:radial-gradient(circle, rgba(0,180,204,.09)  0%, transparent 65%); animation:floatB 20s ease-in-out infinite; }
        .mm-orb-3 { display:none; }
        .mm-vline { display:none; }

        /* ── NAV ── */
        .mm-nav {
          position:relative; z-index:20;
          display:flex; align-items:center; justify-content:space-between;
          padding:22px 24px 0;
          max-width:1100px; margin:0 auto; width:100%;
        }
        .mm-logo-wrap { display:flex; align-items:center; gap:12px; text-decoration:none; }
        .mm-logo-box {
          width:50px; height:50px; background:#fff; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 18px rgba(0,0,0,.28); padding:4px; flex-shrink:0;
        }
        .mm-logo-name { font-size:20px; font-weight:900; color:#fff; letter-spacing:-.025em; }
        .mm-logo-sub  { font-size:10px; font-weight:500; color:rgba(255,255,255,.4); letter-spacing:.06em; }
        .mm-nav-links { display:flex; align-items:center; gap:6px; }
        .mm-nav-link {
          padding:8px 14px; border-radius:10px; font-size:13px; font-weight:600;
          color:rgba(255,255,255,.55); cursor:pointer; text-decoration:none;
          border:1px solid transparent; transition:all .2s; background:transparent;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .mm-nav-link:hover { color:#fff; background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.1); }
        .mm-nav-cta {
          padding:9px 18px; border-radius:12px; font-size:13px; font-weight:700;
          color:#fff; cursor:pointer; text-decoration:none;
          background:linear-gradient(135deg,rgba(0,180,204,.5),rgba(0,180,204,.3));
          border:1px solid rgba(0,180,204,.3); transition:all .2s;
          font-family:'Heebo',system-ui,sans-serif;
        }
        .mm-nav-cta:hover { background:linear-gradient(135deg,rgba(0,180,204,.7),rgba(0,180,204,.5)); border-color:rgba(0,180,204,.5); }

        /* ── HERO BODY ── */
        .mm-hero-body {
          flex:1; position:relative; z-index:10;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:48px 24px 64px;
          text-align:center;
          max-width:760px; margin:0 auto; width:100%;
        }
        .mm-badge {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(155,114,207,.12); border:1px solid rgba(155,114,207,.25);
          backdrop-filter:blur(12px);
          border-radius:999px; padding:6px 16px; margin-bottom:26px;
          font-size:11.5px; font-weight:700; color:rgba(200,170,255,.85); letter-spacing:.06em;
        }
        .mm-badge-dot { width:6px; height:6px; border-radius:50%; background:#C9A84C; flex-shrink:0; }

        .mm-hero-title {
          font-size:clamp(28px,5vw,44px);
          font-weight:800; line-height:1.15; letter-spacing:-.025em;
          margin:0 0 16px; color:#fff;
        }
        .mm-hero-em {
          background:linear-gradient(90deg, #C9A84C 0%, #F0D080 35%, #C9A84C 65%, #E8C870 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimP 10s linear infinite;
          display:block;
        }
        .mm-hero-sub {
          font-size:clamp(15px,2.2vw,17px); font-weight:400;
          color:rgba(255,255,255,.52); line-height:1.68; margin:0 0 10px;
          max-width:480px;
        }
        .mm-hero-micro {
          font-size:12px; font-weight:500; color:rgba(255,255,255,.28);
          letter-spacing:.05em; margin-bottom:42px;
        }
        .mm-hero-micro span { margin:0 6px; color:rgba(155,114,207,.5); }
        .mm-tagline {
          font-size:13px; font-weight:600;
          color:rgba(201,168,76,.6); letter-spacing:.04em;
          margin-bottom:38px; font-style:italic;
        }

        /* ── GLASS CTA CARD ── */
        .mm-card {
          width:100%; max-width:400px;
          background:rgba(255,255,255,.045);
          backdrop-filter:blur(28px) saturate(180%);
          -webkit-backdrop-filter:blur(28px) saturate(180%);
          border:1px solid rgba(255,255,255,.13);
          border-radius:28px;
          padding:28px 28px 24px;
          box-shadow:
            0 24px 64px rgba(0,0,0,.48),
            0 0 0 1px rgba(155,114,207,.08),
            inset 0 1px 0 rgba(255,255,255,.1);
          position:relative; overflow:hidden;
        }
        .mm-card::before {
          content:'';
          position:absolute; top:-55px; left:50%; transform:translateX(-50%);
          width:200px; height:110px; border-radius:50%;
          background:radial-gradient(ellipse, rgba(123,90,196,.45) 0%, transparent 70%);
          pointer-events:none;
        }
        .mm-card-bar {
          height:2px; width:100%;
          background:linear-gradient(90deg,rgba(201,168,76,.65),rgba(155,114,207,.65),rgba(0,180,204,.5));
          border-radius:1px; margin-bottom:22px;
        }
        .mm-card-title { font-size:17px; font-weight:800; color:#fff; margin:0 0 3px; letter-spacing:-.01em; }
        .mm-card-sub   { font-size:12.5px; color:rgba(255,255,255,.42); margin:0 0 20px; }

        /* Google button */
        .mm-goog-btn {
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
        .mm-goog-btn:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.35); box-shadow:0 6px 28px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.18); transform:translateY(-1px); }
        .mm-goog-btn:active { transform:scale(.98); }
        .mm-goog-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .mm-goog-icon { background:rgba(255,255,255,.92); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Trust bar */
        .mm-trust { display:flex; align-items:center; justify-content:center; gap:14px; margin-top:16px; flex-wrap:wrap; }
        .mm-trust-item { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:rgba(255,255,255,.32); }
        .mm-trust-check { width:14px; height:14px; border-radius:50%; background:rgba(21,128,61,.25); border:1px solid rgba(21,128,61,.45); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mm-err { background:rgba(220,38,38,.14); border:1px solid rgba(220,38,38,.28); border-radius:10px; padding:10px 14px; font-size:13px; color:#FCA5A5; margin-top:10px; text-align:center; }

        /* Mosad link */
        .mm-mosad-link {
          display:inline-flex; align-items:center; gap:5px; margin-top:13px;
          font-size:12px; font-weight:600; color:rgba(0,180,204,.65);
          text-decoration:none; letter-spacing:.03em;
          border-bottom:1px solid rgba(0,180,204,.18); padding-bottom:1px;
          transition:all .2s;
        }
        .mm-mosad-link:hover { color:rgba(0,180,204,.9); border-color:rgba(0,180,204,.45); }

        /* ── SECTION BASE ── */
        .mm-section { padding:88px 24px; max-width:1100px; margin:0 auto; }
        .mm-section-label {
          font-size:11px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:rgba(201,168,76,.7);
          margin-bottom:12px; text-align:center;
        }
        .mm-section-title {
          font-size:clamp(26px,4.5vw,40px); font-weight:900;
          color:#fff; letter-spacing:-.03em; line-height:1.15;
          text-align:center; margin-bottom:14px;
        }
        .mm-section-sub {
          font-size:15px; color:rgba(255,255,255,.42); line-height:1.65;
          text-align:center; max-width:500px; margin:0 auto 56px;
        }

        /* ── JOURNEY ── */
        .mm-journey-steps { display:flex; flex-direction:column; gap:14px; }
        @media(min-width:640px) { .mm-journey-steps { flex-direction:row; gap:10px; } }

        .mm-step {
          flex:1; display:flex; flex-direction:column; align-items:center;
          gap:12px; text-align:center; position:relative;
          padding:22px 14px 20px;
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.07);
          border-radius:18px; backdrop-filter:blur(10px);
          transition:all .3s;
        }
        .mm-step:hover { background:rgba(155,114,207,.07); border-color:rgba(155,114,207,.2); transform:translateY(-3px); }
        .mm-step-num {
          width:46px; height:46px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; letter-spacing:.04em;
          flex-shrink:0; position:relative;
        }
        .mm-step-num-glow { position:absolute; inset:0; border-radius:50%; animation:glow 4s ease-in-out infinite; }
        .mm-step-title { font-size:14px; font-weight:800; color:#fff; line-height:1.2; }
        .mm-step-sub { font-size:11.5px; color:rgba(255,255,255,.42); line-height:1.5; }

        /* ── AUTOMATIONS ── */
        .mm-auto-grid { display:grid; grid-template-columns:1fr; gap:10px; }
        @media(min-width:560px) { .mm-auto-grid { grid-template-columns:1fr 1fr; } }

        .mm-auto-item {
          display:flex; align-items:flex-start; gap:14px;
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          border-radius:16px; padding:18px 16px;
          backdrop-filter:blur(10px); transition:all .25s;
        }
        .mm-auto-item:hover { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.12); }
        .mm-auto-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mm-auto-title { font-size:13.5px; font-weight:800; color:#fff; margin-bottom:4px; }
        .mm-auto-desc  { font-size:12px; color:rgba(255,255,255,.4); line-height:1.5; }

        /* ── FEATURES ── */
        .mm-feat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        @media(min-width:640px) { .mm-feat-grid { grid-template-columns:repeat(4,1fr); } }

        .mm-feat {
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          border-radius:15px; padding:18px 15px;
          backdrop-filter:blur(10px); transition:all .25s;
        }
        .mm-feat:hover { background:rgba(155,114,207,.06); border-color:rgba(155,114,207,.18); transform:translateY(-2px); }
        .mm-feat-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
        .mm-feat-title { font-size:13px; font-weight:800; color:#fff; margin-bottom:4px; }
        .mm-feat-desc  { font-size:11px; color:rgba(255,255,255,.38); line-height:1.45; }

        /* ── FLOW ── */
        .mm-flow-wrap {
          display:flex; align-items:center; justify-content:center;
          gap:6px; flex-wrap:wrap; padding:8px 0;
        }
        .mm-flow-bubble {
          padding:8px 16px; border-radius:12px;
          font-size:12.5px; font-weight:800;
        }
        .mm-flow-arrow { color:rgba(255,255,255,.2); font-size:14px; flex-shrink:0; }

        /* ── TRUST SECTION ── */
        .mm-trust-section {
          padding:72px 24px;
          background:linear-gradient(135deg, rgba(123,90,196,.07) 0%, rgba(0,180,204,.04) 100%);
          border-top:1px solid rgba(255,255,255,.05);
          border-bottom:1px solid rgba(255,255,255,.05);
        }
        .mm-trust-inner { max-width:800px; margin:0 auto; text-align:center; }
        .mm-trust-pills { display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:28px; }
        .mm-trust-pill {
          display:flex; align-items:center; gap:7px;
          background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
          border-radius:999px; padding:8px 16px;
          font-size:12.5px; font-weight:600; color:rgba(255,255,255,.62);
        }
        .mm-trust-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

        /* ── QUOTE ── */
        .mm-quote-section { padding:72px 24px; text-align:center; }
        .mm-quote-wrap {
          max-width:520px; margin:0 auto;
          padding:38px 34px;
          background:rgba(155,114,207,.05);
          border:1px solid rgba(155,114,207,.15);
          border-radius:24px;
          position:relative; overflow:hidden;
        }
        .mm-quote-wrap::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse 75% 55% at 50% 50%, rgba(155,114,207,.07) 0%, transparent 70%);
          pointer-events:none;
        }
        .mm-quote-mark  { font-size:64px; line-height:1; color:rgba(201,168,76,.22); font-family:Georgia,serif; margin-bottom:-8px; }
        .mm-quote-text  { font-size:18px; font-weight:800; color:rgba(255,255,255,.86); line-height:1.55; margin-bottom:14px; letter-spacing:.01em; }
        .mm-quote-auth  { font-size:11.5px; font-weight:600; color:rgba(201,168,76,.6); letter-spacing:.06em; }

        /* ── FINAL CTA ── */
        .mm-final-cta {
          padding:96px 24px;
          background:linear-gradient(160deg, #0D0A1E 0%, #190F30 40%, #0C1320 100%);
          border-top:1px solid rgba(255,255,255,.05);
          text-align:center; position:relative; overflow:hidden;
        }
        .mm-final-orb {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:600px; height:280px; border-radius:50%;
          background:radial-gradient(ellipse, rgba(123,90,196,.28) 0%, transparent 65%);
          pointer-events:none; animation:glow 6s ease-in-out infinite;
        }
        .mm-final-inner { position:relative; z-index:1; max-width:560px; margin:0 auto; }
        .mm-final-title { font-size:clamp(28px,5vw,48px); font-weight:900; color:#fff; letter-spacing:-.03em; line-height:1.12; margin-bottom:14px; }
        .mm-final-sub   { font-size:15px; color:rgba(255,255,255,.42); line-height:1.65; margin-bottom:38px; }
        .mm-final-btn {
          display:inline-flex; align-items:center; gap:12px;
          padding:16px 36px; border-radius:18px; border:none;
          font-family:'Heebo',system-ui,sans-serif; font-size:16px; font-weight:800;
          cursor:pointer; color:#fff; letter-spacing:-.01em;
          background:linear-gradient(135deg, #3D2480, #5B3AAB 50%, #7B5AC4);
          box-shadow:0 8px 36px rgba(91,58,171,.55), 0 0 60px rgba(91,58,171,.18);
          transition:all .25s; position:relative; overflow:hidden;
        }
        .mm-final-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.12),transparent); border-radius:inherit; }
        .mm-final-btn:hover { box-shadow:0 12px 44px rgba(91,58,171,.72), 0 0 80px rgba(155,114,207,.22); transform:translateY(-2px); }
        .mm-final-btn:active { transform:scale(.97); }
        .mm-final-btn:disabled { opacity:.58; cursor:not-allowed; transform:none; }
        .mm-final-g-icon { background:rgba(255,255,255,.14); border-radius:10px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* ── FOOTER ── */
        .mm-footer {
          padding:26px 24px; border-top:1px solid rgba(255,255,255,.05);
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:10px; max-width:1100px; margin:0 auto;
        }
        .mm-footer-left { font-size:11px; color:rgba(255,255,255,.28); }
        .mm-footer-links { display:flex; gap:14px; }
        .mm-footer-link { font-size:11px; color:rgba(255,255,255,.28); text-decoration:none; transition:color .2s; }
        .mm-footer-link:hover { color:rgba(255,255,255,.6); }

        /* fade-in */
        .mm-fadein { opacity:0; animation:fadeUp .72s cubic-bezier(.16,1,.3,1) forwards; }
        .mm-d1 { animation-delay:.1s; }
        .mm-d2 { animation-delay:.22s; }
        .mm-d3 { animation-delay:.36s; }
        .mm-d4 { animation-delay:.5s; }
      `}</style>

      <div className="mm-root">

        {/* ══ HERO ══ */}
        <div className="mm-hero">
          <div className="mm-hero-bg" />
          <div className="mm-stars" />
          <div className="mm-orb mm-orb-1" />
          <div className="mm-orb mm-orb-2" />
          <div className="mm-orb mm-orb-3" />
          <div className="mm-vline" />

          {/* NAV */}
          <nav className="mm-nav">
            <a href="/" className="mm-logo-wrap">
              <div className="mm-logo-box">
                <Image src="/logo-chabad.png" alt="השביל" width={42} height={42} style={{ objectFit:'contain' }} />
              </div>
              <div>
                <div className="mm-logo-name">הַשְּׁבִיל</div>
                <div className="mm-logo-sub">מערכת חכמה לגיוס והשמה</div>
              </div>
            </a>
            <div className="mm-nav-links">
              <a href="#journey" className="mm-nav-link">המסלול</a>
              <a href="#features" className="mm-nav-link">יכולות</a>
              <a href="/mosad" className="mm-nav-cta">כניסת מוסד</a>
            </div>
          </nav>

          {/* HERO BODY */}
          <div className="mm-hero-body" style={{ opacity: visible ? 1 : 0, transition:'opacity .5s ease' }}>

            <div className="mm-badge mm-fadein mm-d1">
              <div className="mm-badge-dot" />
              <GraduationCap size={12} />
              פורטל מועמדת &nbsp;•&nbsp; גיוס והשמה
            </div>

            <h1 className="mm-hero-title mm-fadein mm-d1">
              מצאי את<br />
              <span className="mm-hero-em">שביל השליחות</span>
              שלך
            </h1>

            <p className="mm-hero-sub mm-fadein mm-d2">
              פלטפורמת הגיוס הרשמית של רשת חינוך חב״ד —<br />
              פרופיל אחד, כל המשרות, עדכון בוואטסאפ
            </p>

            {/* GLASS CTA CARD */}
            <div className="mm-card mm-fadein mm-d3">
              <div className="mm-card-bar" />
              <div className="mm-card-title">כניסה למערכת המועמדת</div>
              <div className="mm-card-sub">מועמדת חדשה? הפרופיל ייפתח אוטומטית</div>

              <button className="mm-goog-btn" onClick={signIn} disabled={pending}>
                <div className="mm-goog-icon"><GoogleIcon /></div>
                <span>{pending ? 'מחברת...' : 'כניסה / הרשמה עם Google'}</span>
              </button>

              {err && <div className="mm-err">{err}</div>}

              <div className="mm-trust">
                {['הרשמה חינמית', 'פחות מ-5 דקות', 'עדכוני WhatsApp'].map(t => (
                  <span key={t} className="mm-trust-item">
                    <span className="mm-trust-check">
                      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {t}
                  </span>
                ))}
              </div>

              <div style={{ textAlign:'center' }}>
                <a href="/mosad" className="mm-mosad-link">
                  <Building2 size={12} />
                  כניסה למערכת המוסד
                  <ArrowLeft size={10} />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ══ JOURNEY ══ */}
        <div id="journey" style={{ background:'rgba(255,255,255,.012)', borderTop:'1px solid rgba(255,255,255,.055)', borderBottom:'1px solid rgba(255,255,255,.055)' }}>
          <div className="mm-section">
            <div className="mm-section-label">המסלול שלך</div>
            <h2 className="mm-section-title">חמישה צעדים לשליחות</h2>
            <p className="mm-section-sub">
              מהרגע שנרשמת ועד שמצאת את המקום שלך — המערכת איתך בכל שלב
            </p>

            <div className="mm-journey-steps">
              {JOURNEY.map(s => (
                <div key={s.n} className="mm-step">
                  <div className="mm-step-num" style={{
                    background:`radial-gradient(circle, ${s.color}22 0%, ${s.color}0E 100%)`,
                    border:`1.5px solid ${s.color}44`,
                    boxShadow:`0 0 18px ${s.glow}`,
                  }}>
                    <div className="mm-step-num-glow" style={{ background:`radial-gradient(circle, ${s.glow} 0%, transparent 70%)` }} />
                    <span style={{ color:s.color, fontSize:'13px', fontWeight:900, position:'relative', zIndex:1 }}>{s.n}</span>
                  </div>
                  <div className="mm-step-title">{s.title}</div>
                  <div className="mm-step-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ AUTOMATIONS ══ */}
        <div>
          <div className="mm-section" style={{ paddingTop:'72px' }}>
            <div className="mm-section-label">אוטומציות חכמות</div>
            <h2 className="mm-section-title">המערכת עובדת בשבילך</h2>
            <p className="mm-section-sub">
              עדכונים בזמן אמת, תזכורות ואוטומציות שמחסכות זמן ומונעות החמצה
            </p>

            <div className="mm-auto-grid">
              {AUTOMATIONS.map(({ icon: Icon, title, desc, c, bg }) => (
                <div key={title} className="mm-auto-item">
                  <div className="mm-auto-icon" style={{ background:bg }}>
                    <Icon size={17} color={c} />
                  </div>
                  <div>
                    <div className="mm-auto-title">{title}</div>
                    <div className="mm-auto-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ APPLICATION FLOW ══ */}
        <div style={{ background:'rgba(255,255,255,.01)', borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <div className="mm-section" style={{ paddingTop:'56px', paddingBottom:'56px' }}>
            <div className="mm-section-label">מחזור חיים של הגשה</div>
            <h2 className="mm-section-title" style={{ marginBottom:'8px', fontSize:'clamp(22px,3.5vw,32px)' }}>מה קורה אחרי שמגישים?</h2>
            <p className="mm-section-sub" style={{ marginBottom:'32px' }}>כל שלב מתעדכן אוטומטית ב-WhatsApp</p>

            <div className="mm-flow-wrap">
              {[
                { label:'הגשה',    c:'#9B72CF', bg:'rgba(155,114,207,.15)' },
                { label:'נצפתה',   c:'#00B4CC', bg:'rgba(0,180,204,.12)' },
                { label:'ראיון',   c:'#C9A84C', bg:'rgba(201,168,76,.12)' },
                { label:'התקבלה', c:'#15803D', bg:'rgba(21,128,61,.12)' },
                { label:'שיבוץ',  c:'#C9A84C', bg:'rgba(201,168,76,.1)' },
              ].map(({ label, c, bg }, i, arr) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div className="mm-flow-bubble" style={{ background:bg, color:c }}>
                    {label}
                  </div>
                  {i < arr.length - 1 && <span className="mm-flow-arrow">›</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ FEATURES ══ */}
        <div id="features">
          <div className="mm-section" style={{ paddingTop:'72px' }}>
            <div className="mm-section-label">יכולות המערכת</div>
            <h2 className="mm-section-title">מה מחכה לך?</h2>
            <p className="mm-section-sub">
              כלים שנבנו עבור שליחות חינוכית — לא תוכנת HR גנרית
            </p>

            <div className="mm-feat-grid">
              {FEATURES.map(({ icon: Icon, title, desc, c }) => (
                <div key={title} className="mm-feat">
                  <div className="mm-feat-icon" style={{ background:`${c}18` }}>
                    <Icon size={16} color={c} />
                  </div>
                  <div className="mm-feat-title">{title}</div>
                  <div className="mm-feat-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TRUST ══ */}
        <div className="mm-trust-section">
          <div className="mm-trust-inner">
            <div className="mm-section-label">הרשת שמאחורינו</div>
            <h2 className="mm-section-title" style={{ marginBottom:'8px' }}>נבנה עבור עולם השליחות</h2>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,.38)', lineHeight:1.65, maxWidth:'420px', margin:'0 auto' }}>
              פלטפורמה רשמית לרשת חינוך חב״ד — מוסדות, שלוחים ומועמדות
            </p>

            <div className="mm-trust-pills">
              {[
                { label:'בתי חינוך',              dot:'#C9A84C' },
                { label:'בתי ספר קהילתיים',       dot:'#9B72CF' },
                { label:'בתי ספר שלהבות',         dot:'#00B4CC' },
                { label:'תיכונים וחט״ב',           dot:'#15803D' },
              ].map(({ label, dot }) => (
                <div key={label} className="mm-trust-pill">
                  <span className="mm-trust-dot" style={{ background:dot }} />
                  <Sparkles size={12} color={dot} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ══ FINAL CTA ══ */}
        <div className="mm-final-cta">
          <div className="mm-final-orb" />
          <div className="mm-final-inner">
            <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.12em', color:'rgba(201,168,76,.6)', textTransform:'uppercase', marginBottom:'16px' }}>
              מוכנה להתחיל?
            </div>
            <h2 className="mm-final-title">
              מוכנה להתחיל<br />את השביל שלך?
            </h2>
            <p className="mm-final-sub">
              הרשמה קצרה. התאמה אישית. התחלה חדשה.
            </p>
            <button className="mm-final-btn" onClick={signIn} disabled={pending}>
              <div className="mm-final-g-icon"><GoogleIcon /></div>
              <span>{pending ? 'מחברת...' : 'כניסה עם Google'}</span>
            </button>
            <div style={{ marginTop:'16px', fontSize:'11.5px', color:'rgba(255,255,255,.28)' }}>
              מועמדת חדשה? הפרופיל ייפתח אוטומטית
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="mm-footer">
          <div className="mm-footer-left">
            © 2026 הַשְּׁבִיל · עתודות לשליחות · כל הזכויות שמורות
          </div>
          <div className="mm-footer-links">
            <a href="/"       className="mm-footer-link">עמוד הבית</a>
            <a href="/mosad"  className="mm-footer-link">פורטל מוסד</a>
          </div>
        </div>

      </div>
    </>
  )
}
