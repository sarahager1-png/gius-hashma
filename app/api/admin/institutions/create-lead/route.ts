import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

export async function POST(req: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, city, principal, phone, address } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'שם מוסד חובה' }, { status: 400 })
  if (!phone?.trim()) return NextResponse.json({ error: 'מספר וואטסאפ חובה לשליחת קישור הרשמה' }, { status: 400 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  // Create a lead record so the registration form can be pre-filled
  const { data: lead, error: leadErr } = await service
    .from('institution_leads')
    .insert({
      institution_name: name.trim(),
      city: city?.trim() || null,
      phone: phone.trim(),
    })
    .select('id')
    .single()

  if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 })

  const link = `${appUrl}/register/institution-form?lead=${lead.id}`
  const salutation = principal?.trim() ? `שלום ${principal.trim()}! 👋` : 'שלום! 👋'
  const msg = `${salutation}\nאת מוזמנת להצטרף למערכת *השביל* — פלטפורמה חכמה לגיוס והשמת סגל הוראה ברשת חינוך חב"ד.\n\nלהשלמת הרשמת המוסד ולקבלת גישה מלאה:\n${link}\n\nנשמח לענות על כל שאלה 😊`
  const smsText = `${salutation.replace(' 👋', '')} את מוזמנת למערכת השביל. למילוי פרטי המוסד: ${link}`

  const waSent = await sendWA(phone.trim(), msg)
  if (!waSent) {
    await sendSms(phone.trim(), smsText)
  }

  return NextResponse.json({ ok: true, lead_id: lead.id, link })
}
