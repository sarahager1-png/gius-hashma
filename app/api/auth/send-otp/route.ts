import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('role, phone, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'פרופיל לא נמצא' }, { status: 404 })

  // Admins skip OTP
  if (['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    return NextResponse.json({ skip: true })
  }

  if (!profile.phone) {
    return NextResponse.json({ noPhone: true })
  }

  const code      = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Invalidate previous OTPs for this user
  await service
    .from('login_otps')
    .update({ verified: true })
    .eq('user_id', user.id)
    .eq('verified', false)

  const { error: insertErr } = await service
    .from('login_otps')
    .insert({
      user_id:    user.id,
      phone:      profile.phone,
      code,
      expires_at: expiresAt.toISOString(),
    })

  if (insertErr) {
    console.error('[send-otp] insert error:', insertErr)
    return NextResponse.json({ error: 'שגיאה ביצירת קוד' }, { status: 500 })
  }

  const ok = await sendSms(
    profile.phone,
    `קוד האימות שלך למערכת גיוס חב"ד: ${code}\nתקף ל-10 דקות. אל תשתפי קוד זה.`
  )

  if (!ok) {
    console.warn('[send-otp] SMS failed but allowing dev fallback')
  }

  // Mask phone: keep last 2 digits
  const maskedPhone = profile.phone.replace(/\d(?=\d{2})/g, '*')

  const devMode = !process.env.INFORU_USERNAME || !process.env.INFORU_API_KEY

  return NextResponse.json({
    sent:        true,
    maskedPhone,
    ...(devMode ? { devCode: code } : {}),
  })
}
