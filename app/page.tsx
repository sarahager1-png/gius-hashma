'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Search, Star, MessageCircle, Bell,
  CheckCircle, ClipboardList, MapPin, BookOpen, Users, Building2, ChevronDown, X,
} from 'lucide-react'

/* ─────────────────────────── data ─────────────────────────── */

const JOURNEY = [
  { n: '01', title: 'נרשמים',           sub: 'פתיחת פרופיל מהירה', color: '#C9A84C' },
  { n: '02', title: 'בונים פרופיל',      sub: 'המערכת לומדת את הכישורים וההעדפות שלך', color: '#00B4CC' },
  { n: '03', title: 'מקבלים התאמות',    sub: 'התאמה חכמה לפי אזור, גיל, סוג מוסד ושליחות', color: '#7B5AC4' },
  { n: '04', title: 'מתחברים למוסדות', sub: 'תקשורת ישירה ועדכונים בזמן אמת', color: '#00B4CC' },
  { n: '05', title: 'מתחילים שליחות',   sub: 'כניסה לתפקיד שמתאים באמת', color: '#C9A84C' },
]

const FEATURES = [
  { icon: FileText,      title: 'פרופיל מקצועי',   desc: 'התמחות, ניסיון, כישורים וביו', c: '#7B5AC4' },
  { icon: Search,        title: 'חיפוש מתקדם',      desc: 'סנני לפי עיר, מחוז, סוג ותחום', c: '#00B4CC' },
  { icon: Star,          title: 'התאמות חכמות',     desc: 'המערכת מציגה משרות שמתאימות לך', c: '#C9A84C' },
  { icon: CheckCircle,   title: 'מעקב הגשות',       desc: 'סטטוס בזמן אמת לכל מועמדות', c: '#15803D' },
  { icon: MessageCircle, title: 'תקשורת ישירה',     desc: 'מוסדות פונים ישירות למועמדת', c: '#7B5AC4' },
  { icon: Bell,          title: 'עדכוני WhatsApp',   desc: 'כל עדכון מגיע ב-WhatsApp', c: '#00B4CC' },
  { icon: ClipboardList, title: 'קורות חיים',        desc: 'העלאת PDF/Word או קישור', c: '#C9A84C' },
  { icon: MapPin,        title: 'לפי מיקום',         desc: 'משרות קרובות לפי עיר ומחוז', c: '#15803D' },
]

