'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, Copy, Check } from 'lucide-react'
import { detectInAppBrowser } from '@/lib/in-app-browser'

const noopSubscribe = () => () => {}
const getUa = () => navigator.userAgent
const getServerUa = () => ''

// useSyncExternalStore (not useState+useEffect, not a lazy useState initializer)
// so the value used to hydrate the client render matches the server render
// (both read the '' server snapshot) and only swaps to the real UA in the
// client-only pass React does right after — no hydration mismatch.
function useUserAgent(): string {
  return useSyncExternalStore(noopSubscribe, getUa, getServerUa)
}

export default function InAppBrowserBanner() {
  const ua = useUserAgent()
  const appName = detectInAppBrowser(ua)
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Let pages with a min-height:100svh hero (e.g. mumedet) shrink by exactly
  // this banner's real height, so a sticky-centered CTA doesn't get pushed
  // below the fold. No-op (0px) when the banner isn't mounted.
  useEffect(() => {
    if (!appName || !ref.current) return
    const root = document.documentElement
    root.style.setProperty('--iab-banner-h', `${ref.current.offsetHeight}px`)
    return () => { root.style.removeProperty('--iab-banner-h') }
  }, [appName])

  if (!appName) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        position: 'sticky', top: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 16px', width: '100%',
        background: 'linear-gradient(135deg, #92400E, #B45309)',
        color: '#fff', fontFamily: "'Heebo', system-ui, sans-serif",
        boxShadow: '0 2px 12px rgba(0,0,0,.25)',
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 800, marginBottom: '3px' }}>
          הכניסה עם Google לא תעבוד כאן
        </div>
        <div style={{ fontSize: '12.5px', lineHeight: 1.6 }}>
          פתחת את הקישור מתוך {appName} — גוגל חוסם כניסה מדפדפן פנימי.{' '}
          {isIos
            ? 'לחצי לחיצה ארוכה על הקישור ובחרי "פתח ב-Safari"'
            : 'פתחי את תפריט שלוש הנקודות למעלה ובחרי "פתח בדפדפן"'}
          , או:
        </div>
        <button
          onClick={copyLink}
          style={{
            marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.5)',
            background: 'rgba(0,0,0,.28)', color: '#fff',
            fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Heebo', system-ui, sans-serif",
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'הקישור הועתק!' : 'העתקת קישור'}
        </button>
      </div>
    </div>
  )
}
