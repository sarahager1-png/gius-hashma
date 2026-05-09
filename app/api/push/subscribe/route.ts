import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — save push subscription
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })

  const service = createServiceClient()
  await service.from('push_subscriptions').upsert({
    profile_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth:   keys.auth,
  }, { onConflict: 'endpoint' })

  return NextResponse.json({ ok: true })
}

// DELETE — remove push subscription
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  const service = createServiceClient()
  await service
    .from('push_subscriptions')
    .delete()
    .eq('profile_id', user.id)
    .eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}
