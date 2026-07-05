import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { resolvePostLogin } from '@/lib/auth/post-login'
import { safeNext } from '@/lib/auth/safe-next'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')
  const next  = safeNext(searchParams.get('next'))

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
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

  const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError || !session) {
    return NextResponse.redirect(`${origin}/login?error=exchange`)
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
