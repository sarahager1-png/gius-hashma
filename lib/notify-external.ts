import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

interface ExternalNotifyOpts {
  phone: string | null | undefined
  whatsapp_preference: boolean | null | undefined
  waMessage: string
  smsMessage: string
  emailFallback?: () => Promise<void>
}

// WhatsApp is the default channel. SMS is used only when whatsapp_preference === false.
// If no phone — email fallback.
export async function sendExternal(opts: ExternalNotifyOpts): Promise<void> {
  const { phone, whatsapp_preference, waMessage, smsMessage, emailFallback } = opts

  if (phone) {
    if (whatsapp_preference === false) {
      await sendSms(phone, smsMessage)
    } else {
      await sendWA(phone, waMessage)
    }
  } else if (emailFallback) {
    await emailFallback()
  }
}
