import webpush from 'web-push'
import { isShabbatOrChag } from '@/lib/shabbat'

// VAPID keys must be set in environment variables.
// Generate once with: npx web-push generate-vapid-keys
const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY             ?? ''
const VAPID_EMAIL   = process.env.VAPID_EMAIL                   ?? 'mailto:admin@example.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
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

  // No push notifications on Shabbat / Yom Tov. The in-app DB notification is
  // still stored by the caller, so the user sees it after Shabbat/Chag.
  if (isShabbatOrChag()) return

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
