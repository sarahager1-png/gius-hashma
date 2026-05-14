import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

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

  const userId = session.user.id
  const email  = session.user.email?.toLowerCase() ?? ''

  const service = createServiceClient()

  const { data: profile } = await service.from('profiles').select('role').eq('id', userId).single()
  if (profile) {
    return NextResponse.redirect(`${origin}${roleHome(profile.role)}`)
  }

  const { data: preReg } = await service
    .from('pre_registered_institutions')
    .select('*')
    .eq('email', email)
    .single()

  if (preReg) {
    await service.from('profiles').insert({
      id:        userId,
      role:      'מוסד',
      full_name: preReg.full_name ?? preReg.institution_name,
    })
    await service.from('institutions').insert({
      profile_id:       userId,
      institution_name: preReg.institution_name,
      city:             preReg.city,
      institution_type: preReg.institution_type,
      is_approved:      true,
      approved_at:      new Date().toISOString(),
    })
    await service.from('pre_registered_institutions').delete().eq('email', email)
    return NextResponse.redirect(`${origin}/institution/jobs`)
  }

  // Unknown Google user — create a minimal 'מועמדת' profile + blank candidates row
  // so they can access the dashboard immediately after completing the form
  await service.from('profiles').insert({
    id:        userId,
    role:      'מועמדת',
    full_name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
  })
  await service.from('candidates').insert({ profile_id: userId })

  return NextResponse.redirect(`${origin}/register/candidate?google=1`)
}

function roleHome(role: string): string {
  if (role === 'מועמדת') return '/profile'
  if (role === 'מוסד')   return '/institution/jobs'
  return '/dashboard'
}
