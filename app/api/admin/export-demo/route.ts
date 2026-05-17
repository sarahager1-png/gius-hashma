import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    { data: institutions },
    { data: candidates },
    { data: jobs },
    { data: applications },
    { data: interviews },
    { data: invitations },
  ] = await Promise.all([
    service.from('institutions')
      .select('institution_name, city, institution_type, district, principal_name, is_approved, created_at')
      .order('created_at', { ascending: true }),
    service.from('candidates')
      .select('profiles(full_name, phone), city, college, specialization, academic_level, availability_status, years_experience, created_at')
      .order('created_at', { ascending: true }),
    service.from('jobs')
      .select('title, city, specialization, job_type, status, start_date, institutions(institution_name), created_at')
      .order('created_at', { ascending: true }),
    service.from('applications')
      .select('status, applied_at, cover_letter, candidates(profiles(full_name)), jobs(title, institutions(institution_name))')
      .order('applied_at', { ascending: true }),
    service.from('interviews')
      .select('scheduled_at, location, notes, candidate_confirmed, applications(candidates(profiles(full_name)), jobs(title))')
      .order('scheduled_at', { ascending: true }),
    service.from('invitations')
      .select('status, message, scheduled_at, created_at, candidates(profiles(full_name)), jobs(title), institutions(institution_name)')
      .order('created_at', { ascending: true }),
  ])

  const instRows = (institutions ?? []).map(r => ({
    'שם מוסד': r.institution_name,
    'עיר': r.city,
    'סוג': r.institution_type,
    'מחוז': r.district,
    'מנהל/ת': r.principal_name,
    'מאושר': r.is_approved ? 'כן' : 'לא',
    'תאריך הצטרפות': r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : '',
  }))

  type CandRow = typeof candidates extends (infer T)[] | null ? T : never
  const candRows = (candidates ?? []).map((r: CandRow) => {
    const p = r.profiles as { full_name?: string; phone?: string } | null
    return {
      'שם': p?.full_name ?? '',
      'טלפון': p?.phone ?? '',
      'עיר': r.city,
      'מוסד לימודים': r.college,
      'התמחות': r.specialization,
      'רמה אקדמית': r.academic_level,
      'סטטוס': r.availability_status,
      'שנות ניסיון': r.years_experience ?? '',
      'תאריך הצטרפות': r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : '',
    }
  })

  type JobRow = typeof jobs extends (infer T)[] | null ? T : never
  const jobRows = (jobs ?? []).map((r: JobRow) => {
    const inst = r.institutions as { institution_name?: string } | null
    return {
      'כותרת משרה': r.title,
      'מוסד': inst?.institution_name ?? '',
      'עיר': r.city,
      'התמחות': r.specialization,
      'סוג משרה': r.job_type,
      'סטטוס': r.status,
      'תאריך התחלה': r.start_date ?? '',
      'תאריך פרסום': r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : '',
    }
  })

  type AppRow = typeof applications extends (infer T)[] | null ? T : never
  const appRows = (applications ?? []).map((r: AppRow) => {
    const cand = r.candidates as { profiles?: { full_name?: string } } | null
    const job  = r.jobs as { title?: string; institutions?: { institution_name?: string } } | null
    return {
      'מועמדת': cand?.profiles?.full_name ?? '',
      'משרה': job?.title ?? '',
      'מוסד': job?.institutions?.institution_name ?? '',
      'סטטוס': r.status,
      'תאריך הגשה': r.applied_at ? new Date(r.applied_at).toLocaleDateString('he-IL') : '',
      'מכתב מוטיבציה': r.cover_letter ?? '',
    }
  })

  type IntRow = typeof interviews extends (infer T)[] | null ? T : never
  const intRows = (interviews ?? []).map((r: IntRow) => {
    const app  = r.applications as { candidates?: { profiles?: { full_name?: string } }; jobs?: { title?: string } } | null
    return {
      'מועמדת': app?.candidates?.profiles?.full_name ?? '',
      'משרה': app?.jobs?.title ?? '',
      'תאריך ראיון': r.scheduled_at ? new Date(r.scheduled_at).toLocaleString('he-IL') : '',
      'מיקום': r.location ?? '',
      'הערות': r.notes ?? '',
      'אישור מועמדת': r.candidate_confirmed == null ? 'ממתין' : r.candidate_confirmed ? 'אישר' : 'דחה',
    }
  })

  type InvRow = typeof invitations extends (infer T)[] | null ? T : never
  const invRows = (invitations ?? []).map((r: InvRow) => {
    const cand = r.candidates as { profiles?: { full_name?: string } } | null
    const inst = r.institutions as { institution_name?: string } | null
    const job  = r.jobs as { title?: string } | null
    return {
      'מועמדת': cand?.profiles?.full_name ?? '',
      'מוסד': inst?.institution_name ?? '',
      'משרה': job?.title ?? '',
      'סטטוס': r.status,
      'הודעה': r.message ?? '',
      'תאריך': r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : '',
    }
  })

  const bom = '﻿'
  const sections = [
    `מוסדות (${instRows.length})`,
    toCSV(instRows, ['שם מוסד','עיר','סוג','מחוז','מנהל/ת','מאושר','תאריך הצטרפות']),
    '',
    `מועמדות (${candRows.length})`,
    toCSV(candRows, ['שם','טלפון','עיר','מוסד לימודים','התמחות','רמה אקדמית','סטטוס','שנות ניסיון','תאריך הצטרפות']),
    '',
    `משרות (${jobRows.length})`,
    toCSV(jobRows, ['כותרת משרה','מוסד','עיר','התמחות','סוג משרה','סטטוס','תאריך התחלה','תאריך פרסום']),
    '',
    `הגשות (${appRows.length})`,
    toCSV(appRows, ['מועמדת','משרה','מוסד','סטטוס','תאריך הגשה','מכתב מוטיבציה']),
    '',
    `ראיונות (${intRows.length})`,
    toCSV(intRows, ['מועמדת','משרה','תאריך ראיון','מיקום','הערות','אישור מועמדת']),
    '',
    `הזמנות (${invRows.length})`,
    toCSV(invRows, ['מועמדת','מוסד','משרה','סטטוס','הודעה','תאריך']),
  ]

  const csv = bom + sections.join('\n')
  const date = new Date().toLocaleDateString('he-IL').replace(/\./g, '-')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="demo-data-${date}.csv"`,
    },
  })
}
