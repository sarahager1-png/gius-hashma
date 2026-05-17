import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'placements'

  if (type === 'placements') {
    const { data } = await service
      .from('applications')
      .select('id, applied_at, updated_at, candidates!inner(city, district, specialization, academic_level, profiles(full_name, phone)), jobs!inner(title, specialization, institutions!inner(institution_name, district, city))')
      .eq('status', 'התקבלה')
      .order('updated_at', { ascending: false })

    const rows = (data ?? []) as unknown as {
      applied_at: string; updated_at: string
      candidates: { city: string | null; district: string | null; specialization: string | null; academic_level: string | null; profiles: { full_name: string | null; phone: string | null } | null }
      jobs: { title: string; specialization: string | null; institutions: { institution_name: string; district: string | null; city: string | null } }
    }[]

    const headers = ['שם מועמדת', 'טלפון', 'עיר מועמדת', 'מחוז מועמדת', 'התמחות', 'רמה', 'משרה', 'מוסד', 'עיר מוסד', 'מחוז מוסד', 'ימים לשיבוץ', 'תאריך שיבוץ']
    const csvRows = rows.map(r => {
      const days = Math.round((new Date(r.updated_at).getTime() - new Date(r.applied_at).getTime()) / 86_400_000)
      return [
        r.candidates?.profiles?.full_name ?? '',
        r.candidates?.profiles?.phone ?? '',
        r.candidates?.city ?? '',
        r.candidates?.district ?? '',
        r.candidates?.specialization ?? '',
        r.candidates?.academic_level ?? '',
        r.jobs?.title ?? '',
        r.jobs?.institutions?.institution_name ?? '',
        r.jobs?.institutions?.city ?? '',
        r.jobs?.institutions?.district ?? '',
        days,
        new Date(r.updated_at).toLocaleDateString('he-IL'),
      ]
    })

    const csv = buildCsv(headers, csvRows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="placements-${today()}.csv"`,
      },
    })
  }

  if (type === 'candidates') {
    const { data } = await service
      .from('candidates')
      .select('district, city, specialization, academic_level, availability_status, technical_skills, interpersonal_skills, profiles(full_name, phone)')
      .order('created_at', { ascending: false })

    const headers = ['שם', 'טלפון', 'עיר', 'מחוז', 'התמחות', 'רמה', 'סטטוס', 'כישורים טכניים', 'כישורים בינאישיים']
    type ProfRow = { full_name?: string | null; phone?: string | null }
    type CandRow = { district?: string | null; city?: string | null; specialization?: string | null; academic_level?: string | null; availability_status?: string | null; technical_skills?: string | null; interpersonal_skills?: string | null; profiles?: unknown }
    const csvRows = (data ?? []).map((c: CandRow) => {
      const prof = (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) as ProfRow | null
      return [
      prof?.full_name ?? '',
      prof?.phone ?? '',
      c.city ?? '',
      c.district ?? '',
      c.specialization ?? '',
      c.academic_level ?? '',
      c.availability_status ?? '',
      c.technical_skills ?? '',
      c.interpersonal_skills ?? '',
      ]
    })

    const csv = buildCsv(headers, csvRows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="candidates-${today()}.csv"`,
      },
    })
  }

  if (type === 'institutions') {
    const { data } = await service
      .from('institutions')
      .select('institution_name, city, district, address, phone, school_type, principal_name, is_approved, created_at, profiles(full_name, phone)')
      .order('created_at', { ascending: false })

    const headers = ['שם מוסד', 'סוג', 'עיר', 'מחוז', 'כתובת', 'טלפון מוסד', 'שם מנהלת', 'טלפון איש קשר', 'מאושר', 'תאריך הצטרפות']
    type InstRow = { institution_name: string; city?: string|null; district?: string|null; address?: string|null; phone?: string|null; school_type?: string|null; principal_name?: string|null; is_approved: boolean; created_at: string; profiles?: { full_name?: string|null; phone?: string|null } | null }
    const csvRows = ((data ?? []) as InstRow[]).map(i => [
      i.institution_name,
      i.school_type ?? '',
      i.city ?? '',
      i.district ?? '',
      i.address ?? '',
      i.phone ?? '',
      i.principal_name ?? i.profiles?.full_name ?? '',
      i.profiles?.phone ?? '',
      i.is_approved ? 'כן' : 'לא',
      new Date(i.created_at).toLocaleDateString('he-IL'),
    ])

    const csv = buildCsv(headers, csvRows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="institutions-${today()}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const bom = '﻿'
  const lines = [headers, ...rows].map(row => row.map(escape).join(','))
  return bom + lines.join('\r\n')
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
