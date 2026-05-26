import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']

export async function POST() {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !ADMIN_ROLES.includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // כל ה-leads שעדיין לא נרשמו
  const { data: leads } = await service
    .from('institution_leads')
    .select('id, institution_name, city, phone')
    .is('registered_profile_id', null)

  if (!leads?.length) return NextResponse.json({ sent: 0, skipped: 0 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  let sent = 0
  let skipped = 0

  for (const lead of leads) {
    const phone = lead.phone?.trim()
    if (!phone) { skipped++; continue }

    const link = `${appUrl}/register/institution-form?lead=${lead.id}`
    const salutation = `שלום ${lead.institution_name}! 👋`
    const waMsg = `${salutation}\nאת מוזמנת להצטרף למערכת *השביל* — פלטפורמה חכמה לגיוס והשמת סגל הוראה ברשת חינוך חב"ד.\n\nלהשלמת הרשמת המוסד ולקבלת גישה מלאה:\n${link}\n\nנשמח לענות על כל שאלה 😊`
    const smsMsg = `שלום ${lead.institution_name}! את מוזמנת למערכת השביל. להשלמת הרשמת המוסד: ${link}`

    // וואטסאפ ראשון, אם נכשל — SMS
    const waSent = await sendWA(phone, waMsg)
    if (!waSent) {
      await sendSms(phone, smsMsg)
    }
    sent++
  }

  return NextResponse.json({ sent, skipped })
}
