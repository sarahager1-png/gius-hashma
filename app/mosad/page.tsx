'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  School, Briefcase, Search, MessageCircle,
  CheckCircle, Calendar, ClipboardList, Star, Bell, FileStack, ArrowLeft,
} from 'lucide-react'

const STEPS = [
  {
    n: '1',
    icon: '✦',
    title: 'נכנסת עם Google',
    desc: 'נכנסת עם המייל של המוסד — הפרופיל נפתח אוטומטית, ללא הרשמה נפרדת',
    color: '#0090A8',
    bg: 'rgba(0,180,204,0.08)',
    border: 'rgba(0,180,204,0.2)',
  },
  {
    n: '2',
    icon: '◈',
    title: 'מפרסמת משרות',
    desc: 'יוצרת משרה עם כותרת, סוג, מיקום והתמחות — מיד נחשפת לכל המועמדות',
    color: '#7B5AC4',
    bg: 'rgba(91,58,171,0.08)',
    border: 'rgba(91,58,171,0.2)',
  },
  {
    n: '3',
    icon: '❋',
    title: 'מגייסת ומשבצת',
    desc: 'עוברת על בקשות, שולחת הזמנה לראיון — המועמדת מאשרת בוואטסאפ',
    color: '#15803D',
    bg: 'rgba(21,128,61,0.08)',
    border: 'rgba(21,128,61,0.2)',
  },
]

