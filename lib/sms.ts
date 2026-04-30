// SMS via Inforu (inforu.co.il) — most common Israeli SMS provider
// Set env vars: INFORU_USERNAME, INFORU_API_KEY, INFORU_SENDER_NAME

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const username = process.env.INFORU_USERNAME
  const apiKey   = process.env.INFORU_API_KEY
  const sender   = process.env.INFORU_SENDER_NAME ?? 'גיוס'

  if (!username || !apiKey) {
    console.warn('[SMS] INFORU_USERNAME or INFORU_API_KEY not set — skipping SMS')
    return false
  }

  // normalize Israeli phone: 05X → 9725X
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '972')

  try {
    const res = await fetch('https://www.inforu.co.il/api/sendsms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Data: {
          Message: message,
          PhoneNumbers: normalized,
          Settings: { SenderName: sender },
        },
        User: { Username: username, ApiKey: apiKey },
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.Status === 'SUCCESS' || data.InforuMessageId) return true
    console.error('[SMS] Inforu error:', data)
    return false
  } catch (e) {
    console.error('[SMS] fetch error:', e)
    return false
  }
}
