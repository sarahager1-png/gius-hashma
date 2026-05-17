import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const HEBREW_MONTHS: Record<number, string> = {
  1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל',
  5: 'מאי', 6: 'יוני', 7: 'יולי', 8: 'אוגוסט',
  9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
}


function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildMonthSlotsBetween(from: Date, to: Date): { key: string; label: string }[] {
  const slots = []
  const cur = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cur <= end) {
    slots.push({ key: monthKey(new Date(cur)), label: HEBREW_MONTHS[cur.getMonth() + 1] })
    cur.setMonth(cur.getMonth() + 1)
  }
  return slots
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') ?? '6m'
  const sinceParam = searchParams.get('since')
  const untilParam = searchParams.get('until')

  const service = createServiceClient()

  let sinceDate: Date
  let untilDate: Date

  if (sinceParam) {
    sinceDate = new Date(sinceParam)
    untilDate = untilParam ? new Date(untilParam) : new Date()
  } else {
    const monthCount =
      range === '30d' ? 1 :
      range === '90d' ? 3 :
      range === 'year' ? 12 : 6
    untilDate = new Date()
    sinceDate = new Date(untilDate.getFullYear(), untilDate.getMonth() - monthCount + 1, 1)
  }

  const sinceIso = sinceDate.toISOString()
  const untilIso = untilDate.toISOString()

  let cands: { created_at: string }[] | null = null
  let jobs:  { created_at: string }[] | null = null
  let apps:  { updated_at: string }[] | null = null

  try {
    const res = await Promise.all([
      service.from('candidates').select('created_at').gte('created_at', sinceIso).lte('created_at', untilIso),
      service.from('jobs').select('created_at').gte('created_at', sinceIso).lte('created_at', untilIso),
      service.from('applications').select('updated_at').eq('status', 'התקבלה').gte('updated_at', sinceIso).lte('updated_at', untilIso),
    ])
    cands = res[0].data as { created_at: string }[]
    jobs  = res[1].data as { created_at: string }[]
    apps  = res[2].data as { updated_at: string }[]
  } catch {
    return NextResponse.json({ range, data: [], totals: { candidates: 0, jobs: 0, placements: 0 } })
  }

  const isEmpty = (cands?.length ?? 0) === 0 && (jobs?.length ?? 0) === 0
  if (isEmpty) return NextResponse.json({ range, data: [], totals: { candidates: 0, jobs: 0, placements: 0 } })

  const slots = buildMonthSlotsBetween(sinceDate, untilDate)

  const count = (rows: { created_at?: string; updated_at?: string }[] | null, field: 'created_at' | 'updated_at') => {
    const map: Record<string, number> = {}
    for (const r of rows ?? []) {
      const key = monthKey(new Date(r[field]!))
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }

  const candMap = count(cands as { created_at: string }[], 'created_at')
  const jobMap  = count(jobs  as { created_at: string }[], 'created_at')
  const appMap  = count(apps  as { updated_at: string }[], 'updated_at')

  const data = slots.map(s => ({
    month: s.label,
    candidates: candMap[s.key] ?? 0,
    jobs: jobMap[s.key] ?? 0,
    placements: appMap[s.key] ?? 0,
  }))

  const totals = {
    candidates: (cands ?? []).length,
    jobs: (jobs ?? []).length,
    placements: (apps ?? []).length,
  }

  return NextResponse.json({ range, data, totals })
}
