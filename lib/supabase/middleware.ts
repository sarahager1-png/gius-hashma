import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const PUBLIC_PATHS = ['/login', '/register', '/reset-password', '/mosad', '/mumedet', '/nehal', '/demo', '/enter', '/auth/callback', '/auth/confirm', '/api/auth/redeem-access-code', '/api/profile', '/api/dashboard', '/api/auto-login', '/api/check-cookie', '/api/candidate-requests', '/api/access-codes', '/survey', '/api/surveys', '/api/webhooks/whatsapp', '/guide', '/terms', '/privacy', '/landing', '/api/register/institution-form', '/api/cron/', '/api/admin/send-correction', '/api/admin/notify-incomplete-profiles']
  const isPublic = request.nextUrl.pathname === '/' ||
    PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    const target = request.nextUrl.pathname + request.nextUrl.search
    url.pathname = '/login'
    url.search = ''
    // Preserve the destination (e.g. a candidate link opened from WhatsApp)
    // so the login flow can return to it instead of the role home page
    if (!request.nextUrl.pathname.startsWith('/api')) {
      url.searchParams.set('next', target)
    }
    return NextResponse.redirect(url)
  }

  // pass pathname to server components for role-based access control
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  return supabaseResponse
}
