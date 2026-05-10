import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

interface ExternalNotifyOpts {
  phone: string | null | undefined
  whatsapp_preference: boolean | null | undefined
  waMessage: string
  smsMessage: string
  emailFallback?: () => Promise<void>
}

// Sends through exactly one channel based on user preference.
// WhatsApp if preferred, SMS if not, email if no phone.
export async function sendExternal(opts: ExternalNotifyOpts): Promise<void> {
  const { phone, whatsapp_preference, waMessage, smsMessage, emailFallback } = opts

  if (phone) {
    if (whatsapp_preference !== false) {
      await sendWA(phone, waMessage)
    } else {
      await sendSms(phone, smsMessage)
    }
  } else if (emailFallback) {
    await emailFallback()
  }
}
