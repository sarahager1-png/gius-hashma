import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')
  const until = searchParams.get('until')

  const service = createServiceClient()

  let candQ = service.from('candidates').select('*', { count: 'exact', head: true }).neq('availability_status', 'לא פעילה')
  let appsQ = service.from('applications').select('candidate_id', { count: 'exact', head: true })
  let ivQ   = service.from('interviews').select('id', { count: 'exact', head: true })
  let accQ  = service.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'התקבלה')
  let placeQ = service.from('candidates').select('*', { count: 'exact', head: true }).eq('availability_status', 'משובצת')
  let respQ = service.from('applications').select('applied_at, updated_at').in('status', ['נצפתה', 'התקבלה', 'נדחתה']).limit(100)

  if (since) {
    candQ  = candQ.gte('created_at', since)
    appsQ  = appsQ.gte('applied_at', since)
    ivQ    = ivQ.gte('created_at', since)
    accQ   = accQ.gte('updated_at', since)
    placeQ = (service.from('applications').select('*', { count: 'exact', head: true }) as typeof placeQ).eq('status', 'התקבלה').gte('updated_at', since)
    respQ  = respQ.gte('applied_at', since)
  }
  if (until) {
    candQ  = candQ.lte('created_at', until)
    appsQ  = appsQ.lte('applied_at', until)
    ivQ    = ivQ.lte('created_at', until)
    accQ   = accQ.lte('updated_at', until)
    respQ  = respQ.lte('applied_at', until)
  }

  const [
    { count: totalCandidates },
    { count: appliedCandidates },
    { count: interviewedCandidates },
    { count: acceptedApplications },
    { count: placedCandidates },
    { data: respondedApps },
  ] = await Promise.all([candQ, appsQ, ivQ, accQ, placeQ, respQ])

  const total = totalCandidates ?? 0
  const applied = appliedCandidates ?? 0
  const interviewed = interviewedCandidates ?? 0
  const accepted = acceptedApplications ?? 0
  const placed = placedCandidates ?? 0

  const conversionRate = total > 0 ? Math.round((placed / total) * 1000) / 10 : 0

  let avgOfferTime = 0
  if (respondedApps && respondedApps.length > 0) {
    const diffs = respondedApps.map(a =>
      (new Date(a.updated_at).getTime() - new Date(a.applied_at).getTime()) / 86_400_000
    )
    avgOfferTime = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length)
  }

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  return NextResponse.json({
    stages: [
      { label: 'מועמדות ברשת',      count: total,       pct: 100,        color: '#5B3E9E' },
      { label: 'הגישו מועמדות',     count: applied,     pct: pct(applied),      color: '#7458B4' },
      { label: 'הגיעו לראיון',      count: interviewed, pct: pct(interviewed),  color: '#9A80D1' },
      { label: 'הצעה התקבלה',       count: accepted,    pct: pct(accepted),     color: '#2DD4D4' },
      { label: 'שוּבצו',            count: placed,      pct: pct(placed),       color: '#1FB9B9' },
    ],
    conversionRate,
    conversionDelta: { value: 0, dir: 'flat', label: 'מהצטרפות לשיבוץ' },
    avgOfferTime,
    avgOfferTimeDelta: { value: 0, dir: 'flat', label: 'מהגשה לתגובה' },
  })
}
