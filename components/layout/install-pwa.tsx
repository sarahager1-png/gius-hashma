'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent
    __pwaInstalled?: boolean
  }
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || !!window.__pwaInstalled
}

const DISMISS_KEY = 'pwa-dismissed-until'
const DISMISS_DAYS = 3

export default function InstallPwa() {
  const [ready, setReady] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [iosExpanded, setIosExpanded] = useState(false)

  useEffect(() => {
    setInstalled(isInStandaloneMode())
    setIos(isIos())

    const until = localStorage.getItem(DISMISS_KEY)
    if (until && Date.now() < parseInt(until)) {
      setDismissed(true)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    // delay to avoid flash on load
    setTimeout(() => setReady(true), 1500)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  function dismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(until))
    setDismissed(true)
  }

  if (!ready || installed || dismissed) return null

  // אין prompt ואין iOS — הדפדפן לא תומך בהתקנה
  const canInstall = !!prompt || ios
  if (!canInstall) return null

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:w-[360px] z-50 rounded-[18px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1A0B35 0%, #2D1B5C 100%)',
        boxShadow: '0 16px 48px rgba(15,11,35,.45), 0 4px 12px rgba(75,46,131,.3)',
        border: '1px solid rgba(255,255,255,.12)',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-[12px] overflow-hidden shrink-0 bg-white p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="icon" className="w-full h-full object-contain" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-extrabold leading-tight text-white">
            התקיני את מערכת השביל
          </p>
          <p className="text-[11.5px] mt-0.5" style={{ color: 'rgba(255,255,255,.55)' }}>
            {ios ? 'הוסיפי למסך הבית — פתיחה מהירה תמיד' : 'גישה מהירה מהמסך הבית או שולחן העבודה'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {prompt && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold text-white"
              style={{ background: '#00A7B5', boxShadow: '0 2px 8px rgba(0,167,181,.35)' }}
            >
              <Download size={13} />
              התקני
            </button>
          )}
          {ios && !prompt && (
            <button
              onClick={() => setIosExpanded(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold text-white"
              style={{ background: '#00A7B5', boxShadow: '0 2px 8px rgba(0,167,181,.35)' }}
            >
              <Plus size={13} />
              הוסיפי
            </button>
          )}
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,.4)' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS instructions */}
      {ios && iosExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
          {[
            { icon: <Share size={14} />, text: 'לחצי על כפתור השיתוף בסרגל התחתון' },
            { icon: <Plus size={14} />, text: 'בחרי "הוסף למסך הבית"' },
            { icon: <Download size={14} />, text: 'לחצי "הוסף" — והאפליקציה תופיע על המסך' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)' }}>
                {s.icon}
              </div>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.75)' }}>{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
