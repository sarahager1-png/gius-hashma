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

        @keyframes shimG { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

        .lp-root {
          height: 100svh;
          overflow: hidden;
          background: #061A28;
          color: #fff;
          font-family: 'Heebo', system-ui, sans-serif;
          direction: rtl;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* BG gradient */
        .lp-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 160% 70% at 50% 10%, rgba(0,210,240,.6) 0%, rgba(0,150,190,.25) 35%, transparent 62%),
            radial-gradient(ellipse 60% 45% at 88% 85%, rgba(201,168,76,.14) 0%, transparent 55%),
            linear-gradient(180deg, #071E30 0%, #061A28 100%);
        }

        /* ── NAV ── */
        .lp-nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px;
          flex-shrink: 0;
        }
        .lp-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .lp-logo-box {
          width:44px; height:44px; background:#fff; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 16px rgba(0,0,0,.3); padding:4px; flex-shrink:0;
        }
        .lp-logo-name { font-size:20px; font-weight:900; color:#fff; letter-spacing:-.03em; }
        .lp-nav-right { display:flex; align-items:center; gap:6px; }
        .lp-nav-btn {
          padding:7px 14px; border-radius:10px; font-size:12.5px; font-weight:700;
          color:rgba(255,255,255,.6); cursor:pointer; text-decoration:none;
          border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05);
          font-family:'Heebo',system-ui,sans-serif; transition:all .2s;
        }
        .lp-nav-btn:hover { color:#fff; background:rgba(255,255,255,.1); }

        /* ── QUOTE ── */
        .lp-quote {
          position: relative; z-index: 10;
          padding: 0 20px 14px;
          flex-shrink: 0;
        }
        .lp-quote-box {
          max-width: 580px; margin: 0 auto;
          background: rgba(201,168,76,.07);
          border: 1px solid rgba(201,168,76,.22);
          border-radius: 16px;
          padding: 14px 18px;
          position: relative;
        }
        .lp-quote-mark-sm {
          font-size: 32px; line-height: 1; color: rgba(201,168,76,.4);
          font-family: Georgia, serif; float: right; margin-left: 8px; margin-top: -4px;
        }
        .lp-quote-text-sm {
          font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,.78);
          line-height: 1.7; margin-bottom: 8px;
        }
        .lp-quote-src {
          font-size: 10.5px; font-weight: 600; color: rgba(201,168,76,.6);
          letter-spacing: .07em;
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
        }
        .lp-brand {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          margin-bottom: 20px;
        }
        .lp-brand-logo {
          width: 64px; height: 64px; background: #fff; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 24px rgba(0,0,0,.3); padding: 5px;
        }
        .lp-brand-name {
          font-size: 34px; font-weight: 900; color: #fff; letter-spacing: -.035em; line-height:1;
        }
        .lp-brand-sub {
          font-size: 11px; font-weight: 500; color: rgba(255,255,255,.4); letter-spacing: .08em;
        }
        .lp-title {
          font-size: clamp(22px, 5vw, 32px); font-weight: 800; color: #fff;
          letter-spacing: -.025em; line-height: 1.2; margin-bottom: 18px;
        }
        .lp-title-em {
          background: linear-gradient(90deg,#D4B06A 0%,#F5E090 45%,#D4B06A 70%,#F0D080 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimG 9s linear infinite;
        }

        /* CTA card */
        .lp-card {
          width: 100%; max-width: 380px;
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 24px; padding: 22px 22px 18px;
          box-shadow: 0 20px 50px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.08);
        }
        .lp-card-title { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 3px; }
        .lp-card-sub   { font-size: 11.5px; color: rgba(255,255,255,.4); margin-bottom: 16px; }
        .lp-goog-btn {
          width: 100%; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          font-family: 'Heebo',system-ui,sans-serif; font-size: 14.5px; font-weight: 700;
          cursor: pointer; outline: none; position: relative;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2);
          color: #fff; transition: all .22s; letter-spacing: -.01em;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
        }
        .lp-goog-btn:hover { background: rgba(255,255,255,.13); border-color: rgba(255,255,255,.32); transform:translateY(-1px); }
        .lp-goog-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .lp-goog-icon { background:rgba(255,255,255,.9); border-radius:7px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lp-mosad-link {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 10px; padding: 10px;
          font-size: 12px; font-weight: 600; color: rgba(0,180,204,.7);
          text-decoration: none; border-radius: 10px; transition: all .2s;
        }
        .lp-mosad-link:hover { color: rgba(0,180,204,.95); background: rgba(0,180,204,.07); }
        .lp-err { background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.3); border-radius:8px; padding:8px 12px; font-size:12px; color:#FCA5A5; margin-top:8px; text-align:center; }

        /* ── ACCORDION BOTTOM BAR ── */
        .lp-acc-bar {
          position: relative; z-index: 10;
          display: flex; gap: 8px;
          padding: 0 20px 20px;
          flex-shrink: 0;
          justify-content: center;
        }
        .lp-acc-btn {
          flex: 1; max-width: 160px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 12px; border-radius: 14px;
          font-family: 'Heebo',system-ui,sans-serif; font-size: 13px; font-weight: 700;
          color: rgba(255,255,255,.65); cursor: pointer; border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.05); backdrop-filter: blur(10px);
          transition: all .2s;
        }
        .lp-acc-btn.active { color:#fff; background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.22); }
        .lp-acc-btn:hover { color:#fff; background:rgba(255,255,255,.09); }

        /* ── BOTTOM SHEET ── */
        .lp-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
          animation: fadeIn .2s ease;
          display: flex; align-items: flex-end;
        }
        .lp-sheet {
          width: 100%; max-height: 72svh;
          background: #0D1A28;
          border-top: 1px solid rgba(255,255,255,.12);
          border-radius: 24px 24px 0 0;
          padding: 20px 20px 32px;
          overflow-y: auto;
          animation: slideUp .28s cubic-bezier(.16,1,.3,1);
        }
        .lp-sheet-handle {
          width: 36px; height: 4px; border-radius: 2px;
          background: rgba(255,255,255,.18); margin: 0 auto 18px;
        }
        .lp-sheet-title {
          font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 4px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-sheet-sub { font-size: 13px; color: rgba(255,255,255,.4); margin-bottom: 24px; line-height: 1.5; }

        /* Journey in sheet */
        .lp-steps { display: flex; flex-direction: column; gap: 12px; }
        .lp-step-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px 16px; border-radius: 14px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
        }
        .lp-step-num-sm {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
        }
        .lp-step-info-title { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 2px; }
        .lp-step-info-sub { font-size: 12px; color: rgba(255,255,255,.4); line-height: 1.4; }

        /* Features in sheet */
        .lp-feat-grid-sm { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media(min-width:480px){ .lp-feat-grid-sm { grid-template-columns: repeat(4,1fr); } }
        .lp-feat-sm {
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          border-radius: 14px; padding: 14px 12px;
        }
        .lp-feat-sm-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
        .lp-feat-sm-title { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 3px; }
        .lp-feat-sm-desc  { font-size: 11px; color: rgba(255,255,255,.4); line-height: 1.4; }

        /* Network pills in sheet */
        .lp-net-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .lp-net-pill {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          border-radius: 999px; padding: 8px 16px;
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,.7);
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

        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-logo">
            <div className="lp-logo-box">
              <Image src="/logo-chabad.png" alt="השביל" width={36} height={36} style={{ objectFit:'contain' }} />
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
            <p className="lp-quote-text-sm">
              עבודה במוסד של כ&quot;ק מו&quot;ח אדמו&quot;ר זצוקללה&quot;ה נבג&quot;מ זי&quot;ע ובפרט במקצוע החינוך על טהרת הקודש – הרי זה צינור וכלי לקבלת ברכות השי&quot;ת בכלל.
            </p>
            <div className="lp-quote-src">הרבי · התקשרות · עמוד 115</div>
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

          <h1 className="lp-title lp-fade lp-d2">
            מצאי את <span className="lp-title-em">שביל השליחות</span> שלך
          </h1>

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
                    <button onClick={() => setPanel(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer' }}><X size={18}/></button>
                  </div>
                  <div className="lp-sheet-sub">חמישה צעדים — מהרשמה ועד השמה</div>
                  <div className="lp-steps">
                    {JOURNEY.map(s => (
                      <div key={s.n} className="lp-step-row">
                        <div className="lp-step-num-sm" style={{ background:`${s.color}18`, border:`1.5px solid ${s.color}44`, color: s.color }}>{s.n}</div>
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
                    <button onClick={() => setPanel(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer' }}><X size={18}/></button>
                  </div>
                  <div className="lp-sheet-sub">כלים שנבנו עבור שליחות חינוכית</div>
                  <div className="lp-feat-grid-sm">
                    {FEATURES.map(({ icon: Icon, title, desc, c }) => (
                      <div key={title} className="lp-feat-sm">
                        <div className="lp-feat-sm-icon" style={{ background:`${c}18` }}>
                          <Icon size={16} color={c} />
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
                    <button onClick={() => setPanel(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer' }}><X size={18}/></button>
                  </div>
                  <div className="lp-sheet-sub">פלטפורמה לרשת חינוך חב״ד — מוסדות, שלוחים ומועמדות</div>
                  <div className="lp-net-pills">
                    {NETWORK.map(({ label, dot, icon: Icon }) => (
                      <div key={label} className="lp-net-pill">
                        <span className="lp-net-dot" style={{ background: dot }} />
                        <Icon size={13} color={dot} />
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
