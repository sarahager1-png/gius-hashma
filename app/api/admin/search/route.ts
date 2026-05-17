import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת', 'מנהל רשת'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ candidates: [], institutions: [], jobs: [] })

  const pattern = `%${q}%`

  const [candidatesRes, institutionsRes, jobsRes] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, phone, role')
      .or(`full_name.ilike.${pattern},phone.ilike.${pattern}`)
      .in('role', ['מועמדת'])
      .limit(6),

    service
      .from('institutions')
      .select('id, institution_name, city, district, is_approved')
      .or(`institution_name.ilike.${pattern},city.ilike.${pattern}`)
      .limit(6),

    service
      .from('jobs')
      .select('id, title, city, status, institutions(institution_name)')
      .or(`title.ilike.${pattern},city.ilike.${pattern}`)
      .limit(6),
  ])

  // resolve candidate profile_id → candidate row for links
  const profileIds = (candidatesRes.data ?? []).map(p => p.id)
  const { data: candRows } = profileIds.length
    ? await service.from('candidates').select('id, profile_id').in('profile_id', profileIds)
    : { data: [] as { id: string; profile_id: string }[] }

  const candIdMap = Object.fromEntries((candRows ?? []).map(c => [c.profile_id, c.id]))

  const candidates = (candidatesRes.data ?? []).map(p => ({
    id:       candIdMap[p.id] ?? null,
    name:     p.full_name,
    phone:    p.phone,
    href:     candIdMap[p.id] ? `/candidates/${candIdMap[p.id]}` : null,
  }))

  const institutions = (institutionsRes.data ?? []).map(i => ({
    id:               i.id,
    institution_name: i.institution_name,
    city:             i.city,
    district:         i.district,
    is_approved:      i.is_approved,
    href:             '/admin/institutions',
  }))

  type JobRow = { id: string; title: string; city: string | null; status: string; institutions: { institution_name: string } | null }
  const jobs = ((jobsRes.data ?? []) as unknown as JobRow[]).map(j => ({
    id:               j.id,
    title:            j.title,
    city:             j.city,
    status:           j.status,
    institution_name: j.institutions?.institution_name ?? null,
    href:             `/jobs/${j.id}`,
  }))

  return NextResponse.json({ candidates, institutions, jobs })
}
