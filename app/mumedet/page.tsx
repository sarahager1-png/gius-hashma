'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap, Search, FileText, Star, MessageCircle,
  CheckCircle, Bell, MapPin, MailOpen, ArrowLeft,
} from 'lucide-react'

const STEPS = [
  {
    n: '1',
    icon: '✦',
    title: 'נכנסת עם Google',
    desc: 'הרשמה חד-פעמית — בונה פרופיל עם התמחות, עיר ורמה אקדמית',
    color: '#7B5AC4',
    bg: 'rgba(91,58,171,0.08)',
    border: 'rgba(91,58,171,0.18)',
  },
  {
    n: '2',
    icon: '◈',
    title: 'מגישה למשרות',
    desc: 'מחפשת לפי עיר, התמחות, סוג משרה — ומגישה בקליק אחד',
    color: '#0090A8',
    bg: 'rgba(0,180,204,0.08)',
    border: 'rgba(0,180,204,0.18)',
  },
  {
    n: '3',
    icon: '❋',
    title: 'מקבלת הצעה',
    desc: 'המוסד שולח הזמנה לראיון — מאשרת ישירות מ-WhatsApp',
    color: '#15803D',
    bg: 'rgba(21,128,61,0.08)',
    border: 'rgba(21,128,61,0.18)',
  },
]

