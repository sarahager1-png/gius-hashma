import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { resolvePostLogin } from '@/lib/auth/post-login'
import { safeNext } from '@/lib/auth/safe-next'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.verifyOtp({ token_hash, type })
  if (error || !session) {
    return NextResponse.redirect(`${origin}/login?error=expired_link`)
  }

  const service = createServiceClient()
  const path = await resolvePostLogin(
    service,
    session.user.id,
    session.user.email?.toLowerCase() ?? '',
    session.user.user_metadata?.full_name ?? session.user.email ?? '',
  )

  // Honor a preserved destination (e.g. a candidate link clicked from WhatsApp),
  // but never override error redirects or first-time registration flows
  const canFollowNext = next && !path.startsWith('/login') && !path.startsWith('/register')
  return NextResponse.redirect(`${origin}${canFollowNext ? next : path}`)
}