const AUTOMATIONS = [
  { title: 'התראה על התאמה חדשה', desc: 'כשמועמדת חדשה מתאימה למשרה שלך — מקבלת התראה מיידית', icon: Star, color: '#0090A8', bg: 'rgba(0,180,204,0.08)' },
  { title: 'אישור ראיון אוטומטי', desc: 'מועמדת מאשרת או מסרבת ישירות מ-WhatsApp — בלי טלפון', icon: CheckCircle, color: '#15803D', bg: 'rgba(21,128,61,0.08)' },
  { title: 'תזכורת לראיין', desc: '24 שעות לפני הראיון — שתי הצדדים מקבלות תזכורת אוטומטית', icon: Bell, color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
  { title: 'סקר לאחר שיבוץ', desc: 'חודש אחרי — שאלון קצר על המועמדת לשיפור מתמיד', icon: MessageCircle, color: '#7B5AC4', bg: 'rgba(91,58,171,0.08)' },
]

const FEATURES = [
  { icon: Briefcase,     title: 'פרסום משרות',      desc: 'סטאג׳, חלקי, מלא — כולל תאריך ותיאור', color: '#0090A8', bg: 'rgba(0,180,204,0.08)' },
  { icon: Search,        title: 'עיון במועמדות',     desc: 'סנני לפי התמחות, מחוז, רמה', color: '#7B5AC4', bg: 'rgba(91,58,171,0.08)' },
  { icon: ClipboardList, title: 'ניהול בקשות',       desc: 'צפי, סמני "נצפתה", החלטי', color: '#0090A8', bg: 'rgba(0,180,204,0.08)' },
  { icon: Calendar,      title: 'לוח ראיונות',       desc: 'רשימה וחודשי — כולל דירוג', color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
  { icon: FileStack,     title: 'קורות חיים',        desc: 'PDF/Word ישירות מהפרופיל', color: '#7B5AC4', bg: 'rgba(91,58,171,0.08)' },
  { icon: MessageCircle, title: 'הודעות ישירות',     desc: 'פני ישירות למועמדת מהמערכת', color: '#15803D', bg: 'rgba(21,128,61,0.08)' },
]

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function MosadLanding() {
  const [pending, setPending] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setPending(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) { setError('שגיאה בכניסה עם Google. נסי שוב.'); setPending(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        .ms-root { min-height:100vh; background:#F2F8F9; font-family:'Heebo',system-ui,sans-serif; direction:rtl; }
        .ms-hero {
          background: linear-gradient(160deg, #071C1E 0%, #0A2A2C 35%, #0D3438 65%, #07201F 100%);
          position: relative; overflow: hidden; padding-bottom: 32px;
        }
        .ms-hero-orb1 {
          position:absolute; top:-60px; right:-80px;
          width:320px; height:320px; border-radius:50%;
          background: radial-gradient(circle, rgba(0,180,204,.3) 0%, transparent 70%);
          pointer-events:none;
        }
        .ms-hero-orb2 {
          position:absolute; bottom:-40px; left:-60px;
          width:240px; height:240px; border-radius:50%;
          background: radial-gradient(circle, rgba(91,58,171,.18) 0%, transparent 70%);
          pointer-events:none;
        }
        .ms-hero-pattern {
          position:absolute; inset:0; opacity:.04;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpolygon points='30,6 35,18 48,15 41,26 48,37 35,35 30,47 25,35 12,37 19,26 12,15 25,18' fill='none' stroke='white' stroke-width='.7'/%3E%3C/svg%3E");
          background-size:60px 60px; pointer-events:none;
        }
        .ms-inner { max-width:520px; margin:0 auto; padding:0 20px; position:relative; z-index:1; }
        .ms-nav { display:flex; align-items:center; justify-content:space-between; padding:18px 0 0; }
        .ms-nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .ms-nav-logobox {
          width:44px; height:44px; background:#fff; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 14px rgba(0,0,0,.22); padding:4px;
        }
        .ms-nav-name { font-size:17px; font-weight:900; color:#fff; letter-spacing:-.02em; }
        .ms-nav-sub  { font-size:10px; font-weight:600; color:rgba(255,255,255,.45); letter-spacing:.06em; }
        .ms-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2);
          border-radius:999px; padding:5px 14px; margin-bottom:14px;
          font-size:11px; font-weight:700; color:#fff; letter-spacing:.05em;
        }
        .ms-hero-title {
          font-size:32px; font-weight:900; color:#fff;
          letter-spacing:-.03em; line-height:1.15; margin:0 0 10px;
        }
        .ms-hero-em {
          background:linear-gradient(90deg,#5ECFDB,#9EEAF0,#5ECFDB);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmerT 4s linear infinite;
        }
        @keyframes shimmerT { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .ms-hero-sub { font-size:14px; color:rgba(255,255,255,.65); line-height:1.6; margin:0; }

        .ms-card { background:#fff; border-radius:16px; border:1px solid #C8E8EC; box-shadow:0 2px 8px rgba(0,167,181,.07); overflow:hidden; }
        .ms-card-header { background:#E0F7FA; padding:11px 18px; font-size:12px; font-weight:700; color:#006B75; letter-spacing:.04em; text-transform:uppercase; border-bottom:1px solid #B2E0E6; }
        .ms-card-body { padding:18px; }

        .ms-login-btn {
          width:100%; height:52px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; gap:11px;
          font-family:'Heebo',system-ui,sans-serif; font-size:15px; font-weight:800;
          cursor:pointer; border:none; outline:none; position:relative; overflow:hidden;
          background:linear-gradient(135deg,#006B75,#00B4CC); color:#fff;
          box-shadow:0 6px 24px rgba(0,167,181,.35); transition:all .2s;
        }
        .ms-login-btn:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(0,167,181,.45); }
        .ms-login-btn:active { transform:scale(.98); }
        .ms-login-btn:disabled { opacity:.65; cursor:not-allowed; transform:none; }
        .ms-login-btn .g-wrap {
          background:rgba(255,255,255,.18); border-radius:8px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .ms-step { display:flex; align-items:flex-start; gap:14px; padding:14px 16px; background:#fff; border-radius:14px; border:1px solid #C8E8EC; box-shadow:0 1px 4px rgba(0,167,181,.06); }
        .ms-step-num { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; flex-shrink:0; }
        .ms-step-arrow { width:1px; background:linear-gradient(180deg,#B2E0E6,transparent); margin:0 auto; height:16px; }

        .ms-feat { background:#fff; border-radius:14px; padding:14px 13px; border:1px solid #C8E8EC; box-shadow:0 1px 4px rgba(0,167,181,.05); }
        .ms-feat-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:9px; }

        .ms-auto { display:flex; align-items:flex-start; gap:12px; padding:13px 15px; background:#fff; border-radius:13px; border:1px solid #C8E8EC; box-shadow:0 1px 4px rgba(0,167,181,.05); }
        .ms-auto-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .ms-flow { display:flex; align-items:center; justify-content:center; gap:4px; flex-wrap:wrap; }
        .ms-flow-item { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .ms-flow-bubble { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .ms-flow-arrow { width:16px; height:1px; background:#B2E0E6; margin-bottom:18px; flex-shrink:0; }

        .ms-cta-bottom {
          background:linear-gradient(135deg,#071C1E 0%,#0D3438 50%,#006B75 100%);
          border-radius:18px; padding:24px 20px; text-align:center;
          border:1px solid rgba(0,180,204,.25);
        }
        .ms-cta-title { font-size:17px; font-weight:900; color:#fff; margin-bottom:5px; }
        .ms-cta-sub { font-size:12.5px; color:rgba(255,255,255,.55); margin-bottom:18px; }
        .ms-cta-btn {
          display:inline-flex; align-items:center; gap:8px;
          background:#fff; border-radius:12px; padding:11px 22px;
          border:none; cursor:pointer; font-family:'Heebo',system-ui,sans-serif;
          font-size:14px; font-weight:800; color:#006B75;
          box-shadow:0 4px 14px rgba(0,0,0,.18); transition:all .2s;
        }
        .ms-cta-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,.25); }
        .ms-error { background:#FEF2F2; border-radius:10px; padding:10px 14px; font-size:13px; font-weight:600; color:#DC2626; margin-top:10px; text-align:center; }
        .ms-trust { display:flex; align-items:center; justify-content:center; gap:14px; margin-top:14px; flex-wrap:wrap; }
        .ms-trust-item { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:#4A6A6E; }
        .ms-section-label { font-size:10.5px; font-weight:700; color:#4A6A6E; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; }
      `}</style>

      <div className="ms-root">

        {/* ── Hero ── */}
        <div className="ms-hero">
          <div className="ms-hero-orb1" />
          <div className="ms-hero-orb2" />
          <div className="ms-hero-pattern" />

          <div className="ms-inner">
            {/* Nav */}
            <div className="ms-nav">
              <div className="ms-nav-logo">
                <div className="ms-nav-logobox">
                  <Image src="/logo-chabad.png" alt="השביל" width={36} height={36} style={{ objectFit:'contain' }} />
                </div>
                <div>
                  <div className="ms-nav-name">הַשְּׁבִיל</div>
                  <div className="ms-nav-sub">רשת חינוך חב״ד</div>
                </div>
              </div>
              <div style={{ background:'rgba(0,180,204,.15)', border:'1px solid rgba(0,180,204,.35)', borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:700, color:'rgba(94,207,219,.9)' }}>
                פורטל מוסד
              </div>
            </div>

            {/* Hero content */}
            <div style={{ padding:'28px 0 0', textAlign:'center' }}>
              <div className="ms-badge">
                <School size={12} />
                גיוס והשמה · רשת חינוך חב״ד
              </div>
              <h1 className="ms-hero-title">
                גייסי את<br />
                <span className="ms-hero-em">שליחות החינוך</span><br />
                הנכונה
              </h1>
              <p className="ms-hero-sub">
                מאגר מועמדות מאומתות ברשת חינוך חב״ד —<br />
                פרסמי משרה ומצאי מועמדת תוך ימים
              </p>
            </div>
          </div>
        </div>

        <div className="ms-inner" style={{ paddingTop:'0' }}>

          {/* ── Login card ── */}
          <div style={{ marginTop:'-1px', marginBottom:'20px', position:'relative', zIndex:10 }}>
            <div className="ms-card" style={{ boxShadow:'0 12px 40px rgba(0,167,181,.2)' }}>
              <div style={{ height:'3px', background:'linear-gradient(90deg,#00B4CC,#5B3AAB)' }} />
              <div className="ms-card-body">
                <h2 style={{ fontSize:'17px', fontWeight:800, color:'#1A1A2E', margin:'0 0 3px', letterSpacing:'-.01em' }}>כניסה למערכת המוסד</h2>
                <p style={{ fontSize:'13px', color:'#4A6A6E', margin:'0 0 18px' }}>
                  נכנסי עם המייל של המוסד — הפרופיל נפתח אוטומטית
                </p>

                <button className="ms-login-btn" onClick={handleGoogle} disabled={pending}>
                  <div className="g-wrap">{GOOGLE_SVG}</div>
                  <span>{pending ? 'מחברת...' : 'כניסה עם Google'}</span>
                </button>

                {error && <div className="ms-error">{error}</div>}

                <div className="ms-trust">
                  {[
                    { icon: CheckCircle, text: 'כניסה מיידית' },
                    { icon: CheckCircle, text: 'ניהול חינמי' },
                    { icon: MessageCircle, text: 'עדכונים ב-WhatsApp' },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="ms-trust-item">
                      <Icon size={11} color="#00B4CC" />
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── How it works ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ms-section-label">איך זה עובד</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {STEPS.map((s, i) => (
                <div key={s.n}>
                  <div className="ms-step">
                    <div className="ms-step-num" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
                      <span style={{ color:s.color, fontSize:'16px' }}>{s.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'14px', fontWeight:800, color:'#1A1A2E', marginBottom:'2px' }}>{s.title}</div>
                      <div style={{ fontSize:'12.5px', color:'#4A4A6A', lineHeight:1.45 }}>{s.desc}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className="ms-step-arrow" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Automations ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ms-card">
              <div className="ms-card-header">אוטומציות וזרימות</div>
              <div className="ms-card-body" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {AUTOMATIONS.map(({ title, desc, icon: Icon, color, bg }) => (
                  <div key={title} className="ms-auto">
                    <div className="ms-auto-icon" style={{ background:bg }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:800, color:'#1A1A2E', marginBottom:'2px' }}>{title}</div>
                      <div style={{ fontSize:'12px', color:'#4A4A6A', lineHeight:1.4 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Application flow ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ms-card">
              <div className="ms-card-header">מחזור חיים של הגשה</div>
              <div className="ms-card-body">
                <div className="ms-flow">
                  {[
                    { label:'הגשה',     color:'#5B3AAB', bg:'rgba(91,58,171,.1)' },
                    { label:'נצפתה',    color:'#0369A1', bg:'rgba(3,105,161,.1)' },
                    { label:'ראיון',    color:'#D97706', bg:'rgba(217,119,6,.1)' },
                    { label:'שיבוץ',   color:'#15803D', bg:'rgba(21,128,61,.1)' },
                    { label:'משוב',     color:'#C9A84C', bg:'rgba(201,168,76,.1)' },
                  ].map(({ label, color, bg }, i, arr) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                      <div className="ms-flow-item">
                        <div className="ms-flow-bubble" style={{ background:bg }}>
                          <span style={{ fontSize:'11px', fontWeight:800, color }}>{label}</span>
                        </div>
                      </div>
                      {i < arr.length - 1 && <div className="ms-flow-arrow" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Features ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ms-section-label">כלים לניהול הגיוס</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="ms-feat">
                  <div className="ms-feat-icon" style={{ background:bg }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:800, color:'#1A1A2E', marginBottom:'3px' }}>{title}</div>
                  <div style={{ fontSize:'11.5px', color:'#4A6A6E', lineHeight:1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="ms-cta-bottom" style={{ marginBottom:'32px' }}>
            <div style={{ fontSize:'13px', color:'rgba(94,207,219,.7)', fontStyle:'italic', marginBottom:'10px' }}>
              ״גייסי את שליחות החינוך הנכונה״
            </div>
            <div className="ms-cta-title">מוכנות לגייס?</div>
            <div className="ms-cta-sub">כניסה מיידית — ניהול פשוט ויעיל</div>
            <button className="ms-cta-btn" onClick={handleGoogle} disabled={pending}>
              {GOOGLE_SVG}
              {pending ? 'מחברת...' : 'כניסה עם Google'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'0 0 28px', fontSize:'11px', color:'#4A6A6E', direction:'rtl' }}>
          הַשְּׁבִיל · רשת חינוך חב״ד · 2026
          <span style={{ margin:'0 8px' }}>·</span>
          <a href="/mumedet" style={{ color:'#00B4CC', textDecoration:'none', fontWeight:600 }}>פורטל מועמדת <ArrowLeft size={10} style={{ display:'inline' }} /></a>
        </div>

      </div>
    </>
  )
}