const AUTOMATIONS = [
  { title: 'התאמה חכמה', desc: 'כשנפתחת משרה חדשה שמתאימה לפרופיל שלך — מקבלת התראה מיידית', icon: Star, color: '#7B5AC4', bg: 'rgba(91,58,171,0.08)' },
  { title: 'עדכון סטטוס אוטומטי', desc: 'ממתינה → נצפתה → התקבלה — כל שינוי מגיע ב-WhatsApp', icon: Bell, color: '#0090A8', bg: 'rgba(0,180,204,0.08)' },
  { title: 'תזכורת ראיון', desc: '24 שעות לפני הראיון — תזכורת אוטומטית עם פרטי המיקום', icon: CheckCircle, color: '#15803D', bg: 'rgba(21,128,61,0.08)' },
  { title: 'סקר שביעות רצון', desc: 'חודש לאחר השיבוץ — שאלון קצר לשיפור מתמיד', icon: MessageCircle, color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
]

const FEATURES = [
  { icon: FileText,       title: 'פרופיל מקצועי',    desc: 'התמחות, ניסיון, כישורים וביו', color: '#7B5AC4', bg: 'rgba(91,58,171,0.08)' },
  { icon: GraduationCap, title: 'קורות חיים',         desc: 'העלאת PDF/Word או קישור', color: '#0090A8', bg: 'rgba(0,180,204,0.08)' },
  { icon: Search,         title: 'חיפוש מתקדם',       desc: 'מחוז, עיר, סוג, התמחות', color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
  { icon: CheckCircle,    title: 'מעקב הגשות',        desc: 'סטטוס בזמן אמת לכל הגשה', color: '#15803D', bg: 'rgba(21,128,61,0.08)' },
  { icon: MapPin,         title: 'לפי מיקום',          desc: 'משרות קרובות לפי עיר ומחוז', color: '#7B5AC4', bg: 'rgba(91,58,171,0.08)' },
  { icon: MailOpen,       title: 'תיבת הודעות',        desc: 'מוסדות פונים ישירות', color: '#0090A8', bg: 'rgba(0,180,204,0.08)' },
]

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function MumedetLanding() {
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
        .ml-root { min-height:100vh; background:#F5F3F9; font-family:'Heebo',system-ui,sans-serif; direction:rtl; }
        .ml-hero {
          background: linear-gradient(160deg, #0D0820 0%, #1E1040 35%, #2A1558 65%, #1A0D38 100%);
          position: relative; overflow: hidden; padding-bottom: 32px;
        }
        .ml-hero-orb1 {
          position:absolute; top:-60px; right:-80px;
          width:320px; height:320px; border-radius:50%;
          background: radial-gradient(circle, rgba(91,58,171,.35) 0%, transparent 70%);
          pointer-events:none;
        }
        .ml-hero-orb2 {
          position:absolute; bottom:-40px; left:-60px;
          width:240px; height:240px; border-radius:50%;
          background: radial-gradient(circle, rgba(0,180,204,.18) 0%, transparent 70%);
          pointer-events:none;
        }
        .ml-hero-pattern {
          position:absolute; inset:0; opacity:.04;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpolygon points='30,6 35,18 48,15 41,26 48,37 35,35 30,47 25,35 12,37 19,26 12,15 25,18' fill='none' stroke='white' stroke-width='.7'/%3E%3C/svg%3E");
          background-size:60px 60px; pointer-events:none;
        }
        .ml-inner { max-width:520px; margin:0 auto; padding:0 20px; position:relative; z-index:1; }
        .ml-nav { display:flex; align-items:center; justify-content:space-between; padding:18px 0 0; }
        .ml-nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .ml-nav-logobox {
          width:44px; height:44px; background:#fff; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 14px rgba(0,0,0,.22); padding:4px;
        }
        .ml-nav-name { font-size:17px; font-weight:900; color:#fff; letter-spacing:-.02em; }
        .ml-nav-sub  { font-size:10px; font-weight:600; color:rgba(255,255,255,.45); letter-spacing:.06em; }
        .ml-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2);
          border-radius:999px; padding:5px 14px; margin-bottom:14px;
          font-size:11px; font-weight:700; color:#fff; letter-spacing:.05em;
        }
        .ml-hero-title {
          font-size:32px; font-weight:900; color:#fff;
          letter-spacing:-.03em; line-height:1.15; margin:0 0 10px;
        }
        .ml-hero-em {
          background:linear-gradient(90deg,#D4B06A,#F0D08A,#D4B06A);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmer 4s linear infinite;
        }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .ml-hero-sub { font-size:14px; color:rgba(255,255,255,.65); line-height:1.6; margin:0; }

        /* Cards */
        .ml-card { background:#fff; border-radius:16px; border:1px solid #E0DCF0; box-shadow:0 2px 8px rgba(91,58,171,.06); overflow:hidden; }
        .ml-card-header { background:#EBE5F8; padding:11px 18px; font-size:12px; font-weight:700; color:#3D2480; letter-spacing:.04em; text-transform:uppercase; border-bottom:1px solid #D8D0F0; }
        .ml-card-body { padding:18px; }

        /* Login btn */
        .ml-login-btn {
          width:100%; height:52px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; gap:11px;
          font-family:'Heebo',system-ui,sans-serif; font-size:15px; font-weight:800;
          cursor:pointer; border:none; outline:none; position:relative; overflow:hidden;
          background:linear-gradient(135deg,#3D2480,#5B3AAB); color:#fff;
          box-shadow:0 6px 24px rgba(91,58,171,.35); transition:all .2s;
        }
        .ml-login-btn:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(91,58,171,.45); }
        .ml-login-btn:active { transform:scale(.98); }
        .ml-login-btn:disabled { opacity:.65; cursor:not-allowed; transform:none; }
        .ml-login-btn .g-wrap {
          background:rgba(255,255,255,.15); border-radius:8px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        /* Step */
        .ml-step { display:flex; align-items:flex-start; gap:14px; padding:14px 16px; background:#fff; border-radius:14px; border:1px solid #E0DCF0; box-shadow:0 1px 4px rgba(91,58,171,.05); }
        .ml-step-num { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; flex-shrink:0; }
        .ml-step-arrow { width:1px; background:linear-gradient(180deg,#D8D0F0,transparent); margin:0 auto; height:16px; }

        /* Feature grid */
        .ml-feat { background:#fff; border-radius:14px; padding:14px 13px; border:1px solid #E0DCF0; box-shadow:0 1px 4px rgba(91,58,171,.05); }
        .ml-feat-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:9px; }

        /* Automation */
        .ml-auto { display:flex; align-items:flex-start; gap:12px; padding:13px 15px; background:#fff; border-radius:13px; border:1px solid #E0DCF0; box-shadow:0 1px 4px rgba(91,58,171,.05); }
        .ml-auto-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Flow bar */
        .ml-flow { display:flex; align-items:center; justify-content:center; gap:4px; flex-wrap:wrap; }
        .ml-flow-item { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .ml-flow-bubble { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .ml-flow-label { font-size:10px; font-weight:700; }
        .ml-flow-arrow { width:16px; height:1px; background:#D8D0F0; margin-bottom:18px; flex-shrink:0; }

        /* CTA bottom */
        .ml-cta-bottom {
          background:linear-gradient(135deg,#1E1040 0%,#2A1558 50%,#3D2480 100%);
          border-radius:18px; padding:24px 20px; text-align:center;
          border:1px solid rgba(201,168,76,.2);
        }
        .ml-cta-quote { font-size:13px; color:rgba(212,176,106,.8); font-style:italic; margin-bottom:10px; }
        .ml-cta-title { font-size:17px; font-weight:900; color:#fff; margin-bottom:5px; }
        .ml-cta-sub { font-size:12.5px; color:rgba(255,255,255,.55); margin-bottom:18px; }
        .ml-cta-btn {
          display:inline-flex; align-items:center; gap:8px;
          background:#fff; border-radius:12px; padding:11px 22px;
          border:none; cursor:pointer; font-family:'Heebo',system-ui,sans-serif;
          font-size:14px; font-weight:800; color:#3D2480;
          box-shadow:0 4px 14px rgba(0,0,0,.18); transition:all .2s;
        }
        .ml-cta-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,.25); }
        .ml-error { background:#FEF2F2; border-radius:10px; padding:10px 14px; font-size:13px; font-weight:600; color:#DC2626; margin-top:10px; text-align:center; }
        .ml-trust { display:flex; align-items:center; justify-content:center; gap:14px; margin-top:14px; flex-wrap:wrap; }
        .ml-trust-item { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:#8888AA; }
        .ml-section-label { font-size:10.5px; font-weight:700; color:#8888AA; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; }
      `}</style>

      <div className="ml-root">

        {/* ── Hero ── */}
        <div className="ml-hero">
          <div className="ml-hero-orb1" />
          <div className="ml-hero-orb2" />
          <div className="ml-hero-pattern" />

          <div className="ml-inner">
            {/* Nav */}
            <div className="ml-nav">
              <div className="ml-nav-logo">
                <div className="ml-nav-logobox">
                  <Image src="/logo-chabad.png" alt="השביל" width={36} height={36} style={{ objectFit:'contain' }} />
                </div>
                <div>
                  <div className="ml-nav-name">הַשְּׁבִיל</div>
                  <div className="ml-nav-sub">רשת חינוך חב״ד</div>
                </div>
              </div>
              <div style={{ background:'rgba(0,180,204,.15)', border:'1px solid rgba(0,180,204,.3)', borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:700, color:'rgba(0,180,204,.9)' }}>
                פורטל מועמדת
              </div>
            </div>

            {/* Hero content */}
            <div style={{ padding:'28px 0 0', textAlign:'center' }}>
              <div className="ml-badge">
                <GraduationCap size={12} />
                גיוס והשמה · רשת חינוך חב״ד
              </div>
              <h1 className="ml-hero-title">
                מצאי את<br />
                <span className="ml-hero-em">שביל השליחות</span><br />
                שלך
              </h1>
              <p className="ml-hero-sub">
                פלטפורמת הגיוס וההשמה הרשמית של הרשת —<br />
                פרופיל אחד, כל המשרות, עדכון בוואטסאפ
              </p>
            </div>
          </div>
        </div>

        <div className="ml-inner" style={{ paddingTop:'0' }}>

          {/* ── Login card ── */}
          <div style={{ marginTop:'-1px', marginBottom:'20px', position:'relative', zIndex:10 }}>
            <div className="ml-card" style={{ boxShadow:'0 12px 40px rgba(91,58,171,.18)' }}>
              <div style={{ height:'3px', background:'linear-gradient(90deg,#5B3AAB,#00B4CC)' }} />
              <div className="ml-card-body">
                <h2 style={{ fontSize:'17px', fontWeight:800, color:'#1A1A2E', margin:'0 0 3px', letterSpacing:'-.01em' }}>כניסה למערכת המועמדת</h2>
                <p style={{ fontSize:'13px', color:'#8888AA', margin:'0 0 18px' }}>מועמדת חדשה? הפרופיל ייפתח אוטומטית</p>

                <button className="ml-login-btn" onClick={handleGoogle} disabled={pending}>
                  <div className="g-wrap">{GOOGLE_SVG}</div>
                  <span>{pending ? 'מחברת...' : 'כניסה / הרשמה עם Google'}</span>
                </button>

                {error && <div className="ml-error">{error}</div>}

                <div className="ml-trust">
                  {[
                    { icon: CheckCircle, text: 'הרשמה חינמית' },
                    { icon: CheckCircle, text: 'פחות מ-5 דקות' },
                    { icon: MessageCircle, text: 'עדכונים ב-WhatsApp' },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="ml-trust-item">
                      <Icon size={11} color="#15803D" />
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── How it works ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ml-section-label">איך זה עובד</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {STEPS.map((s, i) => (
                <div key={s.n}>
                  <div className="ml-step">
                    <div className="ml-step-num" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
                      <span style={{ color:s.color, fontSize:'16px' }}>{s.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'14px', fontWeight:800, color:'#1A1A2E', marginBottom:'2px' }}>{s.title}</div>
                      <div style={{ fontSize:'12.5px', color:'#4A4A6A', lineHeight:1.45 }}>{s.desc}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className="ml-step-arrow" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Automations ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ml-card">
              <div className="ml-card-header">אוטומציות וזרימות</div>
              <div className="ml-card-body" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {AUTOMATIONS.map(({ title, desc, icon: Icon, color, bg }) => (
                  <div key={title} className="ml-auto">
                    <div className="ml-auto-icon" style={{ background:bg }}>
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
            <div className="ml-card">
              <div className="ml-card-header">מחזור חיים של הגשה</div>
              <div className="ml-card-body">
                <div className="ml-flow">
                  {[
                    { label:'הגשה',     color:'#5B3AAB', bg:'rgba(91,58,171,.1)' },
                    { label:'נצפתה',    color:'#0369A1', bg:'rgba(3,105,161,.1)' },
                    { label:'ראיון',    color:'#D97706', bg:'rgba(217,119,6,.1)' },
                    { label:'התקבלה',  color:'#15803D', bg:'rgba(21,128,61,.1)' },
                    { label:'משוב',     color:'#C9A84C', bg:'rgba(201,168,76,.1)' },
                  ].map(({ label, color, bg }, i, arr) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                      <div className="ml-flow-item">
                        <div className="ml-flow-bubble" style={{ background:bg }}>
                          <span style={{ fontSize:'11px', fontWeight:800, color }}>{label}</span>
                        </div>
                      </div>
                      {i < arr.length - 1 && <div className="ml-flow-arrow" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Features ── */}
          <div style={{ marginBottom:'20px' }}>
            <div className="ml-section-label">מה תקבלי במערכת</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="ml-feat">
                  <div className="ml-feat-icon" style={{ background:bg }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:800, color:'#1A1A2E', marginBottom:'3px' }}>{title}</div>
                  <div style={{ fontSize:'11.5px', color:'#8888AA', lineHeight:1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="ml-cta-bottom" style={{ marginBottom:'32px' }}>
            <div className="ml-cta-quote">״וְכָל נְתִיבוֹתֶיהָ שָׁלוֹם״ — משלי ג׳</div>
            <div className="ml-cta-title">מוכנה להתחיל את השביל שלך?</div>
            <div className="ml-cta-sub">הרשמה חינמית — כניסה מיידית</div>
            <button className="ml-cta-btn" onClick={handleGoogle} disabled={pending}>
              {GOOGLE_SVG}
              {pending ? 'מחברת...' : 'כניסה עם Google'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'0 0 28px', fontSize:'11px', color:'#8888AA', direction:'rtl' }}>
          הַשְּׁבִיל · רשת חינוך חב״ד · 2026
          <span style={{ margin:'0 8px' }}>·</span>
          <a href="/mosad" style={{ color:'#5B3AAB', textDecoration:'none', fontWeight:600 }}>פורטל מוסד <ArrowLeft size={10} style={{ display:'inline' }} /></a>
        </div>

      </div>
    </>
  )
}
