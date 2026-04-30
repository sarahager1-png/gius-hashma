'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPwa() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    if (localStorage.getItem('pwa-dismissed') === '1') {
      setDismissed(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
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
    localStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
  }

  if (installed || dismissed || !prompt) return null

  return (
    <div
      className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:w-[340px] z-50 rounded-[18px] p-4 flex items-center gap-3"
      style={{
        background: 'linear-gradient(135deg, #1A0B35 0%, #2D1B5C 100%)',
        boxShadow: '0 16px 48px rgba(15,11,35,.40), 0 4px 12px rgba(75,46,131,.30)',
        border: '1px solid rgba(255,255,255,.12)',
      }}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-[13px] overflow-hidden shrink-0"
        style={{ background: '#4B2E83', boxShadow: '0 2px 8px rgba(75,46,131,.4)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="icon" className="w-full h-full object-cover" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-extrabold leading-tight text-white">
          התקיני את האפליקציה
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: 'rgba(255,255,255,.55)' }}>
          גיוס והשמה — גישה מהירה מהמסך הבית
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold text-white transition-all"
          style={{ background: '#00A7B5', boxShadow: '0 2px 8px rgba(0,167,181,.35)' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Download size={13} />
          התקני
        </button>
        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ color: 'rgba(255,255,255,.45)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
