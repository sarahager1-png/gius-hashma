import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'


export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 401 })

    const service = createServiceClient()
    const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
      return NextResponse.json([])

    const { data: pending } = await service
      .from('applications')
      .select('id, applied_at, jobs!inner(institution_id, institutions!inner(id, institution_name, city, profiles(full_name)))')
      .eq('status', 'ממתינה')
      .order('applied_at', { ascending: true })

    if (!pending || pending.length === 0) return NextResponse.json([])

    const byInst: Record<string, { id: string; name: string; principal: string; city: string; pendingCount: number; oldestApplied: string }> = {}

    for (const app of pending) {
      const job  = app.jobs as unknown as { institution_id: string; institutions: { id: string; institution_name: string; city: string | null; profiles: { full_name: string | null } | null } }
      const inst = job.institutions
      if (!inst) continue
      const instId = inst.id
      if (!byInst[instId]) byInst[instId] = { id: instId, name: inst.institution_name, principal: inst.profiles?.full_name ?? '—', city: inst.city ?? '—', pendingCount: 0, oldestApplied: app.applied_at }
      byInst[instId].pendingCount++
      if (new Date(app.applied_at) < new Date(byInst[instId].oldestApplied)) byInst[instId].oldestApplied = app.applied_at
    }

    const COLORS = ['teal', 'soft', 'amber', 'red']
    const result = Object.values(byInst)
      .sort((a, b) => new Date(a.oldestApplied).getTime() - new Date(b.oldestApplied).getTime())
      .map((inst, idx) => {
        const daysWaiting = Math.floor((Date.now() - new Date(inst.oldestApplied).getTime()) / 86_400_000)
        const initials = inst.name.split(' ').slice(0, 2).map(w => w[0]).join('')
        const status = daysWaiting >= 14 ? 'קריטי' : daysWaiting >= 7 ? 'דחוף' : 'בתהליך'
        const color  = daysWaiting >= 14 ? 'red' : daysWaiting >= 7 ? 'amber' : COLORS[idx % COLORS.length]
        return { id: inst.id, name: inst.name, principal: inst.principal, city: inst.city, initials, color, pendingCandidates: inst.pendingCount, daysWaiting, status }
      })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([])
  }
}
