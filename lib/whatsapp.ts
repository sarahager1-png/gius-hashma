// WhatsApp Business Cloud API (Meta)
// Env vars: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN, WHATSAPP_VERIFY_TOKEN, WHATSAPP_BUSINESS_PHONE

const PHONE_ID = process.env.WHATSAPP_PHONE_ID
const TOKEN    = process.env.WHATSAPP_TOKEN
const BIZ_PHONE = process.env.WHATSAPP_BUSINESS_PHONE ?? ''

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0/, '972')
}

// Send a free-form text message (requires active 24h customer service window)
export async function sendWA(to: string, text: string): Promise<boolean> {
  if (!PHONE_ID || !TOKEN) {
    console.log(`\n[WA DEV] ➜ ${to}\n${text}\n`)
    return true
  }

  const phone = normalizePhone(to)
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text, preview_url: false },
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.messages?.[0]?.id) return true
    console.error('[WA] Send error:', JSON.stringify(data))
    return false
  } catch (e) {
    console.error('[WA] Fetch error:', e)
    return false
  }
}

// Generate a wa.me deep-link to the business number with pre-filled text
// Include in SMS messages so users can initiate a WA session from there
export function waDeepLink(text: string): string {
  if (!BIZ_PHONE) return ''
  return `https://wa.me/${BIZ_PHONE}?text=${encodeURIComponent(text)}`
}

// Parse incoming WhatsApp webhook entry and return an array of messages
export interface WaMessage {
  from: string      // normalized phone (972...)
  text: string      // message body
  msgId: string     // WhatsApp message id
  name: string      // display name
}

export function parseWebhookMessages(body: unknown): WaMessage[] {
  try {
    const entry = (body as any)?.entry?.[0]
    const changes = entry?.changes?.[0]?.value
    const msgs: WaMessage[] = []

    for (const msg of changes?.messages ?? []) {
      if (msg.type !== 'text') continue
      msgs.push({
        from: msg.from,
        text: (msg.text?.body ?? '').trim(),
        msgId: msg.id,
        name: changes?.contacts?.find((c: any) => c.wa_id === msg.from)?.profile?.name ?? '',
      })
    }
    return msgs
  } catch {
    return []
  }
}

// Detect intent from a freeform reply
export type Intent = 'confirm' | 'decline' | 'new_job' | 'help' | 'unknown'

const CONFIRM_WORDS = ['1', 'כן', 'מאשרת', 'מאשר', 'אשר', 'אישור', 'ok', 'yes', '✓', '👍', 'בסדר']
const DECLINE_WORDS = ['2', 'לא', 'מסרבת', 'מסרב', 'סירוב', 'no', 'לא יכולה', 'לא יכול', '👎', 'ביטול']
const NEW_JOB_WORDS  = ['משרה חדשה', '+משרה', 'פרסם משרה', 'הוסף משרה', 'new job']

export function parseIntent(text: string): Intent {
  const t = text.trim().toLowerCase()
  if (CONFIRM_WORDS.some(w => t === w.toLowerCase() || t.startsWith(w.toLowerCase()))) return 'confirm'
  if (DECLINE_WORDS.some(w => t === w.toLowerCase() || t.startsWith(w.toLowerCase()))) return 'decline'
  if (NEW_JOB_WORDS.some(w => t.includes(w.toLowerCase()))) return 'new_job'
  if (['עזרה', 'help', 'תפריט', 'menu'].includes(t)) return 'help'
  return 'unknown'
}
