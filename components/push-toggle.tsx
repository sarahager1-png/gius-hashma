'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export default function PushToggle() {
  const [supported, setSupported]   = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC) return
    setSupported(true)

    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [])

  if (!supported) return null

  async function toggle() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()

      if (existing) {
        await existing.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        })
        setSubscribed(false)
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        })
        const json = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        })
        setSubscribed(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>התראות דפדפן</p>
        <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-4)' }}>
          {subscribed ? 'התראות פעילות על המכשיר הזה' : 'קבלי התראות ישירות לדפדפן'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold transition-all"
        style={subscribed
          ? { background: '#FEE2E2', color: '#DC2626' }
          : { background: 'var(--purple-050)', color: 'var(--purple)' }}>
        {subscribed ? <><BellOff size={14} />כבי התראות</> : <><Bell size={14} />הפעילי התראות</>}
      </button>
    </div>
  )
}
