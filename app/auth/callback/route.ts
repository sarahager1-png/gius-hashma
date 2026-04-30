import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const token = searchParams.get('token')
  const type  = searchParams.get('type')
  const next  = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, 'https://giuus.vercel.app'))
    }
  }

  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: type as 'recovery' | 'magiclink' | 'email' })
    if (!error) {
      return NextResponse.redirect(new URL(next, 'https://giuus.vercel.app'))
    }
  }

  return NextResponse.redirect(new URL('/login?err=callback', 'https://giuus.vercel.app'))
}
