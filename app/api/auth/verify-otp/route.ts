import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const OTP_COOKIE = 'sms_otp_ok'
const TTL_SEC    = 12 * 60 * 60 // 12 hours

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { code } = await req.json()
  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'קוד לא תקין' }, { status: 400 })
  }

  const service = createServiceClient()

  // Get the latest unverified OTP for this user
  const { data: otp } = await service
    .from('login_otps')
    .select('*')
    .eq('user_id', user.id)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!otp) {
    return NextResponse.json({ error: 'לא נמצא קוד — בקשי קוד חדש' }, { status: 400 })
  }

  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: 'הקוד פג תוקפו — בקשי קוד חדש' }, { status: 400 })
  }

  // Increment attempts
  await service
    .from('login_otps')
    .update({ attempts: otp.attempts + 1 })
    .eq('id', otp.id)

  if (otp.attempts >= 5) {
    return NextResponse.json({ error: 'חרגת ממספר הניסיונות — בקשי קוד חדש' }, { status: 429 })
  }

  if (otp.code !== code) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 400 })
  }

  // Mark as verified
  await service
    .from('login_otps')
    .update({ verified: true })
    .eq('id', otp.id)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(OTP_COOKIE, user.id, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   TTL_SEC,
    path:     '/',
  })
  return res
}
