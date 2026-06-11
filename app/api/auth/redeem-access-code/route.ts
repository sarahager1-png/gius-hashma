import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.toUpperCase().trim() : ''
  if (!code) return NextResponse.json({ error: 'קוד נדרש' }, { status: 400 })

  const service = createServiceClient()

  const { data: row } = await service
    .from('access_codes')
    .select('id, user_email, used_at, expires_at')
    .eq('code', code)
    .single()

  if (!row)
    return NextResponse.json({ error: 'קוד שגוי או לא קיים' }, { status: 404 })
  if (row.used_at)
    return NextResponse.json({ error: 'קוד זה כבר נוצל' }, { status: 410 })
  if (!row.user_email)
    return NextResponse.json({ error: 'קוד זה אינו מוגדר לכניסה — פני למנהלת' }, { status: 400 })
  if (row.expires_at && new Date(row.expires_at) < new Date())
    return NextResponse.json({ error: 'הקוד פג תוקפו — בקשי קוד חדש' }, { status: 410 })

  let { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: row.user_email,
  })

  // First-ever login with this email — create the auth user, then retry
  if (error) {
    const { error: createErr } = await service.auth.admin.createUser({
      email: row.user_email,
      email_confirm: true,
    })
    if (!createErr) {
      ;({ data, error } = await service.auth.admin.generateLink({
        type: 'magiclink',
        email: row.user_email,
      }))
    }
  }

  if (error || !data?.properties?.hashed_token) {
    console.error('[redeem-access-code]', error)
    return NextResponse.json({ error: 'שגיאה ביצירת קישור כניסה — נסי שוב' }, { status: 500 })
  }

  await service
    .from('access_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)

  // Verify server-side via /auth/confirm (the raw action_link returns the session
  // in a URL fragment the server can never read). For a never-confirmed user the
  // generated token is a 'signup' token, not 'magiclink' — use the actual type.
  const vtype = data.properties.verification_type || 'magiclink'
  const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${encodeURIComponent(vtype)}`
  return NextResponse.json({ url: confirmUrl })
}
