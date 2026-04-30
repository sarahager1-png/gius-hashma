'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPECIALIZATIONS, JOB_TYPES, DISTRICTS, PLACEMENT_TYPES } from '@/lib/constants'

interface Props {
  institutionId: string
  job?: {
    id: string
    title: string
    description: string | null
    district: string | null
    city: string | null
    specialization: string | null
    job_type: string | null
    job_types?: string[] | null
    placement_type: string | null
    expires_at: string | null
    start_date: string | null
    end_date: string | null
  }
}

const FIELD = 'w-full h-11 rounded-[10px] border text-[14px] font-medium outline-none transition-all px-3.5'
const FS = { background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)' }
const FF = { borderColor: 'var(--purple)', boxShadow: '0 0 0 3px var(--purple-050)' }
const FB = { borderColor: 'var(--line)', boxShadow: 'none' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-bold" style={{ color: 'var(--ink-2)' }}>{label}</label>
      {children}
    </div>
  )
}

const JOB_TYPE_OPTIONS = ["סטאג'", 'חלקי', 'מלא']

function NativeSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void
  placeholder: string; options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={FIELD}
      style={{ ...FS }}
      onFocus={e => Object.assign(e.currentTarget.style, FF)}
      onBlur={e => Object.assign(e.currentTarget.style, FB)}
    >
      <option value="">— {placeholder} —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function JobFormClient({ institutionId, job }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title:          job?.title ?? '',
    description:    job?.description ?? '',
    district:       job?.district ?? '',
    city:           job?.city ?? '',
    specialization: job?.specialization ?? '',
    job_type:       job?.job_type ?? '',
    job_types:      (job?.job_types ?? (job?.job_type ? [job.job_type] : [])) as string[],
    placement_type: job?.placement_type ?? '',
    expires_at:     job?.expires_at  ? job.expires_at.substring(0, 10)  : '',
    start_date:     job?.start_date  ? job.start_date.substring(0, 10)  : '',
    end_date:       job?.end_date    ? job.end_date.substring(0, 10)    : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function toggleJobType(jt: string) {
    setForm(f => {
      const current = f.job_types
      const next = current.includes(jt) ? current.filter(x => x !== jt) : [...current, jt]
      return { ...f, job_types: next, job_type: next[0] ?? '' }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      institution_id:  institutionId,
      title:           form.title,
      description:     form.description || null,
      district:        form.district || null,
      city:            form.city || null,
      specialization:  form.specialization || null,
      job_type:        form.job_type || null,
      job_types:       form.job_types.length > 0 ? form.job_types : null,
      placement_type:  form.placement_type || null,
      expires_at:      form.expires_at ? new Date(form.expires_at).toISOString() : null,
      start_date:      form.start_date || null,
      end_date:        form.end_date || null,
    }

    const res = job
      ? await fetch(`/api/jobs/${job.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/jobs',            { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה בשמירה')
      return
    }
    router.push('/institution/jobs')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>פרטי המשרה</p>

        <Field label="כותרת המשרה *">
          <input value={form.title} onChange={e => set('title', e.target.value)} required
            placeholder="לדוגמה: מורה לגן ילדים"
            className={FIELD} style={FS}
            onFocus={e => Object.assign(e.currentTarget.style, FF)}
            onBlur={e => Object.assign(e.currentTarget.style, FB)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="סוג משרה (ניתן לבחור מספר)">
            <div className="flex flex-wrap gap-2 pt-1">
              {JOB_TYPE_OPTIONS.map(jt => {
                const selected = form.job_types.includes(jt)
                return (
                  <button
                    key={jt}
                    type="button"
                    onClick={() => toggleJobType(jt)}
                    className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-all"
                    style={{
                      background: selected ? 'var(--purple-050)' : '#fff',
                      borderColor: selected ? 'var(--purple)' : 'var(--line)',
                      color: selected ? 'var(--purple)' : 'var(--ink-3)',
                    }}
                  >
                    {selected ? '✓ ' : ''}{jt}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="אופי המשרה">
            <NativeSelect value={form.placement_type} onChange={v => set('placement_type', v)}
              placeholder="בחרי" options={PLACEMENT_TYPES} />
          </Field>
        </div>

        <Field label="התמחות">
          <NativeSelect value={form.specialization} onChange={v => set('specialization', v)}
            placeholder="בחרי" options={SPECIALIZATIONS} />
        </Field>
      </div>

      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>מיקום</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="מחוז">
            <NativeSelect value={form.district} onChange={v => set('district', v)}
              placeholder="בחרי" options={DISTRICTS} />
          </Field>
          <Field label="עיר">
            <input value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="ירושלים"
              className={FIELD} style={FS}
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
        </div>
      </div>

      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>תאריכים</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="תחילת המשרה">
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className={FIELD} style={FS} dir="ltr"
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
          <Field label="סיום המשרה">
            <input type="date" value={form.end_date}
              min={form.start_date || undefined}
              onChange={e => set('end_date', e.target.value)}
              className={FIELD} style={FS} dir="ltr"
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
        </div>
        <Field label="תוקף פרסום המשרה עד">
          <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
            className={`${FIELD} max-w-[200px]`} style={FS} dir="ltr"
            onFocus={e => Object.assign(e.currentTarget.style, FF)}
            onBlur={e => Object.assign(e.currentTarget.style, FB)} />
        </Field>
      </div>

      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>תיאור</p>
        <Field label="תיאור המשרה">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={4} placeholder="פרטים נוספים על המשרה, דרישות, תנאים..."
            className="w-full rounded-[10px] border text-[14px] font-medium outline-none transition-all px-3.5 py-2.5 resize-none"
            style={FS}
            onFocus={e => Object.assign(e.currentTarget.style, FF)}
            onBlur={e => Object.assign(e.currentTarget.style, FB)} />
        </Field>
      </div>

      {error && (
        <p className="text-[13px] font-semibold text-center py-2.5 px-3 rounded-[10px]"
          style={{ color: '#DC4F4F', background: '#FEE5E5' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-6 rounded-[11px] text-[14.5px] font-extrabold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)',
            boxShadow: '0 4px 14px rgba(91,58,171,.3)',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
        >
          {saving ? 'שומר...' : job ? 'עדכן משרה' : 'פרסמי משרה'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="h-11 px-5 rounded-[11px] text-[14px] font-semibold border transition-all"
          style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.color = 'var(--purple)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-3)' }}>
          ביטול
        </button>
      </div>
    </form>
  )
}
