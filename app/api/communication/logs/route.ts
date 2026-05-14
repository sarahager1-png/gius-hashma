import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const channel   = sp.get('channel')
  const status    = sp.get('status')
  const profileId = sp.get('profile_id')
  const limit     = Math.min(parseInt(sp.get('limit') ?? '100'), 500)

  let q = service
    .from('communication_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (channel)   q = q.eq('channel', channel)
  if (status)    q = q.eq('status', status)
  if (profileId) q = q.eq('recipient_profile_id', profileId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
