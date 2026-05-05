import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, city, type, principal, phone, address, email } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'שם מוסד חובה' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'אימייל חובה לשליחת הזמנה' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

  // Send invite via Supabase — generates a magic link + email automatically
  const { data: authData, error: authError } = await service.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${APP_URL}/auth/callback?next=/dashboard` }
  )
  if (authError || !authData.user)
    return NextResponse.json({ error: authError?.message ?? 'שגיאה ביצירת משתמש' }, { status: 500 })

  const { data: newProfile, error: pe } = await service
    .from('profiles')
    .insert({ id: authData.user.id, role: 'מוסד', full_name: principal || null, phone: phone || null })
    .select().single()
  if (pe) {
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: pe.message }, { status: 500 })
  }

  const { data: newInst, error: ie } = await service
    .from('institutions').insert({
      profile_id: newProfile.id,
      institution_name: name.trim(),
      city: city || null,
      institution_type: type || null,
      phone: phone || null,
      address: address || null,
      is_approved: true,
    }).select().single()
  if (ie) {
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: ie.message }, { status: 500 })
  }

  if (phone) {
    try {
      await sendSms(
        phone,
        `שלום${principal ? ' ' + principal : ''}, הוזמנת למערכת הגיוס של רשת חב"ד כנציג/ת "${name.trim()}". קישור ההפעלה נשלח לאימייל: ${email.trim()}. לאחר ההפעלה תוכל/י להיכנס ולהשלים את פרטי המוסד.`
      )
    } catch (err) {
      console.error('[institutions] SMS invite failed:', phone, err)
    }
  }

  return NextResponse.json({ ok: true, id: newInst.id }, { status: 201 })
}
