import webpush from 'web-push'
import { isShabbatOrChag, isQuietHours } from '@/lib/shabbat'

// VAPID keys must be set in environment variables.
// Generate once with: npx web-push generate-vapid-keys
const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY             ?? ''
const RAW_EMAIL     = process.env.VAPID_EMAIL                   ?? 'admin@example.com'

// web-push requires the VAPID subject to be a mailto:/https: URL.
// A bare email (e.g. VAPID_EMAIL=noreply@giuus.vercel.app) would throw at build.
const VAPID_SUBJECT = /^(mailto:|https?:)/.test(RAW_EMAIL) ? RAW_EMAIL : `mailto:${RAW_EMAIL}`

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  } catch (e) {
    console.error('[webpush] invalid VAPID config, push disabled:', e)
  }
}

export interface PushSubscriptionRecord {
  endpoint: string
  p256dh:   string
  auth:     string
}

export async function sendPushToSubscription(
  sub: PushSubscriptionRecord,
  payload: { title: string; body: string; url?: string }
) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return

  // No push notifications on Shabbat / Yom Tov, or outside 08:00–20:00 Israel time.
  if (isShabbatOrChag()) return
  if (isQuietHours()) return

  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 24 } // 24h
  )
}

export { VAPID_PUBLIC }
