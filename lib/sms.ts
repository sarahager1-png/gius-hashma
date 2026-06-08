// SMS via Inforu (inforu.co.il) — Israeli SMS provider
// Set env vars: INFORU_USERNAME, INFORU_API_KEY, INFORU_SENDER_NAME
// Without credentials, logs code to console (dev mode)
import { isShabbatOrChag, isQuietHours } from '@/lib/shabbat'

// ── Named SMS helpers ────────────────────────────────────────────
export function smsNewApplication(phone: string, candidateName: string, jobTitle: string) {
  return sendSms(phone, `הגשה חדשה! ${candidateName} הגישה מועמדות למשרת "${jobTitle}". לצפייה: giuus.vercel.app/institution/applications`)
}

export function smsCandidateApplicationConfirmed(phone: string, candidateName: string, jobTitle: string, institutionName: string) {
  const inst = institutionName ? ` ב${institutionName}` : ''
  return sendSms(phone, `שלום ${candidateName}! תודה שפנית אלינו 💙 הגשתך למשרת "${jobTitle}"${inst} התקבלה. נעדכן אותך בכל התפתחות.`)
}

export function smsApplicationViewed(phone: string, institutionName: string, jobTitle: string) {
  return sendSms(phone, `עדכון: ${institutionName} עיינה בהגשתך למשרת "${jobTitle}". בברכה, מערכת גיוס חב"ד`)
}

export function smsInstitutionApproved(phone: string, institutionName: string) {
  return sendSms(phone, `ברכות! "${institutionName}" אושר במערכת גיוס חב"ד. כניסה: giuus.vercel.app`)
}

export function smsCandidateWelcome(phone: string, candidateName: string) {
  return sendSms(phone, `ברוכה הבאה ${candidateName}! הפרופיל שלך נוצר במערכת גיוס חב"ד. השלימי את הפרופיל: giuus.vercel.app/profile`)
}

export function smsSurveyInvitation(phone: string, token: string, otherPartyName: string) {
  return sendSms(phone, `שאלון שביעות רצון על ${otherPartyName} — 2 דקות בלבד: giuus.vercel.app/survey?t=${token}`)
}

// ── Core send function ───────────────────────────────────────
export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (isShabbatOrChag()) {
    console.log(`[Shabbat] SMS send suppressed → ${phone}`)
    return false
  }
  if (isQuietHours()) {
    console.log(`[QuietHours] SMS send suppressed → ${phone}`)
    return false
  }

  const username = process.env.INFORU_USERNAME
  const apiKey   = process.env.INFORU_API_KEY
  const sender   = process.env.INFORU_SENDER_NAME ?? 'גיוס'

  if (!username || !apiKey) {
    console.log(`\n[SMS DEV] ➜ ${phone}\n${message}\n`)
    return true  // return true so OTP flow works in dev/test
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