const NETWORK = [
  { label: 'בתי חינוך',          dot: '#C9A84C', icon: BookOpen },
  { label: 'בתי ספר קהילתיים',   dot: '#7B5AC4', icon: Building2 },
  { label: 'בתי ספר שלהבות',     dot: '#00B4CC', icon: Star },
  { label: 'תיכונים וחט״ב',       dot: '#15803D', icon: Users },
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

type Panel = 'journey' | 'features' | 'network' | null

/* ─────────────────────────── component ─────────────────────────── */
export default function LandingPage() {
  const [pending, setPending]   = useState(false)
  const [err, setErr]           = useState('')
  const [visible, setVisible]   = useState(false)
  const [panel, setPanel]       = useState<Panel>(null)

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

  const togglePanel = (id: Panel) => setPanel(p => p === id ? null : id)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes shimG        { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp       { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp      { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes floatCard    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulseGlow    { 0%,100%{opacity:.28} 50%{opacity:.6} }
        @keyframes pulseWarm    { 0%,100%{opacity:.18} 50%{opacity:.42} }
        @keyframes pathPulse    { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes pathReveal   { 0%{clip-path:inset(100% 0 0 0)} 100%{clip-path:inset(0% 0 0 0)} }
        @keyframes particleDrop { 0%{opacity:0;transform:translateY(0) scale(1)} 20%{opacity:.8} 80%{opacity:.3} 100%{opacity:0;transform:translateY(130px) scale(.3)} }
        @keyframes shimGold     { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes breathe      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes grainAnim    { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(1px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(2px,-2px)} }
        @keyframes floatQuote   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes dustRise     { 0%{opacity:0;transform:translateY(0)} 15%{opacity:.55} 85%{opacity:.18} 100%{opacity:0;transform:translateY(-90px)} }
        @keyframes dustRise2    { 0%{opacity:0;transform:translateY(0) translateX(0)} 15%{opacity:.4} 85%{opacity:.12} 100%{opacity:0;transform:translateY(-75px) translateX(22px)} }
        @keyframes lightLeak    { 0%,100%{opacity:.03} 50%{opacity:.08} }

        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

        .lp-root {
          height: 100svh;
          overflow: hidden;
          background: #060F1A;
          color: #fff;
          font-family: 'Heebo', system-ui, sans-serif;
          direction: rtl;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* BG gradient + warm depth */
        .lp-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 160% 55% at 50% 0%,   rgba(0,195,225,.72)  0%, rgba(0,145,185,.28) 38%, transparent 60%),
            radial-gradient(ellipse 80%  55% at 50% 42%,  rgba(201,168,76,.1)   0%, transparent 58%),
            radial-gradient(ellipse 55%  38% at 92% 80%,  rgba(201,168,76,.12)  0%, transparent 55%),
            radial-gradient(ellipse 42%  30% at 6%  62%,  rgba(91,58,171,.09)   0%, transparent 55%),
            linear-gradient(180deg, #061520 0%, #050D18 100%);
        }
        /* warm light leak breathing */
        .lp-bg::before {
          content:'';
          position:absolute; inset:0;
          background:
            linear-gradient(125deg, rgba(201,168,76,.1) 0%, transparent 35%),
            linear-gradient(245deg, rgba(0,155,195,.08) 0%, transparent 30%);
          animation: lightLeak 14s ease-in-out infinite alternate;
        }
        /* star field */
        .lp-bg::after {
          content:'';
          position:absolute; inset:0;
          background-image:
            radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 72% 12%, rgba(255,255,255,.16) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 42% 35%, rgba(255,255,255,.13) 0%, transparent 100%),
            radial-gradient(1px 1px at 88% 52%, rgba(255,255,255,.11) 0%, transparent 100%),
            radial-gradient(1px 1px at 28% 65%, rgba(255,255,255,.1) 0%, transparent 100%),
            radial-gradient(1px 1px at 58% 78%, rgba(255,255,255,.09) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 6%  42%, rgba(255,255,255,.12) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 28%, rgba(255,255,255,.1) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 88%, rgba(255,255,255,.07) 0%, transparent 100%),
            radial-gradient(1px 1px at 33% 8%,  rgba(255,255,255,.15) 0%, transparent 100%);
          filter: blur(.3px); opacity:.65;
        }

        /* cinematic grain */
        .lp-grain {
          position: absolute; inset: 0; pointer-events:none; z-index:3;
          opacity: .038;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 180px 180px;
          animation: grainAnim 0.4s steps(1) infinite;
        }

        /* floating dust motes */
        .lp-dust {
          position: absolute; inset:0; pointer-events:none; z-index:2; overflow:hidden;
        }
        .lp-dust::before {
          content:'';
          position:absolute;
          bottom: 38%; left: 48%;
          width: 2px; height: 2px; border-radius:50%;
          background: rgba(201,168,76,.35);
          box-shadow:
            14px 9px 0 0px rgba(201,168,76,.18),
            -20px 16px 0 1px rgba(0,200,235,.12),
            38px -6px 0 0px rgba(255,255,255,.07),
            -10px -22px 0 1px rgba(201,168,76,.1),
            58px 22px 0 0px rgba(0,200,235,.07),
            -48px 7px 0 0px rgba(255,255,255,.05),
            28px -32px 0 1px rgba(201,168,76,.08);
          animation: dustRise 11s ease-out 1.8s infinite;
        }
        .lp-dust::after {
          content:'';
          position:absolute;
          bottom: 30%; left: 54%;
          width: 2px; height: 2px; border-radius:50%;
          background: rgba(0,200,235,.25);
          box-shadow:
            -24px 14px 0 1px rgba(201,168,76,.12),
            20px -10px 0 0px rgba(0,200,235,.09),
            -44px -18px 0 1px rgba(255,255,255,.06),
            34px 20px 0 0px rgba(201,168,76,.08);
          animation: dustRise2 14s ease-out 5.5s infinite;
        }

        /* human warmth — two-layer soft presence */
        .lp-human {
          position: absolute; pointer-events:none; z-index:1;
          bottom: -40px; left: 50%; transform: translateX(-50%);
          width: 480px; height: 520px;
        }
        .lp-human::before {
          content:''; position:absolute; inset:0;
          background: radial-gradient(ellipse 55% 70% at 50% 80%,
            rgba(0,150,180,.07) 0%, rgba(201,168,76,.04) 45%, transparent 72%);
          filter: blur(40px);
          animation: pulseWarm 9s ease-in-out infinite;
        }
        .lp-human::after {
          content:''; position:absolute;
          bottom:20px; left:50%; transform:translateX(-50%);
          width:160px; height:280px;
          background: radial-gradient(ellipse 50% 100% at 50% 90%,
            rgba(201,168,76,.05) 0%, transparent 70%);
          filter: blur(28px);
          animation: pulseWarm 12s ease-in-out infinite reverse;
        }

        /* living path with particles */
        .lp-path {
          position: absolute; pointer-events:none; z-index:2;
          left: 50%; transform: translateX(-50%);
          top: 36%; width: 1px; height: 180px;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(0,210,235,.5) 20%,
            rgba(0,190,215,.4) 45%,
            rgba(201,168,76,.3) 70%,
            transparent 100%);
          border-radius: 1px;
          animation: pathReveal 1.6s cubic-bezier(.16,1,.3,1) .6s forwards, pathPulse 4s ease-in-out 2.2s infinite;
          clip-path: inset(100% 0 0 0);
        }
        .lp-path::before {
          content:''; position:absolute;
          width:4px; height:4px; border-radius:50%;
          background: rgba(0,210,235,.7);
          left:50%; transform:translateX(-50%);
          top:0;
          animation: particleDrop 3s ease-in 2s infinite;
          box-shadow: 0 0 6px rgba(0,210,235,.5);
        }
        .lp-path::after {
          content:''; position:absolute;
          width:3px; height:3px; border-radius:50%;
          background: rgba(201,168,76,.65);
          left:50%; transform:translateX(-50%);
          top:30%;
          animation: particleDrop 3s ease-in 3.4s infinite;
          box-shadow: 0 0 5px rgba(201,168,76,.4);
        }

        /* ── NAV ── */
        .lp-nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          flex-shrink: 0;
          background: linear-gradient(180deg, rgba(5,12,22,.76) 0%, rgba(6,15,26,.16) 100%);
          backdrop-filter: blur(24px) saturate(120%); -webkit-backdrop-filter: blur(24px) saturate(120%);
          border-bottom: 1px solid rgba(255,255,255,.04);
        }
        .lp-logo { display:flex; align-items:center; gap:11px; text-decoration:none; }
        .lp-logo-box {
          position: relative;
          width:44px; height:44px;
          background: rgba(255,255,255,.07);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          border: 1px solid rgba(255,255,255,.1);
          padding:2px; flex-shrink:0;
          filter: drop-shadow(0 0 12px rgba(0,200,235,.3));
        }
        .lp-logo-box::before {
          content:'';
          position:absolute; inset:-12px; border-radius:24px;
          background: radial-gradient(ellipse, rgba(0,200,235,.16) 0%, transparent 65%);
          filter: blur(14px);
          animation: pulseGlow 5s ease-in-out infinite;
          pointer-events:none;
        }
        .lp-logo-name { font-size:22px; font-weight:900; color:#fff; letter-spacing:-.03em; }
        .lp-nav-right { display:flex; align-items:center; gap:6px; }
        .lp-nav-btn {
          padding:7px 16px; border-radius:12px; font-size:12.5px; font-weight:700;
          color:rgba(255,255,255,.65); cursor:pointer; text-decoration:none;
          border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07);
          backdrop-filter: blur(10px);
          font-family:'Heebo',system-ui,sans-serif; transition:all .22s;
        }
        .lp-nav-btn:hover { color:#fff; background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.25); box-shadow:0 4px 16px rgba(0,0,0,.2); }

        /* ── QUOTE — atmospheric card ── */
        .lp-quote {
          position: relative; z-index: 10;
          padding: 6px 20px;
          flex-shrink: 0;
          animation: floatQuote 9s ease-in-out 1s infinite;
        }
        .lp-quote-box {
          max-width: 560px; margin: 0 auto;
          background: rgba(201,168,76,.03);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(201,168,76,.12);
          border-radius: 16px;
          padding: 12px 16px 12px 14px;
          display: flex; align-items: flex-start; gap: 10px;
          box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 0 24px rgba(201,168,76,.05);
        }
        .lp-quote-mark-sm {
          font-size: 22px; line-height: 1.2; flex-shrink:0; margin-top: 1px;
          background: linear-gradient(135deg, #D4A840, #EDD870, #C9941C);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          font-family: Georgia, serif;
        }
        .lp-quote-content { flex: 1; }
        .lp-quote-text-sm {
          font-size: 11px; font-weight: 400; color: rgba(255,255,255,.55);
          line-height: 1.65;
          white-space: normal;
        }
        @media(max-width:480px){ .lp-quote-text-sm { font-size:10.5px; } }
        .lp-quote-src {
          display: block; margin-top: 7px;
          font-size: 9px; font-weight: 700; letter-spacing: .12em;
          background: linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimGold 6s linear infinite;
          opacity: .8;
        }

        /* ── HERO BODY ── */
        .lp-body {
          position: relative; z-index: 10;
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 0 20px;
          text-align: center;
          min-height: 0;
          gap: 0;
        }
        .lp-brand {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          margin-bottom: 10px;
        }
        .lp-brand-logo {
          position: relative;
          width: 68px; height: 68px;
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,.12);
          padding: 6px; margin-bottom: 2px;
          filter: drop-shadow(0 0 20px rgba(0,200,235,.28)) drop-shadow(0 0 40px rgba(201,168,76,.12));
        }
        .lp-brand-logo::before {
          content:'';
          position:absolute; inset:-18px; border-radius:38px;
          background: radial-gradient(ellipse, rgba(0,190,225,.18) 0%, rgba(201,168,76,.08) 50%, transparent 70%);
          filter: blur(20px);
          animation: pulseGlow 5s ease-in-out infinite;
          pointer-events:none; z-index:-1;
        }
        .lp-brand-logo::after {
          content:'';
          position:absolute; inset:-5px; border-radius:25px;
          border: 1px solid rgba(0,200,235,.13);
          box-shadow: 0 0 24px rgba(0,190,220,.08);
          animation: pulseWarm 6s ease-in-out infinite;
          pointer-events:none;
        }
        .lp-brand-name {
          font-size: 30px; font-weight: 900; color: #fff; letter-spacing: -.04em; line-height:1;
        }
        .lp-brand-sub {
          font-size: 10.5px; font-weight: 500; color: rgba(255,255,255,.35); letter-spacing: .1em;
        }

        /* headline glow backdrop */
        .lp-title-wrap {
          position: relative; margin-bottom: 6px;
        }
        .lp-title-glow {
          position: absolute; inset: -20px; border-radius: 50%;
          background: radial-gradient(ellipse 80% 60% at 50% 55%,
            rgba(0,170,210,.1) 0%, rgba(201,168,76,.06) 50%, transparent 75%);
          pointer-events:none; filter:blur(12px);
          animation: pulseGlow 6s ease-in-out infinite;
        }
        .lp-title {
          position: relative;
          font-size: clamp(17px, 3.8vw, 25px); font-weight: 800; color: rgba(255,255,255,.9);
          letter-spacing: -.02em; line-height: 1.4; margin-bottom: 0;
        }
        .lp-title-em {
          background: linear-gradient(90deg, #C8A040 0%, #EDD070 30%, #F8E898 55%, #EDD070 75%, #C8A040 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimG 8s linear infinite;
        }

        /* emotional tagline */
        .lp-tagline {
          font-size: 11.5px; font-style: italic; font-weight: 500;
          color: rgba(201,168,76,.6);
          letter-spacing: .04em; margin-bottom: 12px; margin-top: 6px;
          line-height: 1.5;
        }

        /* CTA card */
        .lp-card {
          width: 100%; max-width: 368px;
          background: rgba(255,255,255,.055);
          backdrop-filter: blur(28px) saturate(160%); -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 26px; padding: 22px 22px 16px;
          box-shadow:
            0 2px 0 rgba(255,255,255,.07) inset,
            0 24px 56px rgba(0,0,0,.5),
            0 0 0 1px rgba(0,180,220,.06),
            0 0 48px rgba(0,120,160,.08);
          animation: floatCard 6s ease-in-out infinite;
        }
        .lp-card-title { font-size: 14.5px; font-weight: 800; color: #fff; margin-bottom: 2px; }
        .lp-card-sub   { font-size: 11px; color: rgba(255,255,255,.38); margin-bottom: 15px; }
        .lp-goog-btn {
          width: 100%; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          font-family: 'Heebo',system-ui,sans-serif; font-size: 14.5px; font-weight: 700;
          cursor: pointer; outline: none; position: relative; overflow:hidden;
          background: linear-gradient(160deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.06) 100%);
          border: 1px solid rgba(255,255,255,.2);
          color: #fff; transition: all .28s cubic-bezier(.16,1,.3,1); letter-spacing: -.01em;
          box-shadow: inset 0 1.5px 0 rgba(255,255,255,.15), 0 4px 20px rgba(0,0,0,.25), 0 0 0 1px rgba(0,180,220,.04);
        }
        .lp-goog-btn::before {
          content:''; position:absolute; inset:0; border-radius:inherit;
          background:linear-gradient(160deg,rgba(255,255,255,.08) 0%,transparent 60%);
          opacity:0; transition:opacity .28s;
        }
        .lp-goog-btn:hover { transform:translateY(-2px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.18), 0 10px 30px rgba(0,0,0,.35), 0 0 24px rgba(0,190,220,.1); border-color:rgba(255,255,255,.32); }
        .lp-goog-btn:hover::before { opacity:1; }
        .lp-goog-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .lp-goog-icon { background:rgba(255,255,255,.92); border-radius:8px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lp-mosad-link {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 10px; padding: 9px;
          font-size: 12px; font-weight: 600; color: rgba(0,180,204,.65);
          text-decoration: none; border-radius: 10px; transition: all .2s;
        }
        .lp-mosad-link:hover { color: rgba(0,200,224,.95); background: rgba(0,180,204,.07); }
        .lp-err { background:rgba(220,38,38,.14); border:1px solid rgba(220,38,38,.28); border-radius:8px; padding:8px 12px; font-size:12px; color:#FCA5A5; margin-top:8px; text-align:center; }

        /* ── ACCORDION BOTTOM BAR ── */
        .lp-acc-bar {
          position: relative; z-index: 10;
          display: flex; gap: 8px;
          padding: 0 20px 18px;
          flex-shrink: 0;
          justify-content: center;
        }
        .lp-acc-btn {
          flex: 1; max-width: 152px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 12px; border-radius: 14px;
          font-family: 'Heebo',system-ui,sans-serif; font-size: 12.5px; font-weight: 700;
          color: rgba(255,255,255,.48); cursor: pointer;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          transition: all .22s;
        }
        .lp-acc-btn.active {
          color:#fff; background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.16);
          box-shadow: 0 4px 20px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08);
        }
        .lp-acc-btn:hover { color:rgba(255,255,255,.82); background:rgba(255,255,255,.07); transform:translateY(-1px); }

        /* ── BOTTOM SHEET ── */
        .lp-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(0,0,0,.62); backdrop-filter: blur(6px);
          animation: fadeIn .2s ease;
          display: flex; align-items: flex-end;
        }
        .lp-sheet {
          width: 100%; max-height: 74svh;
          background:
            radial-gradient(ellipse 100% 28% at 50% 0%, rgba(0,175,215,.07) 0%, transparent 55%),
            linear-gradient(180deg, #091420 0%, #060F1A 100%);
          border-top: 1px solid rgba(0,180,220,.1);
          border-radius: 28px 28px 0 0;
          padding: 18px 20px 36px;
          overflow-y: auto;
          animation: slideUp .32s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 -1px 0 rgba(0,210,240,.06) inset, 0 -50px 100px rgba(0,0,0,.5);
        }
        .lp-sheet-handle {
          width: 32px; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,.1); margin: 0 auto 20px;
        }
        .lp-sheet-title {
          font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 4px;
          letter-spacing: -.025em;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-sheet-sub {
          font-size: 12.5px; color: rgba(255,255,255,.32);
          margin-bottom: 22px; line-height: 1.5; letter-spacing: .01em;
        }
        .lp-sheet-close {
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px; color: rgba(255,255,255,.45); cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; flex-shrink: 0;
        }
        .lp-sheet-close:hover { background: rgba(255,255,255,.13); color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.2); }

        /* Journey — connected progression path */
        .lp-steps {
          display: flex; flex-direction: column; gap: 8px;
          position: relative;
        }
        .lp-steps::before {
          content: '';
          position: absolute;
          top: 34px; bottom: 34px;
          right: 34px;
          width: 1px;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(0,180,220,.2) 15%,
            rgba(201,168,76,.14) 65%,
            transparent 100%);
          pointer-events: none; z-index: 0;
        }
        .lp-step-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px 16px; border-radius: 16px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.065);
          position: relative; z-index: 1;
          transition: background .25s, border-color .25s, box-shadow .25s;
        }
        .lp-step-row:hover {
          background: rgba(255,255,255,.055);
          border-color: rgba(255,255,255,.1);
          box-shadow: 0 6px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(0,180,220,.04);
        }
        .lp-step-num-sm {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
        }
        .lp-step-info-title { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 2px; letter-spacing: -.01em; }
        .lp-step-info-sub { font-size: 12px; color: rgba(255,255,255,.38); line-height: 1.45; }

        /* Features in sheet */
        .lp-feat-grid-sm { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media(min-width:480px){ .lp-feat-grid-sm { grid-template-columns: repeat(4,1fr); } }
        .lp-feat-sm {
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 16px; padding: 16px 14px;
          transition: background .25s, border-color .25s, transform .25s, box-shadow .25s;
          cursor: default;
        }
        .lp-feat-sm:hover {
          background: rgba(255,255,255,.06);
          border-color: rgba(255,255,255,.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,.32), 0 0 0 1px rgba(0,180,220,.04);
        }
        .lp-feat-sm-icon { width:36px; height:36px; border-radius:11px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
        .lp-feat-sm-title { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 3px; letter-spacing: -.01em; }
        .lp-feat-sm-desc  { font-size: 11px; color: rgba(255,255,255,.38); line-height: 1.45; }

        /* Network grid in sheet */
        .lp-net-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lp-net-pill {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px; padding: 14px 16px;
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,.6);
          transition: background .22s, color .22s, transform .22s, box-shadow .22s;
          cursor: default;
        }
        .lp-net-pill:hover {
          background: rgba(255,255,255,.07);
          color: rgba(255,255,255,.85);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,.28);
        }
        .lp-net-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink:0; }

        /* fade-in */
        .lp-fade { opacity:0; animation: fadeUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .lp-d1 { animation-delay:.08s; }
        .lp-d2 { animation-delay:.18s; }
        .lp-d3 { animation-delay:.3s; }
      `}</style>

      <div className="lp-root">
        <div className="lp-bg" />
        <div className="lp-grain" />
        <div className="lp-dust" />
        <div className="lp-human" />
        <div className="lp-path" />

        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-logo">
            <div className="lp-logo-box">
              <Image src="/logo-chabad.png" alt="השביל" width={42} height={42} style={{ objectFit:'contain' }} />
            </div>
            <span className="lp-logo-name">הַשְּׁבִיל</span>
          </div>
          <div className="lp-nav-right">
            <a href="/mosad" className="lp-nav-btn">כניסת מוסד</a>
          </div>
        </nav>

        {/* QUOTE — prominent at top */}
        <div className="lp-quote" style={{ opacity: visible ? 1 : 0, transition:'opacity .5s' }}>
          <div className="lp-quote-box">
            <span className="lp-quote-mark-sm">&ldquo;</span>
            <div className="lp-quote-content">
              <p className="lp-quote-text-sm">
                עבודה במוסד של כ&quot;ק מו&quot;ח אדמו&quot;ר זצוקללה&quot;ה נבג&quot;מ זי&quot;ע ובפרט במקצוע החינוך על טהרת הקודש – הרי זה צינור וכלי לקבלת ברכות השי&quot;ת בכלל.
              </p>
              <div className="lp-quote-src">הרבי · התקשרות · עמוד 115</div>
            </div>
          </div>
        </div>

        {/* HERO BODY */}
        <div className="lp-body" style={{ opacity: visible ? 1 : 0, transition:'opacity .5s .1s' }}>

          <div className="lp-brand lp-fade lp-d1">
            <div className="lp-brand-logo">
              <Image src="/logo-chabad.png" alt="השביל" width={52} height={52} style={{ objectFit:'contain' }} />
            </div>
            <div className="lp-brand-name">הַשְּׁבִיל</div>
            <div className="lp-brand-sub">מערכת חכמה לגיוס והשמה</div>
          </div>

          <div className="lp-title-wrap lp-fade lp-d2">
            <div className="lp-title-glow" />
            <h1 className="lp-title">
              מצאי את <span className="lp-title-em">שביל השליחות</span> שלך
            </h1>
          </div>
          <p className="lp-tagline lp-fade lp-d2">לא עוד חיפוש עבודה — מציאת השביל שלך</p>

          <div className="lp-card lp-fade lp-d3">
            <div className="lp-card-title">כניסה למערכת המועמדת</div>
            <div className="lp-card-sub">מועמדת חדשה? הפרופיל נפתח אוטומטית</div>
            <button className="lp-goog-btn" onClick={signIn} disabled={pending}>
              <div className="lp-goog-icon"><GoogleIcon /></div>
              <span>{pending ? 'מחברת...' : 'כניסה / הרשמה עם Google'}</span>
            </button>
            {err && <div className="lp-err">{err}</div>}
            <a href="/mosad" className="lp-mosad-link">
              <Building2 size={13} />
              כניסה למערכת המוסד
            </a>
          </div>

        </div>

        {/* ACCORDION TRIGGERS */}
        <div className="lp-acc-bar">
          {([
            { id: 'journey',  label: 'המסלול' },
            { id: 'features', label: 'יכולות' },
            { id: 'network',  label: 'הרשת'   },
          ] as { id: Panel; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              className={`lp-acc-btn${panel === id ? ' active' : ''}`}
              onClick={() => togglePanel(id)}
            >
              {label}
              <ChevronDown size={14} style={{ transition:'transform .2s', transform: panel===id ? 'rotate(180deg)' : 'none' }} />
            </button>
          ))}
        </div>

        {/* BOTTOM SHEET OVERLAY */}
        {panel && (
          <div className="lp-overlay" onClick={() => setPanel(null)}>
            <div className="lp-sheet" onClick={e => e.stopPropagation()}>
              <div className="lp-sheet-handle" />

              {panel === 'journey' && (
                <>
                  <div className="lp-sheet-title">
                    <span>המסלול</span>
                    <button onClick={() => setPanel(null)} className="lp-sheet-close"><X size={16}/></button>
                  </div>
                  <div className="lp-sheet-sub">חמישה צעדים — מהרשמה ועד השמה</div>
                  <div className="lp-steps">
                    {JOURNEY.map(s => (
                      <div key={s.n} className="lp-step-row">
                        <div className="lp-step-num-sm" style={{ background:`${s.color}18`, border:`1.5px solid ${s.color}44`, color: s.color, boxShadow:`0 0 16px ${s.color}28, inset 0 0 0 1px ${s.color}12` }}>{s.n}</div>
                        <div>
                          <div className="lp-step-info-title">{s.title}</div>
                          <div className="lp-step-info-sub">{s.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {panel === 'features' && (
                <>
                  <div className="lp-sheet-title">
                    <span>יכולות המערכת</span>
                    <button onClick={() => setPanel(null)} className="lp-sheet-close"><X size={16}/></button>
                  </div>
                  <div className="lp-sheet-sub">כלים שנבנו עבור שליחות חינוכית</div>
                  <div className="lp-feat-grid-sm">
                    {FEATURES.map(({ icon: Icon, title, desc, c }) => (
                      <div key={title} className="lp-feat-sm">
                        <div className="lp-feat-sm-icon" style={{ background:`${c}18`, boxShadow:`0 0 14px ${c}22, inset 0 0 0 1px ${c}18` }}>
                          <Icon size={17} color={c} style={{ filter:`drop-shadow(0 0 4px ${c}99)` }} />
                        </div>
                        <div className="lp-feat-sm-title">{title}</div>
                        <div className="lp-feat-sm-desc">{desc}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {panel === 'network' && (
                <>
                  <div className="lp-sheet-title">
                    <span>הרשת שמאחורינו</span>
                    <button onClick={() => setPanel(null)} className="lp-sheet-close"><X size={16}/></button>
                  </div>
                  <div className="lp-sheet-sub">פלטפורמה לרשת חינוך חב״ד — מוסדות, שלוחים ומועמדות</div>
                  <div className="lp-net-pills">
                    {NETWORK.map(({ label, dot, icon: Icon }) => (
                      <div key={label} className="lp-net-pill">
                        <span className="lp-net-dot" style={{ background: dot, boxShadow:`0 0 8px ${dot}88` }} />
                        <Icon size={13} color={dot} style={{ filter:`drop-shadow(0 0 3px ${dot}88)`, flexShrink:0 }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
