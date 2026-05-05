import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const reqUrl = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? reqUrl.origin
  const { searchParams } = reqUrl
  const code  = searchParams.get('code')
  const token = searchParams.get('token')
  const type  = searchParams.get('type')
  const next  = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const service = createServiceClient()

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profile) {
        // מוסד — check approval status
        if (profile.role === 'מוסד') {
          const { data: institution } = await service
            .from('institutions')
            .select('is_approved')
            .eq('profile_id', data.user.id)
            .maybeSingle()

          if (!institution?.is_approved) {
            return NextResponse.redirect(new URL('/register/institution/pending', origin))
          }
        }
        // Approved / other roles → dashboard
        return NextResponse.redirect(new URL('/dashboard', origin))
      }

      // No profile — check for pending candidate request
      const { data: candidateReq } = await service
        .from('candidate_requests')
        .select('status')
        .eq('profile_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (candidateReq) {
        if (candidateReq.status === 'נדחתה') {
          return NextResponse.redirect(new URL('/register/candidate?rejected=1', origin))
        }
        return NextResponse.redirect(new URL('/register/candidate/pending', origin))
      }

      // No request at all → go to registration form
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: type as 'recovery' | 'magiclink' | 'email' })
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?err=callback', origin))
}
