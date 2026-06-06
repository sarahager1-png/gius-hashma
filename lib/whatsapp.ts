// WhatsApp via Green API
// Env vars: GREEN_API_URL, GREEN_API_INSTANCE_ID, GREEN_API_TOKEN, WHATSAPP_BUSINESS_PHONE
import { isShabbatOrChag } from '@/lib/shabbat'

const GREEN_URL      = process.env.GREEN_API_URL
const INSTANCE_ID    = process.env.GREEN_API_INSTANCE_ID
const GREEN_TOKEN    = process.env.GREEN_API_TOKEN
const BIZ_PHONE      = process.env.WHATSAPP_BUSINESS_PHONE ?? ''

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0/, '972')
}

// Format phone as Green API chatId: 972XXXXXXXXX@c.us
function toChatId(phone: string): string {
  return `${normalizePhone(phone)}@c.us`
}

// Extract plain phone number from chatId
export function fromChatId(chatId: string): string {
  return chatId.replace('@c.us', '').replace('@g.us', '')
}

export async function sendWA(to: string, text: string): Promise<boolean> {
  // Never send on Shabbat / Yom Tov
  if (isShabbatOrChag()) {
    console.log(`[Shabbat] WhatsApp send suppressed → ${to}`)
    return false
  }

  if (!GREEN_URL || !INSTANCE_ID || !GREEN_TOKEN) {
    console.log(`\n[WA DEV] ➜ ${to}\n${text}\n`)
    return true
  }

  const chatId = toChatId(to)
  try {
    const res = await fetch(
      `${GREEN_URL}/waInstance${INSTANCE_ID}/sendMessage/${GREEN_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: text }),
      },
    )
    const data = await res.json().catch(() => ({}))
    if (data.idMessage) return true
    console.error('[WA] Send error:', JSON.stringify(data))
    return false
  } catch (e) {
    console.error('[WA] Fetch error:', e)
    return false
  }
}

// Generate a wa.me deep-link to the business number with pre-filled text
export function waDeepLink(text: string): string {
  if (!BIZ_PHONE) return ''
  return `https://wa.me/${BIZ_PHONE}?text=${encodeURIComponent(text)}`
}

// Parse incoming Green API webhook and return an array of messages
export interface WaMessage {
  from: string      // normalized phone (972...)
  text: string      // message body
  msgId: string     // message id
  name: string      // display name
}

interface GreenWebhook {
  typeWebhook?: string
  idMessage?: string
  senderData?: { chatId?: string; sender?: string; senderName?: string }
  messageData?: {
    typeMessage?: string
    textMessageData?: { textMessage?: string }
    extendedTextMessageData?: { text?: string }
  }
}

export function parseWebhookMessages(body: unknown): WaMessage[] {
  try {
    const wb = body as GreenWebhook
    if (wb?.typeWebhook !== 'incomingMessageReceived') return []
    const msgType = wb.messageData?.typeMessage
    if (msgType !== 'textMessage' && msgType !== 'extendedTextMessage') return []

    const chatId = wb.senderData?.chatId ?? ''
    const from   = fromChatId(chatId)
    const text   = (
      wb.messageData?.textMessageData?.textMessage ??
      wb.messageData?.extendedTextMessageData?.text ??
      ''
    ).trim()

    if (!from || !text) return []

    return [{
      from,
      text,
      msgId: wb.idMessage ?? '',
      name:  wb.senderData?.senderName ?? '',
    }]
  } catch {
    return []
  }
}

// Detect intent from a freeform reply
export type Intent =
  | 'confirm' | 'decline'
  | 'new_job'
  | 'jobs' | 'apply'
  | 'my_applications'
  | 'register'
  | 'help' | 'unknown'

const CONFIRM_WORDS      = ['1', 'כן', 'מאשרת', 'מאשר', 'אשר', 'אישור', 'ok', 'yes', '✓', '👍', 'בסדר']
const DECLINE_WORDS      = ['2', 'לא', 'מסרבת', 'מסרב', 'סירוב', 'no', 'לא יכולה', 'לא יכול', '👎', 'ביטול']
const NEW_JOB_WORDS      = ['משרה חדשה', '+משרה', 'פרסם משרה', 'הוסף משרה', 'new job']
const JOBS_WORDS         = ['משרות', 'משרה', 'עבודה', 'חפש', 'מה יש', 'jobs', 'הצג משרות']
const APPLY_WORDS        = ['הגש', 'להגיש', 'אני רוצה', 'apply', 'הגשה']
const MY_APPS_WORDS      = ['הגשות', 'הגשות שלי', 'סטטוס', 'status', 'מה קורה', 'עדכון']
const REGISTER_WORDS     = ['הרשמה', 'להצטרף', 'רוצה להצטרף', 'רשמי אותי', 'register', 'new', 'חדשה']

export function parseIntent(text: string): Intent {
  const t = text.trim().toLowerCase()
  if (CONFIRM_WORDS.some(w => t === w.toLowerCase() || t.startsWith(w.toLowerCase()))) return 'confirm'
  if (DECLINE_WORDS.some(w => t === w.toLowerCase() || t.startsWith(w.toLowerCase()))) return 'decline'
  if (NEW_JOB_WORDS.some(w => t.includes(w.toLowerCase()))) return 'new_job'
  if (APPLY_WORDS.some(w => t.includes(w.toLowerCase()))) return 'apply'
  if (MY_APPS_WORDS.some(w => t.includes(w.toLowerCase()))) return 'my_applications'
  if (JOBS_WORDS.some(w => t.includes(w.toLowerCase()))) return 'jobs'
  if (REGISTER_WORDS.some(w => t.includes(w.toLowerCase()))) return 'register'
  if (['עזרה', 'help', 'תפריט', 'menu', 'שלום', 'היי', 'הי', 'hello'].includes(t)) return 'help'
  return 'unknown'
}
