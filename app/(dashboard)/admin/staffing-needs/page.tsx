import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { GraduationCap, Building2, Briefcase, TrendingUp, Download } from 'lucide-react'

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']

export default async function StaffingNeedsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !ADMIN_ROLES.includes(profile.role)) redirect('/dashboard')

  // כל המשרות הפתוחות (פעילה בלבד) — כולל שם המוסד
  const { data: openJobs } = await service
    .from('jobs')
    .select('id, title, specialization, job_type, city, institution_id, institutions(institution_name, district)')
    .eq('status', 'פעילה')
    .order('title')

  const jobs = (openJobs ?? []) as unknown as {
    id: string
    title: string
    specialization: string | null
    job_type: string | null
    city: string | null
    institution_id: string
    institutions: { institution_name: string; district: string | null } | null
  }[]

  // ── קיבוץ לפי תפקיד ──
  const byTitle: Record<string, {
    count: number
    institutions: Set<string>
    specializations: Set<string>
    districts: Set<string>
  }> = {}

  for (const j of jobs) {
    const title = j.title.trim()
    if (!byTitle[title]) byTitle[title] = { count: 0, institutions: new Set(), specializations: new Set(), districts: new Set() }
    byTitle[title].count++
    if (j.institutions?.institution_name) byTitle[title].institutions.add(j.institutions.institution_name)
    if (j.specialization) byTitle[title].specializations.add(j.specialization)
    if (j.institutions?.district) byTitle[title].districts.add(j.institutions.district)
  }

  const titleRows = Object.entries(byTitle)
    .map(([title, d]) => ({
      title,
      count: d.count,
      institutionCount: d.institutions.size,
      specializations: [...d.specializations].join(', ') || '—',
      districts: [...d.districts],
    }))
    .sort((a, b) => b.count - a.count)

  // ── קיבוץ לפי מחוז ──
  const byDistrict: Record<string, number> = {}
  for (const j of jobs) {
    const d = j.institutions?.district ?? 'לא ידוע'
    byDistrict[d] = (byDistrict[d] ?? 0) + 1
  }
  const districtRows = Object.entries(byDistrict).sort((a, b) => b[1] - a[1])

  // ── קיבוץ לפי מוסד ──
  const byInstitution: Record<string, { name: string; district: string | null; count: number }> = {}
  for (const j of jobs) {
    const id = j.institution_id
    if (!byInstitution[id]) byInstitution[id] = { name: j.institutions?.institution_name ?? '—', district: j.institutions?.district ?? null, count: 0 }
    byInstitution[id].count++
  }
  const institutionRows = Object.values(byInstitution).sort((a, b) => b.count - a.count).slice(0, 12)

  const maxCount = Math.max(...titleRows.map(r => r.count), 1)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="page-title">צרכי הכשרה ברשת</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>
            סיכום {jobs.length} משרות פתוחות לפי תפקיד — לתכנון הכשרת מורות
          </p>
        </div>
        <a
          href="/api/admin/reports/export?type=staffing"
          download
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
          style={{ borderColor: 'var(--line)', color: 'var(--purple)', background: '#fff' }}
        >
          <Download size={14} /> ייצוא
        </a>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-8 mt-6">
        <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="text-[30px] font-extrabold leading-none mb-1" style={{ color: 'var(--purple)' }}>{jobs.length}</div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>משרות פתוחות</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>ממתינות לאיוש</div>
        </div>
        <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="text-[30px] font-extrabold leading-none mb-1" style={{ color: 'var(--teal)' }}>{titleRows.length}</div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>תפקידים שונים</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>מוגדרים ברשת</div>
        </div>
        <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="text-[30px] font-extrabold leading-none mb-1" style={{ color: 'var(--amber)' }}>{institutionRows.length}</div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>מוסדות עם חסרים</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>פרסמו משרה פתוחה</div>
        </div>
      </div>

      {/* Main table — by role */}
      <div className="rounded-[16px] border overflow-hidden mb-6" style={{ background: '#fff', borderColor: 'var(--line)' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--line)' }}>
          <GraduationCap size={16} style={{ color: 'var(--purple)' }} />
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>פערים לפי תפקיד</h2>
          <span className="text-[12px] mr-auto" style={{ color: 'var(--ink-4)' }}>מורות שצריך להכשיר לכל תפקיד</span>
        </div>

        {titleRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[14px]" style={{ color: 'var(--ink-4)' }}>
            אין משרות פתוחות כרגע ✓
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-3)' }}>
                  {['תפקיד', 'מספר חסרות', 'במוסדות', 'רמה', 'פילוח מחוזות', ''].map(h => (
                    <th key={h} className="text-start px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {titleRows.map(row => {
                  const pct = Math.round((row.count / maxCount) * 100)
                  const urgency = row.count >= 5 ? 'var(--red)' : row.count >= 3 ? 'var(--amber)' : 'var(--teal)'
                  return (
                    <tr key={row.title} className="hover:bg-[var(--bg-3)] transition-colors">
                      <td className="px-4 py-3 font-bold" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}>
                        {row.title}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-[18px] font-extrabold" style={{ color: urgency, minWidth: 28 }}>{row.count}</span>
                          <div className="flex-1" style={{ minWidth: 80 }}>
                            <div className="h-2 rounded-full" style={{ background: 'var(--bg-2)' }}>
                              <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: urgency }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {row.institutionCount} מוסדות
                      </td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-3)' }}>
                        {row.specializations}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <div className="flex flex-wrap gap-1">
                          {row.districts.slice(0, 3).map(d => (
                            <span key={d} className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>{d}</span>
                          ))}
                          {row.districts.length > 3 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: 'var(--bg-2)', color: 'var(--ink-4)' }}>+{row.districts.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: row.count >= 5 ? 'var(--red-bg)' : row.count >= 3 ? '#FDF3E3' : 'var(--green-bg)',
                            color: row.count >= 5 ? 'var(--red)' : row.count >= 3 ? '#D97706' : 'var(--green)',
                          }}>
                          {row.count >= 5 ? 'דחוף' : row.count >= 3 ? 'בינוני' : 'נמוך'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom row: by district + by institution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By district */}
        <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--teal)' }} />
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>חסרים לפי מחוז</h3>
          </div>
          {districtRows.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>אין נתונים</p>
          ) : (
            <div className="space-y-3">
              {districtRows.map(([district, count]) => {
                const max = districtRows[0][1]
                return (
                  <div key={district}>
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span style={{ color: 'var(--ink)' }}>{district}</span>
                      <span className="font-bold" style={{ color: 'var(--teal)' }}>{count} משרות</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--bg-2)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${(count / max) * 100}%`, background: 'var(--teal)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* By institution */}
        <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} style={{ color: 'var(--amber)' }} />
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>מוסדות עם הכי הרבה חסרים</h3>
          </div>
          {institutionRows.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>אין נתונים</p>
          ) : (
            <div className="space-y-2.5">
              {institutionRows.map(inst => {
                const max = institutionRows[0].count
                return (
                  <div key={inst.name}>
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span style={{ color: 'var(--ink)' }}>{inst.name}
                        {inst.district && <span className="text-[11px] mr-1" style={{ color: 'var(--ink-4)' }}>({inst.district})</span>}
                      </span>
                      <span className="font-bold" style={{ color: 'var(--amber)' }}>{inst.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-2)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(inst.count / max) * 100}%`, background: 'var(--amber)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-[12px]" style={{ color: 'var(--ink-4)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--red)' }} /> דחוף — 5+ משרות
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--amber)' }} /> בינוני — 3-4 משרות
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--teal)' }} /> נמוך — 1-2 משרות
        </span>
      </div>
    </div>
  )
}
