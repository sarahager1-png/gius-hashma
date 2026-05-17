'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Users, Building2, Briefcase, CheckCircle2, Clock, X } from 'lucide-react'

type CandResult    = { id: string | null; name: string | null; phone: string | null; href: string | null }
type InstResult    = { id: string; institution_name: string; city: string | null; district: string | null; is_approved: boolean; href: string }
type JobResult     = { id: string; title: string; city: string | null; status: string; institution_name: string | null; href: string }
type SearchResults = { candidates: CandResult[]; institutions: InstResult[]; jobs: JobResult[] }

export default function AdminSearchClient() {
  const [q, setQ]           = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (q.trim().length < 2) {
      timerRef.current = setTimeout(() => setResults(null), 0)
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
      setLoading(false)
    }, 320)
  }, [q])

  const total = results
    ? results.candidates.length + results.institutions.length + results.jobs.length
    : 0

  return (
    <div className="p-4 md:p-8 max-w-3xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold mb-1" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
          חיפוש גלובלי
        </h1>
        <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>חפשי מועמדות, מוסדות ומשרות</p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 end-4 pointer-events-none" style={{ color: 'var(--purple)' }} />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="שם, טלפון, עיר, שם מוסד, כותרת משרה..."
          className="w-full h-12 rounded-[14px] border-2 text-[15px] outline-none transition-all"
          style={{
            background: '#fff',
            borderColor: q ? 'var(--purple)' : 'var(--line)',
            color: 'var(--ink)',
            paddingInlineEnd: '48px',
            paddingInlineStart: '16px',
          }}
        />
        {q && (
          <button onClick={() => { setQ(''); setResults(null) }}
            className="absolute top-1/2 -translate-y-1/2 start-3"
            style={{ color: 'var(--ink-4)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {loading && (
        <p className="text-[13px] text-center py-8" style={{ color: 'var(--ink-4)' }}>מחפשת...</p>
      )}

      {!loading && results && total === 0 && (
        <p className="text-[14px] text-center py-10" style={{ color: 'var(--ink-3)' }}>
          לא נמצאו תוצאות עבור &ldquo;{q}&rdquo;
        </p>
      )}

      {!loading && results && total > 0 && (
        <div className="space-y-6">

          {/* Candidates */}
          {results.candidates.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} style={{ color: 'var(--purple)' }} />
                <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--purple)' }}>
                  מועמדות ({results.candidates.length})
                </h2>
              </div>
              <div className="space-y-1.5">
                {results.candidates.map((c, i) => (
                  <div key={i} className="rounded-[12px] border px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: '#fff', borderColor: 'var(--line)' }}>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{c.name ?? '—'}</p>
                      {c.phone && <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>{c.phone}</p>}
                    </div>
                    {c.href && (
                      <Link href={c.href}
                        className="text-[12px] font-bold no-underline px-3 py-1 rounded-[8px]"
                        style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                        צפי בפרופיל
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Institutions */}
          {results.institutions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={15} style={{ color: 'var(--teal)' }} />
                <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--teal)' }}>
                  מוסדות ({results.institutions.length})
                </h2>
              </div>
              <div className="space-y-1.5">
                {results.institutions.map(inst => (
                  <div key={inst.id} className="rounded-[12px] border px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: '#fff', borderColor: 'var(--line)' }}>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{inst.institution_name}</p>
                      <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                        {[inst.city, inst.district].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={inst.is_approved
                          ? { background: '#E4F6ED', color: '#1A7A4A' }
                          : { background: '#FDF3E3', color: '#B45309' }}>
                        {inst.is_approved ? <><CheckCircle2 size={10} />מאושר</> : <><Clock size={10} />ממתין</>}
                      </span>
                      <Link href={inst.href}
                        className="text-[12px] font-bold no-underline px-3 py-1 rounded-[8px]"
                        style={{ background: '#F0FDFB', color: 'var(--teal)' }}>
                        ניהול
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Jobs */}
          {results.jobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={15} style={{ color: 'var(--ink-3)' }} />
                <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
                  משרות ({results.jobs.length})
                </h2>
              </div>
              <div className="space-y-1.5">
                {results.jobs.map(job => (
                  <div key={job.id} className="rounded-[12px] border px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: '#fff', borderColor: 'var(--line)' }}>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{job.title}</p>
                      <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                        {[job.institution_name, job.city].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={job.status === 'פעילה'
                          ? { background: '#E4F6ED', color: '#1A7A4A' }
                          : { background: '#F4F4F5', color: '#71717A' }}>
                        {job.status}
                      </span>
                      <Link href={job.href}
                        className="text-[12px] font-bold no-underline px-3 py-1 rounded-[8px]"
                        style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
                        צפי
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!q && (
        <div className="text-center py-16">
          <Search size={40} style={{ color: 'var(--line)', margin: '0 auto 12px' }} />
          <p className="text-[14px]" style={{ color: 'var(--ink-4)' }}>הקלידי לפחות 2 תווים לחיפוש</p>
        </div>
      )}
    </div>
  )
}
