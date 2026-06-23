'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Sparkles, ClipboardCheck, HeartHandshake } from 'lucide-react'

function LoginPageInner() {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading]         = useState(false)
  const [formError, setFormError]     = useState('')
  const [accessCode, setAccessCode]   = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError]     = useState('')
  const searchParams = useSearchParams()

  const errParam = searchParams.get('error')
  const urlError = errParam === 'oauth'               ? 'שגיאה בהתחברות עם Google — בדקי שהחשבון מורשה'
                 : errParam === 'exchange'             ? 'שגיאה בקבלת הסשן — נסי שוב'
                 : errParam === 'institution_rejected' ? 'בקשת הרישום של המוסד לא אושרה. לפרטים ניתן לפנות למנהלת הרשת.'
                 : ''
  const error = urlError || formError

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile) return
      const home = profile.role === 'מועמדת' ? '/profile'
        : profile.role === 'מוסד' ? '/institution/jobs'
        : '/dashboard'
      router.replace(home)
    })
  }, [router, supabase])

  async function signInWithGoogle() {
    setLoading(true); setFormError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) { setFormError('שגיאה בכניסה עם Google'); setLoading(false) }
  }

  async function redeemCode() {
    if (!accessCode.trim()) return
    setCodeLoading(true); setCodeError('')
    const res = await fetch('/api/auth/redeem-access-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: accessCode.trim() }),
    })
    const data = await res.json()
    setCodeLoading(false)
    if (data.url) {
      window.location.href = data.url
    } else {
      setCodeError(data.error ?? 'קוד שגוי או שפג')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes shimG    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes shimGold { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes pulseGlow{ 0%,100%{opacity:.28} 50%{opacity:.6} }
        @keyframes pulseWarm{ 0%,100%{opacity:.18} 50%{opacity:.42} }
        @keyframes lightLeak{ 0%,100%{opacity:.03} 50%{opacity:.08} }
        @keyframes grainAnim{ 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(1px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(2px,-2px)} }
        @keyframes floatCard{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes dustRise { 0%{opacity:0;transform:translateY(0)} 15%{opacity:.55} 85%{opacity:.18} 100%{opacity:0;transform:translateY(-90px)} }

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lg-root {
          height: 100svh;
          display: flex; direction: rtl;
          font-family: 'Heebo', system-ui, sans-serif;
          background: #060F1A;
        }

        /* ── Desktop hero panel ───────────────────────────────── */
        .lg-hero {
          width: 44%; flex-shrink: 0;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
        }
        @media(max-width:1023px){ .lg-hero { display:none; } }

        .lg-hero-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse 160% 45% at 50% 0%,rgba(0,195,225,.65) 0%,rgba(0,140,185,.22) 40%,transparent 62%),
            radial-gradient(ellipse 60% 55% at 50% 50%,rgba(201,168,76,.07) 0%,transparent 58%),
            radial-gradient(ellipse 45% 35% at 92% 80%,rgba(201,168,76,.10) 0%,transparent 55%),
            radial-gradient(ellipse 35% 28% at 6% 65%,rgba(0,140,180,.06) 0%,transparent 55%),
            linear-gradient(180deg,#071820 0%,#060F18 100%);
        }
        .lg-hero-bg::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(125deg,rgba(201,168,76,.08) 0%,transparent 40%),linear-gradient(245deg,rgba(0,155,195,.04) 0%,transparent 30%);
          animation:lightLeak 14s ease-in-out infinite alternate;
        }
        .lg-hero-bg::after{
          content:'';position:absolute;inset:0;
          background-image:
            radial-gradient(1px 1px at 18% 18%,rgba(255,255,255,.18) 0%,transparent 100%),
            radial-gradient(1px 1px at 74% 10%,rgba(255,255,255,.14) 0%,transparent 100%),
            radial-gradient(1.5px 1.5px at 44% 32%,rgba(255,255,255,.12) 0%,transparent 100%),
            radial-gradient(1px 1px at 90% 55%,rgba(255,255,255,.1) 0%,transparent 100%),
            radial-gradient(1px 1px at 30% 68%,rgba(255,255,255,.09) 0%,transparent 100%),
            radial-gradient(1px 1px at 62% 80%,rgba(255,255,255,.08) 0%,transparent 100%),
            radial-gradient(1px 1px at 8% 44%,rgba(255,255,255,.11) 0%,transparent 100%),
            radial-gradient(1px 1px at 52% 90%,rgba(255,255,255,.07) 0%,transparent 100%),
            radial-gradient(1px 1px at 35% 5%,rgba(255,255,255,.14) 0%,transparent 100%);
          filter:blur(.3px);opacity:.65;
        }
        .lg-hero-grain{
          position:absolute;inset:0;pointer-events:none;z-index:2;opacity:.028;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size:180px 180px;animation:grainAnim .4s steps(1) infinite;
        }
        .lg-hero-dust{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden;}
        .lg-hero-dust::before{
          content:'';position:absolute;bottom:35%;left:46%;width:2px;height:2px;border-radius:50%;
          background:rgba(201,168,76,.35);
          box-shadow:14px 9px 0 0 rgba(201,168,76,.18),-20px 16px 0 1px rgba(0,200,235,.12),38px -6px 0 0 rgba(255,255,255,.07),-10px -22px 0 1px rgba(201,168,76,.1);
          animation:dustRise 11s ease-out 1.8s infinite;
        }
        .lg-hero-content{
          position:relative;z-index:10;flex:1;display:flex;flex-direction:column;
          align-items:center;justify-content:center;padding:32px 44px;text-align:center;
        }
        .lg-logo-wrap{position:relative;margin-bottom:24px;}
        .lg-logo-box{
          position:relative;width:72px;height:72px;background:rgba(255,252,248,.93);border-radius:20px;
          display:flex;align-items:center;justify-content:center;padding:6px;margin:0 auto;
          box-shadow:inset 0 1.5px 0 rgba(255,255,255,.95),0 4px 20px rgba(0,0,0,.4),0 0 36px rgba(0,175,215,.2),0 0 70px rgba(201,168,76,.1);
        }
        .lg-logo-box::before{
          content:'';position:absolute;inset:-20px;border-radius:40px;
          background:radial-gradient(ellipse,rgba(0,175,215,.16) 0%,rgba(201,168,76,.09) 55%,transparent 70%);
          filter:blur(22px);animation:pulseGlow 6s ease-in-out infinite;pointer-events:none;
        }
        .lg-logo-box::after{
          content:'';position:absolute;inset:-5px;border-radius:25px;
          border:1px solid rgba(201,168,76,.16);animation:pulseWarm 7s ease-in-out infinite;pointer-events:none;
        }
        .lg-hero-eyebrow{font-size:10px;font-weight:700;letter-spacing:.18em;color:rgba(0,195,225,.55);margin-bottom:8px;}
        .lg-hero-divider{width:36px;height:1.5px;background:linear-gradient(90deg,transparent,rgba(0,195,225,.5),transparent);margin:0 auto 16px;}
        .lg-hero-name{font-size:52px;font-weight:900;letter-spacing:-.04em;line-height:1;color:#fff;margin-bottom:6px;}
        .lg-hero-sub{font-size:12px;font-weight:400;letter-spacing:.08em;color:rgba(255,255,255,.32);margin-bottom:44px;}
        .lg-quote-card{
          width:100%;max-width:298px;margin:0 auto 40px;
          background:rgba(201,168,76,.055);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(201,168,76,.22);border-radius:18px;padding:20px 22px;
          box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 0 28px rgba(201,168,76,.09);position:relative;
        }
        .lg-quote-mark{position:absolute;top:-10px;right:18px;font-size:40px;line-height:1;background:linear-gradient(135deg,#D4A840,#EDD870,#C9941C);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-family:Georgia,serif;}
        .lg-quote-text{font-size:16px;font-weight:700;color:rgba(255,255,255,.88);line-height:1.65;margin-bottom:10px;}
        .lg-quote-text em{font-style:normal;background:linear-gradient(90deg,#C8A040 0%,#EDD070 30%,#F8E898 55%,#EDD070 75%,#C8A040 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimG 8s linear infinite;}
        .lg-quote-src{font-size:10px;font-weight:700;letter-spacing:.12em;background:linear-gradient(90deg,#C9A84C,#E8C96A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimGold 6s linear infinite;opacity:.8;}
        .lg-features{display:flex;flex-direction:column;gap:10px;width:100%;max-width:290px;margin:0 auto;}
        .lg-feat-row{display:flex;align-items:center;gap:14px;padding:13px 16px;border-radius:15px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);transition:background .25s,border-color .25s,transform .25s;position:relative;overflow:hidden;}
        .lg-feat-row::before{content:'';position:absolute;right:0;top:0;bottom:0;width:2px;border-radius:0 2px 2px 0;}
        .lg-feat-row:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);transform:translateX(-2px);}
        .lg-feat-icon{width:36px;height:36px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .lg-feat-text{font-size:12.5px;font-weight:500;color:rgba(255,255,255,.58);flex:1;text-align:right;line-height:1.4;}
        .lg-hero-footer{position:relative;z-index:10;text-align:center;padding:0 0 20px;font-size:10px;color:rgba(255,255,255,.12);letter-spacing:.05em;}

        /* ── Form panel ───────────────────────────────────────── */
        .lg-form{
          flex:1;display:flex;flex-direction:column;
          position:relative;overflow:hidden;
          background:linear-gradient(170deg,#EAF2FA 0%,#DDE8F3 55%,#E6EDF6 100%);
        }
        .lg-form::before{content:'';position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:90%;height:420px;border-radius:50%;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(0,175,210,.18) 0%,transparent 65%);pointer-events:none;}
        .lg-form::after{content:'';position:absolute;bottom:-60px;left:-60px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.09) 0%,transparent 70%);pointer-events:none;}
        .lg-form-grain{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.007;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");background-size:180px 180px;animation:grainAnim .4s steps(1) infinite;}
        .lg-topbar{position:absolute;top:16px;left:20px;z-index:10;}
        .lg-admin-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:600;color:rgba(26,46,66,.45);background:rgba(26,46,66,.06);border:1px solid rgba(26,46,66,.1);text-decoration:none;transition:all .2s;font-family:'Heebo',system-ui,sans-serif;}
        .lg-admin-btn:hover{background:rgba(26,46,66,.1);color:rgba(26,46,66,.75);border-color:rgba(26,46,66,.18);}

        /* Mobile header — compact */
        .lg-mobile-brand{display:none;flex-direction:row;align-items:center;gap:12px;padding:56px 24px 16px;position:relative;z-index:2;}
        @media(max-width:1023px){.lg-mobile-brand{display:flex;}}
        .lg-mobile-logo{width:48px;height:48px;border-radius:14px;background:rgba(255,252,248,.95);box-shadow:0 4px 20px rgba(26,46,66,.15),0 0 24px rgba(0,175,215,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .lg-mobile-titles{display:flex;flex-direction:column;}

        /* Scrollable form area */
        .lg-form-main{
          flex:1;display:flex;align-items:flex-start;justify-content:center;
          padding:16px 20px 24px;position:relative;z-index:2;
          overflow-y:auto;-webkit-overflow-scrolling:touch;
        }
        @media(min-width:1024px){
          .lg-form-main{align-items:center;padding:40px 24px;}
        }

        .lg-card{
          width:100%;max-width:400px;
          background:rgba(255,255,255,.78);
          backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);
          border:1px solid rgba(255,255,255,.9);border-top:1px solid rgba(255,255,255,.95);
          border-radius:24px;padding:32px 28px;
          box-shadow:0 2px 0 rgba(255,255,255,.95) inset,0 20px 60px rgba(10,30,60,.14),0 4px 16px rgba(10,30,60,.08);
          position:relative;
        }
        @media(min-width:1024px){
          .lg-card{padding:40px 36px;animation:floatCard 6s ease-in-out infinite;}
        }
        .lg-card::before{content:'';position:absolute;top:0;left:16px;right:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,175,210,.5),rgba(201,168,76,.3),transparent);border-radius:1px;}

        .lg-welcome{margin-bottom:24px;animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both;}
        .lg-eyebrow-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .lg-eyebrow-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#B8920A,#D4A820);}
        .lg-eyebrow-text{font-size:11px;font-weight:700;letter-spacing:.12em;color:rgba(160,118,10,.8);text-transform:uppercase;}
        .lg-heading{font-size:26px;font-weight:900;color:rgba(8,24,44,.9);line-height:1.2;letter-spacing:-.03em;margin-bottom:6px;}
        .lg-sub{font-size:13px;color:rgba(8,24,44,.46);line-height:1.6;font-weight:400;}

        .lg-tabs{display:flex;gap:8px;margin-bottom:20px;animation:fadeUp .5s .1s cubic-bezier(.16,1,.3,1) both;}
        .lg-tab{flex:1;padding:11px 10px;font-size:13px;font-weight:700;color:rgba(8,24,44,.42);background:rgba(8,24,44,.06);border:1px solid rgba(8,24,44,.1);border-radius:13px;cursor:pointer;transition:all .22s cubic-bezier(.16,1,.3,1);font-family:'Heebo',system-ui,sans-serif;letter-spacing:-.01em;}
        .lg-tab.active{color:#fff;background:linear-gradient(135deg,#007A8C,#00A4BC);border-color:rgba(0,164,188,.6);box-shadow:0 4px 18px rgba(0,140,175,.3),inset 0 1px 0 rgba(255,255,255,.2);}
        .lg-tab:hover:not(.active){color:rgba(8,24,44,.72);background:rgba(8,24,44,.1);border-color:rgba(8,24,44,.16);transform:translateY(-1px);}

        .lg-goog-btn{width:100%;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:11px;font-family:'Heebo',system-ui,sans-serif;font-size:14.5px;font-weight:700;cursor:pointer;outline:none;position:relative;overflow:hidden;background:rgba(8,24,44,.07);border:1px solid rgba(8,24,44,.14);color:rgba(8,24,44,.82);transition:all .28s cubic-bezier(.16,1,.3,1);letter-spacing:-.01em;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 2px 8px rgba(10,30,60,.08);animation:fadeUp .6s .2s cubic-bezier(.16,1,.3,1) both;}
        .lg-goog-btn:hover{transform:translateY(-2px);background:rgba(8,24,44,.11);border-color:rgba(8,24,44,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 6px 20px rgba(10,30,60,.12);}
        .lg-goog-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
        .lg-goog-icon{background:rgba(255,255,255,.9);border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.1);}

        .lg-divider{display:flex;align-items:center;gap:14px;margin:16px 0;animation:fadeIn .5s .3s both;}
        .lg-divider-line{flex:1;height:1px;background:rgba(8,24,44,.1);}
        .lg-divider-text{font-size:11px;font-weight:600;color:rgba(8,24,44,.32);letter-spacing:.08em;}

        .lg-register{display:block;text-align:center;animation:fadeIn .5s .35s both;}
        .lg-register a{font-size:13px;font-weight:600;color:rgba(0,130,155,.85);text-decoration:none;border-bottom:1px solid rgba(0,130,155,.25);transition:all .2s;}
        .lg-register a:hover{color:rgba(0,155,185,.95);border-color:rgba(0,155,185,.5);}

        .lg-error{margin-top:10px;padding:10px 14px;border-radius:12px;font-size:13px;font-weight:600;color:#FCA5A5;background:rgba(200,60,60,.14);border:1px solid rgba(200,60,60,.25);text-align:center;animation:fadeUp .3s ease both;}

        /* ── Code section — prominent ───────────────────────── */
        .lg-code-section{
          margin-top:16px;
          border-radius:16px;
          border:1.5px solid rgba(0,140,175,.28);
          background:rgba(0,140,175,.06);
          padding:16px 18px;
          animation:fadeIn .4s .4s both;
        }
        .lg-code-header{
          display:flex;align-items:center;gap:10px;
          margin-bottom:6px;
        }
        .lg-code-icon{
          width:32px;height:32px;border-radius:10px;flex-shrink:0;
          background:linear-gradient(135deg,#007A8C,#00A4BC);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(0,140,175,.3);
        }
        .lg-code-title{
          font-size:14px;font-weight:800;color:rgba(0,100,130,.9);letter-spacing:-.01em;
        }
        .lg-code-hint{
          font-size:12px;color:rgba(8,24,44,.45);margin-bottom:12px;line-height:1.5;
          padding-right:42px;
        }
        .lg-code-row{display:flex;flex-direction:column;gap:8px;}
        .lg-code-input{
          width:100%;height:50px;border-radius:12px;border:1.5px solid rgba(8,24,44,.16);
          padding:0 14px;font-size:22px;font-weight:800;letter-spacing:.22em;
          text-align:center;outline:none;background:rgba(255,255,255,.7);
          color:rgba(8,24,44,.85);font-family:monospace;
          transition:border-color .18s,background .18s;text-transform:uppercase;
        }
        .lg-code-input::placeholder{letter-spacing:.14em;font-size:14px;font-weight:500;color:rgba(8,24,44,.3);}
        .lg-code-input:focus{border-color:rgba(0,140,175,.65);background:#fff;box-shadow:0 0 0 3px rgba(0,140,175,.12);}
        .lg-code-btn{
          width:100%;height:50px;padding:0 20px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#007A8C,#00A4BC);
          color:#fff;font-size:14px;font-weight:700;cursor:pointer;
          transition:all .22s;font-family:'Heebo',system-ui,sans-serif;
          box-shadow:0 3px 12px rgba(0,140,175,.3);white-space:nowrap;
        }
        .lg-code-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
        .lg-code-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(0,140,175,.4);}
        .lg-code-error{margin-bottom:10px;padding:8px 12px;border-radius:10px;font-size:12.5px;font-weight:600;color:#FCA5A5;background:rgba(200,60,60,.12);border:1px solid rgba(200,60,60,.22);text-align:center;}

        .lg-form-footer{position:relative;z-index:2;text-align:center;padding:0 0 16px;font-size:10.5px;color:rgba(26,46,66,.3);letter-spacing:.04em;flex-shrink:0;}
      `}</style>

      <div className="lg-root">
        {/* Desktop hero */}
        <div className="lg-hero">
          <div className="lg-hero-bg" />
          <div className="lg-hero-grain" />
          <div className="lg-hero-dust" />
          <div className="lg-hero-content">
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
                { Icon: Sparkles,       color: '#00B4CC', text: 'חיבור מועמדות למוסדות חינוך חב״ד בלבד' },
                { Icon: ClipboardCheck, color: '#C9A84C', text: 'עדכוני התקדמות ישירות ב-WhatsApp' },
                { Icon: HeartHandshake, color: '#7B5AC4', text: 'התאמה לפי עיר, גיל, סוג מוסד ושליחות' },
              ] as { Icon: React.ElementType; color: string; text: string }[]).map(({ Icon, color, text }) => (
                <div key={text} className="lg-feat-row" style={{ '--accent': color } as React.CSSProperties}>
                  <div className="lg-feat-icon" style={{ background:`${color}18`, border:`1px solid ${color}30`, boxShadow:`0 0 12px ${color}22` }}>
                    <Icon size={17} color={color} style={{ filter:`drop-shadow(0 0 4px ${color}88)` }} />
                  </div>
                  <span className="lg-feat-text">{text}</span>
                  <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'2.5px', background:`linear-gradient(180deg,transparent,${color}55,transparent)`, borderRadius:'0 2px 2px 0' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="lg-hero-footer">הַשְּׁבִיל · עתודות לשליחות · 2026</div>
        </div>

        {/* Form panel */}
        <div className="lg-form">
          <div className="lg-form-grain" />
          <div className="lg-topbar">
            <a href="/register/admin" className="lg-admin-btn"><KeyRound size={12} />הנהלה</a>
          </div>

          {/* Mobile compact header */}
          <div className="lg-mobile-brand">
            <div className="lg-mobile-logo">
              <Image src="/logo-chabad.png" alt="השביל" width={36} height={36} style={{ objectFit:'contain' }} />
            </div>
            <div className="lg-mobile-titles">
              <div style={{ fontSize:'18px', fontWeight:900, color:'#1A2E42', letterSpacing:'-.03em', lineHeight:1.1 }}>הַשְּׁבִיל</div>
              <div style={{ fontSize:'11px', fontWeight:600, color:'#007A8C' }}>מערכת גיוס והשמה · רשת חב״ד</div>
            </div>
          </div>

          <div className="lg-form-main">
            <div className="lg-card">
              <div className="lg-welcome">
                <div className="lg-eyebrow-row">
                  <div className="lg-eyebrow-dot" />
                  <span className="lg-eyebrow-text">כניסה למערכת</span>
                </div>
                <h1 className="lg-heading">ברוכה הבאה,</h1>
                <p className="lg-sub">רשומה כבר? היכנסי עם Google.פעם ראשונה? הגישי מועמדות.</p>
              </div>
              <div className="lg-tabs">
                <button className="lg-tab active">מועמדת</button>
                <a href="/mosad" className="lg-tab" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>מוסד</a>
              </div>
              <button onClick={signInWithGoogle} disabled={loading} className="lg-goog-btn">
                {loading
                  ? <span>מתחברת...</span>
                  : <><div className="lg-goog-icon"><GoogleIcon /></div><span>כניסה עם Google</span></>}
              </button>
              {error && <div className="lg-error">{error}</div>}
              <div className="lg-divider">
                <div className="lg-divider-line" />
                <span className="lg-divider-text">או</span>
                <div className="lg-divider-line" />
              </div>
              <div className="lg-register">
                <a href="/register/candidate">הגשת מועמדות חדשה ←</a>
              </div>

              {/* Code login — prominent card */}
              <div className="lg-code-section">
                <div className="lg-code-header">
                  <div className="lg-code-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span className="lg-code-title">קיבלתי קוד כניסה ב-WhatsApp</span>
                </div>
                <div className="lg-code-hint">הזיני את הקוד שקיבלת על מנת להיכנס</div>
                {codeError && <div className="lg-code-error">{codeError}</div>}
                <div className="lg-code-row">
                  <input
                    type="text"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && accessCode.length === 6 && redeemCode()}
                    placeholder="XXXXXX"
                    maxLength={6}
                    dir="ltr"
                    className="lg-code-input"
                  />
                  <button onClick={redeemCode} disabled={codeLoading || accessCode.length !== 6} className="lg-code-btn">
                    {codeLoading ? '...' : 'כנסי'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg-form-footer" style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/logo-mefateach.png" alt="מפתח · שרה הגר" style={{ width: 'auto', maxWidth: 140, height: 'auto', objectFit: 'contain', opacity: 0.85 }} />
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
