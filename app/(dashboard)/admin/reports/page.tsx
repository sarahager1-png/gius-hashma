import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TrendingUp, Users, Briefcase, Clock, MapPin, GraduationCap, CheckCircle, XCircle, Download, AlertTriangle, Building2, BellOff } from 'lucide-react'

const HEBREW_MONTHS: Record<number, string> = {
  1:'ינואר',2:'פברואר',3:'מרץ',4:'אפריל',5:'מאי',6:'יוני',
  7:'יולי',8:'אוגוסט',9:'ספטמבר',10:'אוקטובר',11:'נובמבר',12:'דצמבר',
}

function computeDates() {
  const now = Date.now()
  const d6m = new Date(now); d6m.setMonth(d6m.getMonth() - 5); d6m.setDate(1)
  return { now6mIso: d6m.toISOString(), cutoff30: new Date(now - 30 * 86400_000).toISOString(), cutoff7: new Date(now - 7 * 86400_000).toISOString(), now }
}

function daysSince(dateStr: string, now: number) {
  return Math.round((now - new Date(dateStr).getTime()) / 86400_000)
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string; until?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { since, until } = await searchParams
  const service = createServiceClient()

  let activityQ = service
    .from('applications')
    .select('id, status, updated_at, candidates!inner(profiles(full_name, phone)), jobs!inner(title, institutions!inner(institution_name))')
    .in('status', ['התקבלה', 'נדחתה'])
    .order('updated_at', { ascending: false })
  if (since) activityQ = activityQ.gte('updated_at', since)
  if (until) activityQ = activityQ.lte('updated_at', until + 'T23:59:59')

  const [
    { data: placements },
    { data: allApps },
    { data: candidates },
    { data: activeJobs },
    {},
    { data: recentActivity },
  ] = await Promise.all([
    // Placements (accepted applications)
    service
      .from('applications')
      .select('id, applied_at, updated_at, candidates!inner(district, specialization, academic_level, city), jobs!inner(title, specialization, institutions!inner(institution_name, district, city))')
      .eq('status', 'התקבלה'),
    // All applications for funnel
    service.from('applications').select('status, applied_at, updated_at'),
    // Candidates by district and status
    service.from('candidates').select('district, availability_status, specialization, academic_level'),
    // Active jobs
    service.from('jobs').select('specialization, city').eq('status', 'פעילה'),
    // Institutions by district
    service.from('institutions').select('district, city, is_approved').eq('is_approved', true),
    // Recent application status changes (accepted + rejected) — filtered by date if provided
    activityQ.limit(50),
  ])

  // ── 4 new queries ──────────────────────────────────────────────────────
  const { now6mIso, cutoff30, cutoff7, now: nowMs } = computeDates()

  const [
    { data: trendCands },
    { data: trendJobs },
    { data: trendPlacements },
    { data: jobsWithCounts },
    { data: allAppsForInst },
    { data: activeCandRows },
    { data: recentAppCandIds },
  ] = await Promise.all([
    service.from('candidates').select('created_at').gte('created_at', now6mIso),
    service.from('jobs').select('created_at').gte('created_at', now6mIso),
    service.from('applications').select('updated_at').eq('status', 'התקבלה').gte('updated_at', now6mIso),
    // jobs with 0 applications, active for 7+ days
    service.from('jobs').select('id, title, created_at, institutions(institution_name), applications(count)').eq('status', 'פעילה').lt('created_at', cutoff7),
    // all applications for institution ranking
    service.from('applications').select('status, jobs!inner(institutions!inner(institution_name))'),
    // active non-placed candidates
    service.from('candidates').select('id, district, specialization, profiles(full_name, phone)').neq('availability_status', 'לא פעילה').neq('availability_status', 'משובצת'),
    // candidates who applied in last 30 days
    service.from('applications').select('candidate_id').gte('applied_at', cutoff30),
  ])

  // ── Trend: group by month ──────────────────────────────────────────────
  function mkKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
  function countByMonth(rows: {created_at?:string;updated_at?:string}[]|null, field:'created_at'|'updated_at') {
    const m: Record<string,number> = {}
    for (const r of rows??[]) { const k=mkKey(new Date(r[field]!)); m[k]=(m[k]??0)+1 }
    return m
  }
  const candMon = countByMonth(trendCands as {created_at:string}[]|null,'created_at')
  const jobMon  = countByMonth(trendJobs  as {created_at:string}[]|null,'created_at')
  const plMon   = countByMonth(trendPlacements as {updated_at:string}[]|null,'updated_at')
  const trendSlots: {label:string;candidates:number;jobs:number;placements:number}[] = []
  for (let i=5; i>=0; i--) {
    const d = new Date(nowMs); d.setDate(1); d.setMonth(d.getMonth()-i)
    const k = mkKey(d)
    trendSlots.push({ label: HEBREW_MONTHS[d.getMonth()+1], candidates: candMon[k]??0, jobs: jobMon[k]??0, placements: plMon[k]??0 })
  }
  const trendMax = Math.max(...trendSlots.flatMap(s=>[s.candidates,s.jobs,s.placements]),1)

  // ── Jobs with zero applications ────────────────────────────────────────
  type JobWithCount = { id:string; title:string; created_at:string; institutions:{institution_name:string}|null; applications:{count:number}[] }
  const zeroAppJobs = ((jobsWithCounts??[]) as unknown as JobWithCount[])
    .filter(j => (j.applications?.[0]?.count ?? 0) === 0)
    .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 10)

  // ── Institution ranking ────────────────────────────────────────────────
  type InstApp = { status:string; jobs:{ institutions:{institution_name:string}|null }|null }
  const instMap: Record<string,{total:number;responded:number;placed:number}> = {}
  for (const a of (allAppsForInst??[]) as unknown as InstApp[]) {
    const name = (a.jobs as unknown as {institutions:{institution_name:string}}|null)?.institutions?.institution_name
    if (!name) continue
    if (!instMap[name]) instMap[name]={total:0,responded:0,placed:0}
    instMap[name].total++
    if (a.status !== 'ממתינה') instMap[name].responded++
    if (a.status === 'התקבלה') instMap[name].placed++
  }
  const instRanking = Object.entries(instMap)
    .map(([name,s]) => ({ name, ...s, responseRate: s.total>0 ? Math.round(s.responded/s.total*100) : 0 }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 10)

  // ── Silent candidates ──────────────────────────────────────────────────
  const recentSet = new Set((recentAppCandIds??[]).map((r:{candidate_id:string})=>r.candidate_id))
  type SilentCand = { id:string; district:string|null; specialization:string|null; profiles:{full_name:string|null;phone:string|null}|null }
  const silentCands = ((activeCandRows??[]) as unknown as SilentCand[])
    .filter(c => !recentSet.has(c.id))
    .slice(0, 15)

  const placementList = (placements ?? []) as unknown as {
    id: string; applied_at: string; updated_at: string
    candidates: { district: string | null; specialization: string | null; academic_level: string | null; city: string | null }
    jobs: { title: string; specialization: string | null; institutions: { institution_name: string; district: string | null; city: string | null } }
  }[]

  type ActivityRow = {
    id: string; status: string; updated_at: string
    candidates: { profiles: { full_name: string | null; phone: string | null } | null } | null
    jobs: { title: string; institutions: { institution_name: string } | null } | null
  }
  const activityList = (recentActivity ?? []) as unknown as ActivityRow[]

  // KPIs
  const totalPlacements  = placementList.length
  const totalApps        = allApps?.length ?? 0
  const placementRate    = totalApps > 0 ? Math.round((totalPlacements / totalApps) * 100) : 0
  const activeCandidates = (candidates ?? []).filter(c => c.availability_status !== 'לא פעילה').length
  const placed           = (candidates ?? []).filter(c => c.availability_status === 'משובצת').length

  // Avg days to placement
  const avgDays = placementList.length > 0
    ? Math.round(placementList.reduce((s, p) =>
        s + (new Date(p.updated_at).getTime() - new Date(p.applied_at).getTime()) / 86_400_000, 0
      ) / placementList.length)
    : 0

  // Placements by district
  const byDistrict = groupCount(placementList.map(p => p.candidates?.district ?? '—'))
  // Placements by specialization
  const bySpec = groupCount(placementList.map(p => p.candidates?.specialization ?? '—'))
  // Candidates by district
  const candByDistrict = groupCount((candidates ?? []).map(c => c.district ?? '—'))
  // Applications funnel
  const funnelMap: Record<string, number> = {}
  for (const a of allApps ?? []) funnelMap[a.status] = (funnelMap[a.status] ?? 0) + 1

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="page-title">דוחות שיבוצים</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range filter — submits as GET params */}
          <form method="GET" className="flex items-center gap-2">
            <input
              type="date"
              name="since"
              defaultValue={since ?? ''}
              className="h-9 px-3 rounded-[8px] border text-[13px] outline-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>עד</span>
            <input
              type="date"
              name="until"
              defaultValue={until ?? ''}
              className="h-9 px-3 rounded-[8px] border text-[13px] outline-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <button
              type="submit"
              className="h-9 px-3.5 rounded-[8px] text-[13px] font-semibold text-white"
              style={{ background: 'var(--purple)' }}
            >
              סנן
            </button>
            {(since || until) && (
              <a
                href="/admin/reports"
                className="h-9 px-3 rounded-[8px] text-[13px] font-semibold border flex items-center no-underline"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}
              >
                נקה
              </a>
            )}
          </form>
          <a
            href="/api/admin/reports/export?type=placements"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--purple)', background: '#fff' }}
          >
            <Download size={14} />ייצוא שיבוצים
          </a>
          <a
            href="/api/admin/reports/export?type=candidates"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}
          >
            <Download size={14} />ייצוא מועמדות
          </a>
        </div>
      </div>

      {(since || until) && (
        <p className="text-[13px] mb-4 font-semibold" style={{ color: 'var(--teal)' }}>
          מסנן פעיל: טבלת הפעילות מציגה תוצאות {since ? `מ-${since}` : ''} {until ? `עד ${until}` : ''}
        </p>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <KpiBox icon={<TrendingUp size={18} />} label="שיבוצים שבוצעו" value={totalPlacements} sub="סה״כ במערכת" color="var(--green)" bg="var(--green-bg)" />
        <KpiBox icon={<Users size={18} />} label="מועמדות פעילות" value={activeCandidates} sub={`${placed} משובצות`} color="var(--purple)" bg="var(--purple-050)" />
        <KpiBox icon={<Briefcase size={18} />} label="משרות פתוחות" value={activeJobs?.length ?? 0} sub="בהמתנה למועמדות" color="var(--teal)" bg="var(--teal-050)" />
        <KpiBox icon={<Clock size={18} />} label="זמן ממוצע לשיבוץ" value={avgDays} sub="ימים מהגשה לקבלה" color="var(--amber)" bg="var(--amber-bg)" />
      </div>

      {/* Rate bar */}
      <div className="rounded-[16px] border p-5 mb-6" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>אחוז הצלחת שיבוצים</span>
          <span className="text-[20px] font-extrabold" style={{ color: 'var(--purple)' }}>{placementRate}%</span>
        </div>
        <div className="h-3 rounded-full" style={{ background: 'var(--bg-2)' }}>
          <div className="h-3 rounded-full transition-all" style={{ width: `${placementRate}%`, background: 'var(--purple)' }} />
        </div>
        <p className="text-[12px] mt-2" style={{ color: 'var(--ink-4)' }}>
          {totalPlacements} שיבוצים מתוך {totalApps} הגשות
        </p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <BarChart title="שיבוצים לפי מחוז" icon={<MapPin size={14} />} rows={byDistrict} color="var(--purple)" />
        <BarChart title="שיבוצים לפי התמחות" icon={<GraduationCap size={14} />} rows={bySpec} color="var(--teal)" />
        <BarChart title="מועמדות לפי מחוז" icon={<Users size={14} />} rows={candByDistrict} color="var(--amber)" />
      </div>

      {/* Funnel */}
      <div className="rounded-[16px] border p-5 mb-6" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="text-[15px] font-bold mb-4" style={{ color: 'var(--ink)' }}>משפך הגשות</h3>
        <div className="flex items-end gap-3 h-32">
          {[
            { label: 'ממתינה', color: 'var(--amber)'    },
            { label: 'נצפתה',  color: 'var(--teal-600)' },
            { label: 'התקבלה', color: 'var(--green)'    },
            { label: 'נדחתה',  color: 'var(--red)'      },
            { label: 'בוטלה',  color: '#6B7280'         },
          ].map(({ label, color }) => {
            const count = funnelMap[label] ?? 0
            const max   = Math.max(...Object.values(funnelMap), 1)
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[12px] font-bold" style={{ color }}>{count}</span>
                <div className="w-full rounded-t-[6px]"
                  style={{ height: `${(count / max) * 96}px`, background: color + '22', border: `1px solid ${color}44` }} />
                <span className="text-[11px] font-medium text-center" style={{ color: 'var(--ink-3)' }}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity tracking — rejections & acceptances */}
      {activityList.length > 0 && (
        <div className="rounded-[16px] border overflow-hidden mb-6" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--line)' }}>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>
              מעקב קבלות ודחיות{since || until ? ` — ${activityList.length} תוצאות` : ' — 50 אחרונות'}
            </h3>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--green)' }}>
                <CheckCircle size={12} />{activityList.filter(a => a.status === 'התקבלה').length} התקבלו
              </span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--red)' }}>
                <XCircle size={12} />{activityList.filter(a => a.status === 'נדחתה').length} נדחו
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-3)' }}>
                  {['מועמדת', 'טלפון', 'משרה', 'מוסד', 'סטטוס', 'תאריך'].map(h => (
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activityList.map(row => {
                  const isAccepted = row.status === 'התקבלה'
                  const phone = row.candidates?.profiles?.phone ?? ''
                  const waBase = phone ? `https://wa.me/972${phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')}` : null
                  return (
                    <tr key={row.id}
                      className="hover:bg-[var(--bg-3)] transition-colors">
                      <td className="px-4 py-3 font-semibold" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {row.candidates?.profiles?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {waBase ? (
                          <a href={`${waBase}?text=${encodeURIComponent('שלום,')}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[12px] font-semibold"
                            style={{ color: '#25D366' }}>
                            📱 {phone}
                          </a>
                        ) : phone || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {row.jobs?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {row.jobs?.institutions?.institution_name ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full"
                          style={isAccepted
                            ? { background: 'var(--green-bg)', color: 'var(--green)' }
                            : { background: 'var(--red-bg)',   color: 'var(--red)'   }}>
                          {isAccepted ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-4)' }}>
                        {new Date(row.updated_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Trend chart ── */}
      <div className="rounded-[16px] border p-5 mb-6" style={{ background:'#fff', borderColor:'var(--line)', boxShadow:'var(--shadow-sm)' }}>
        <h3 className="flex items-center gap-2 text-[15px] font-bold mb-5" style={{ color:'var(--ink)' }}>
          <TrendingUp size={16} style={{ color:'var(--purple)' }} />
          מגמה חודשית — 6 חודשים אחרונים
        </h3>
        <div className="flex items-end gap-2" style={{ height:120 }}>
          {trendSlots.map((s,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end" style={{ height:96 }}>
                {[
                  { v:s.candidates, color:'var(--purple)' },
                  { v:s.jobs,       color:'var(--teal)'   },
                  { v:s.placements, color:'var(--green)'  },
                ].map((bar,bi) => (
                  <div key={bi} className="flex-1 rounded-t-[4px]"
                    style={{ height:`${Math.max(4,(bar.v/trendMax)*92)}px`, background:bar.color+'33', border:`1px solid ${bar.color}55` }}>
                  </div>
                ))}
              </div>
              <span className="text-[10.5px] font-semibold" style={{ color:'var(--ink-4)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          {[['מועמדות','var(--purple)'],['משרות','var(--teal)'],['שיבוצים','var(--green)']].map(([l,c])=>(
            <span key={l} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color:'var(--ink-3)' }}>
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background:c+'55', border:`1px solid ${c}` }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Jobs with zero applications ── */}
      {zeroAppJobs.length > 0 && (
        <div className="rounded-[16px] border overflow-hidden mb-6" style={{ background:'#fff', borderColor:'var(--line)', boxShadow:'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom:'1px solid var(--line)', background:'#FFFBEB' }}>
            <AlertTriangle size={15} style={{ color:'#D97706' }} />
            <h3 className="text-[15px] font-bold" style={{ color:'var(--ink)' }}>
              משרות ללא הגשות — {zeroAppJobs.length} משרות פעילות מעל שבוע ללא פניות
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'var(--bg-3)' }}>
                  {['משרה','מוסד','פורסמה לפני'].map(h=>(
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
                      style={{ color:'var(--ink-3)', borderBottom:'1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zeroAppJobs.map(j=>{
                  const days = daysSince(j.created_at, nowMs)
                  return (
                    <tr key={j.id} className="hover:bg-[var(--bg-3)]">
                      <td className="px-4 py-3 font-semibold" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink)' }}>{j.title}</td>
                      <td className="px-4 py-3" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink-3)' }}>{j.institutions?.institution_name??'—'}</td>
                      <td className="px-4 py-3 font-bold" style={{ borderBottom:'1px solid var(--line-soft)', color:days>14?'var(--red)':'var(--amber)' }}>{days} ימים</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Institution ranking ── */}
      {instRanking.length > 0 && (
        <div className="rounded-[16px] border overflow-hidden mb-6" style={{ background:'#fff', borderColor:'var(--line)', boxShadow:'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom:'1px solid var(--line)' }}>
            <Building2 size={15} style={{ color:'var(--teal)' }} />
            <h3 className="text-[15px] font-bold" style={{ color:'var(--ink)' }}>דירוג מוסדות לפי פעילות</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'var(--bg-3)' }}>
                  {['#','מוסד','הגשות','הגיבו','שיבוצים','שיעור מענה'].map(h=>(
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
                      style={{ color:'var(--ink-3)', borderBottom:'1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instRanking.map((inst,i)=>(
                  <tr key={inst.name} className="hover:bg-[var(--bg-3)]">
                    <td className="px-4 py-3 text-[12px] font-bold" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink-4)' }}>{i+1}</td>
                    <td className="px-4 py-3 font-semibold" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink)' }}>{inst.name}</td>
                    <td className="px-4 py-3 font-bold" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--purple)' }}>{inst.total}</td>
                    <td className="px-4 py-3" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink-3)' }}>{inst.responded}</td>
                    <td className="px-4 py-3 font-bold" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--green)' }}>{inst.placed}</td>
                    <td className="px-4 py-3" style={{ borderBottom:'1px solid var(--line-soft)' }}>
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: inst.responseRate>=70?'var(--green-bg)':inst.responseRate>=40?'#FDF3E3':'var(--red-bg)', color: inst.responseRate>=70?'var(--green)':inst.responseRate>=40?'#D97706':'var(--red)' }}>
                        {inst.responseRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Silent candidates ── */}
      {silentCands.length > 0 && (
        <div className="rounded-[16px] border overflow-hidden mb-6" style={{ background:'#fff', borderColor:'var(--line)', boxShadow:'var(--shadow-sm)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom:'1px solid var(--line)', background:'#F5F3FF' }}>
            <BellOff size={15} style={{ color:'var(--purple)' }} />
            <h3 className="text-[15px] font-bold" style={{ color:'var(--ink)' }}>
              מועמדות שקטות — {silentCands.length} מועמדות פעילות ללא הגשה ב-30 יום
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'var(--bg-3)' }}>
                  {['מועמדת','טלפון','מחוז','התמחות'].map(h=>(
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
                      style={{ color:'var(--ink-3)', borderBottom:'1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {silentCands.map(c=>{
                  const phone = c.profiles?.phone??''
                  const waLink = phone ? `https://wa.me/972${phone.replace(/\D/g,'').replace(/^972/,'').replace(/^0/,'')}?text=${encodeURIComponent('שלום! יש לך משרות מתאימות ממתינות, כדאי להיכנס למערכת 😊')}` : null
                  return (
                    <tr key={c.id} className="hover:bg-[var(--bg-3)]">
                      <td className="px-4 py-3 font-semibold" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink)' }}>{c.profiles?.full_name??'—'}</td>
                      <td className="px-4 py-3" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink-3)' }}>
                        {waLink ? (
                          <a href={waLink} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[12px] font-semibold" style={{ color:'#25D366' }}>
                            📱 {phone}
                          </a>
                        ) : phone||'—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink-3)' }}>{c.district??'—'}</td>
                      <td className="px-4 py-3" style={{ borderBottom:'1px solid var(--line-soft)', color:'var(--ink)' }}>{c.specialization??'—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent placements table */}
      {placementList.length > 0 && (
        <div className="rounded-[16px] border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>שיבוצים שנוצרו במערכת</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-3)' }}>
                  {['משרה', 'מוסד', 'מחוז מוסד', 'מחוז מועמדת', 'התמחות', 'זמן (ימים)'].map(h => (
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {placementList.slice(0, 20).map(p => {
                  const days = Math.round((new Date(p.updated_at).getTime() - new Date(p.applied_at).getTime()) / 86_400_000)
                  return (
                    <tr key={p.id}
                      className="hover:bg-[var(--bg-3)] transition-colors">
                      <td className="px-4 py-3 font-semibold" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {p.jobs?.title}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {p.jobs?.institutions?.institution_name}
                      </td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {p.jobs?.institutions?.district ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {p.candidates?.district ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {p.candidates?.specialization ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ borderBottom: '1px solid var(--line-soft)', color: days <= 7 ? 'var(--green)' : days <= 14 ? 'var(--amber)' : 'var(--red)' }}>
                        {days}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function groupCount(arr: string[]): { label: string; count: number }[] {
  const map: Record<string, number> = {}
  for (const v of arr) map[v] = (map[v] ?? 0) + 1
  return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

function KpiBox({ icon, label, value, sub, color, bg }: { icon: React.ReactNode; label: string; value: number; sub: string; color: string; bg: string }) {
  return (
    <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="text-[28px] font-extrabold leading-none mb-1" style={{ color }}>{value}</div>
      <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{label}</div>
      <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{sub}</div>
    </div>
  )
}

function BarChart({ title, icon, rows, color }: { title: string; icon: React.ReactNode; rows: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...rows.map(r => r.count), 1)
  return (
    <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 className="flex items-center gap-1.5 text-[14px] font-bold mb-4" style={{ color: 'var(--ink)' }}>
        <span style={{ color }}>{icon}</span>{title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>אין נתונים</p>
      ) : (
        <div className="space-y-2.5">
          {rows.slice(0, 6).map(r => (
            <div key={r.label}>
              <div className="flex justify-between text-[12.5px] mb-1">
                <span style={{ color: 'var(--ink)' }}>{r.label}</span>
                <span className="font-bold" style={{ color }}>{r.count}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'var(--bg-2)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${(r.count / max) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
