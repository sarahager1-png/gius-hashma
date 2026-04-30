import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) {
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
    const csvRows = (data ?? []).map((c: any) => [
      c.profiles?.full_name ?? '',
      c.profiles?.phone ?? '',
      c.city ?? '',
      c.district ?? '',
      c.specialization ?? '',
      c.academic_level ?? '',
      c.availability_status ?? '',
      c.technical_skills ?? '',
      c.interpersonal_skills ?? '',
    ])

    const csv = buildCsv(headers, csvRows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="candidates-${today()}.csv"`,
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
