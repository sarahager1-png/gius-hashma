import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'missing user_id' }, { status: 400 })

  const { data: authUser, error: userErr } = await service.auth.admin.getUserById(user_id)
  if (userErr || !authUser.user?.email)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: authUser.user.email,
  })

  if (linkErr || !linkData?.properties?.action_link)
    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })

  return NextResponse.json({ link: linkData.properties.action_link })
}
