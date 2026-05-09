import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface CsvRow {
  name: string
  phone: string
  city?: string
  specialization?: string
  academic_level?: string
  availability_status?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const rows: CsvRow[] = body.rows ?? []

  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: 'rows required' }, { status: 400 })

  let inserted = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.name?.trim() || !row.phone?.trim()) {
      errors.push(`שורה חסרה שם או טלפון: ${JSON.stringify(row)}`)
      continue
    }

    try {
      // Create auth user via admin (no password, they'll use phone/OTP)
      const { data: authData, error: authErr } = await service.auth.admin.createUser({
        phone: row.phone.trim(),
        phone_confirm: true,
        user_metadata: { full_name: row.name.trim() },
      })

      let profileId: string | null = null

      if (authErr) {
        // User might already exist — try to find by phone
        const { data: existingProfile } = await service
          .from('profiles')
          .select('id')
          .eq('phone', row.phone.trim())
          .maybeSingle()
        profileId = existingProfile?.id ?? null
      } else {
        profileId = authData.user?.id ?? null
      }

      if (!profileId) {
        errors.push(`לא ניתן ליצור משתמש: ${row.name} (${row.phone})`)
        continue
      }

      // Upsert profile
      await service.from('profiles').upsert({
        id: profileId,
        role: 'מועמדת',
        full_name: row.name.trim(),
        phone: row.phone.trim(),
      }, { onConflict: 'id' })

      // Upsert candidate
      await service.from('candidates').upsert({
        profile_id: profileId,
        city: row.city?.trim() || null,
        specialization: row.specialization?.trim() || null,
        academic_level: row.academic_level?.trim() || null,
        availability_status: row.availability_status?.trim() || 'פתוחה להצעות',
      }, { onConflict: 'profile_id' })

      inserted++
    } catch (err) {
      errors.push(`שגיאה בשורה ${row.name}: ${err}`)
    }
  }

  return NextResponse.json({ ok: true, inserted, errors })
}
