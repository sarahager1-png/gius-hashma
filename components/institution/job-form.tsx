'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPECIALIZATIONS, DISTRICTS, SCHOOL_TYPE_COLORS } from '@/lib/constants'

interface JobTemplate {
  id: string; title: string; description: string | null
  specialization: string | null; job_type: string | null; placement_type: string | null
}

interface SchoolInfo {
  institution_name: string
  city: string | null
  district: string | null
  principal_name: string | null
  school_type: string | null
}

interface Props {
  institutionId: string
  school: SchoolInfo
  job?: {
    id: string; title: string; description: string | null
    district: string | null; city: string | null
    specialization: string | null; job_type: string | null; job_types?: string[] | null
    placement_type: string | null; expires_at: string | null
    start_date: string | null; end_date: string | null
    role: string | null; classes: string | null; hours: string | null
  }
  templates?: JobTemplate[]
}

const PLACEMENT_TYPES = ['שיבוץ לשנה', 'מילוי מקום - חופשת לידה', 'אחר']

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

function NativeSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={FIELD} style={{ ...FS }}
      onFocus={e => Object.assign(e.currentTarget.style, FF)}
      onBlur={e => Object.assign(e.currentTarget.style, FB)}>
      <option value="">— {placeholder} —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Chips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map(o => {
        const sel = value === o
        return (
          <button key={o} type="button" onClick={() => onChange(sel ? '' : o)}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-all"
            style={{ background: sel ? 'var(--purple-050)' : '#fff', borderColor: sel ? 'var(--purple)' : 'var(--line)', color: sel ? 'var(--purple)' : 'var(--ink-3)' }}>
            {sel ? '✓ ' : ''}{o}
          </button>
        )
      })}
    </div>
  )
}

export default function JobFormClient({ institutionId, school, job, templates = [] }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title:          job?.title ?? '',
    role:           job?.role ?? '',
    classes:        job?.classes ?? '',
    hours:          job?.hours ?? '',
    description:    job?.description ?? '',
    specialization: job?.specialization ?? '',
    placement_type: job?.placement_type ?? '',
    start_date:     job?.start_date  ? job.start_date.substring(0, 10)  : '',
    end_date:       job?.end_date    ? job.end_date.substring(0, 10)    : '',
    expires_at:     job?.expires_at  ? job.expires_at.substring(0, 10)  : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateMsg, setTemplateMsg] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function loadTemplate(t: JobTemplate) {
    setForm(f => ({ ...f, title: t.title, description: t.description ?? '', specialization: t.specialization ?? '', placement_type: t.placement_type ?? '' }))
  }

  async function saveAsTemplate() {
    setTemplateSaving(true)
    const res = await fetch('/api/job-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title || 'תבנית חדשה', description: form.description || null, specialization: form.specialization || null, placement_type: form.placement_type || null }),
    })
    setTemplateSaving(false)
    setTemplateMsg(res.ok ? 'התבנית נשמרה!' : 'שגיאה')
    setTimeout(() => setTemplateMsg(''), 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const body = {
      institution_id: institutionId,
      title: form.role || form.title,
      role: form.role || null,
      classes: form.classes || null,
      hours: form.hours || null,
      description: form.description || null,
      district: school.district || null,
      city: school.city || null,
      specialization: form.specialization || null,
      job_type: form.placement_type || null,
      job_types: form.placement_type ? [form.placement_type] : null,
      placement_type: form.placement_type || null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    const res = job?.id
      ? await fetch(`/api/jobs/${job.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'שגיאה בשמירה'); return }
    router.push('/institution/jobs')
    router.refresh()
  }

  const schoolColors = school.school_type ? (SCHOOL_TYPE_COLORS[school.school_type] ?? { bg: '#F8F9FA', color: '#374151', border: '#E5E7EB' }) : { bg: '#F8F9FA', color: '#374151', border: '#E5E7EB' }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">

      {/* School banner */}
      <div className="rounded-[14px] px-5 py-4 flex items-center gap-4"
        style={{ background: schoolColors.bg, border: `1px solid ${schoolColors.border}` }}>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-extrabold truncate" style={{ color: schoolColors.color }}>{school.institution_name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {school.school_type && <span className="text-[12px] font-bold" style={{ color: schoolColors.color }}>{school.school_type}</span>}
            {school.city && <span className="text-[12px]" style={{ color: schoolColors.color, opacity: .7 }}>{school.city}</span>}
            {school.district && <span className="text-[12px]" style={{ color: schoolColors.color, opacity: .7 }}>{school.district}</span>}
            {school.principal_name && <span className="text-[12px]" style={{ color: schoolColors.color, opacity: .7 }}>מנהלת: {school.principal_name}</span>}
          </div>
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="rounded-[14px] border p-4" style={{ background: 'var(--purple-050)', borderColor: 'var(--purple-100)' }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--purple)' }}>טען מתבנית:</p>
          <div className="flex flex-wrap gap-2">
            {templates.map(t => (
              <button key={t.id} type="button" onClick={() => loadTemplate(t)}
                className="px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all"
                style={{ background: '#fff', borderColor: 'var(--purple-200)', color: 'var(--purple)' }}>
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Job details */}
      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>אופי המשרה</p>

        <Field label="תפקיד *">
          <input value={form.role} onChange={e => set('role', e.target.value)} required
            placeholder="לדוגמה: מורה לאנגלית, מחנכת כיתה"
            className={FIELD} style={FS}
            onFocus={e => Object.assign(e.currentTarget.style, FF)}
            onBlur={e => Object.assign(e.currentTarget.style, FB)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="כיתות">
            <input value={form.classes} onChange={e => set('classes', e.target.value)}
              placeholder="לדוגמה: א-ג, ז-ח"
              className={FIELD} style={FS}
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
          <Field label="מספר שעות">
            <input value={form.hours} onChange={e => set('hours', e.target.value)}
              placeholder="לדוגמה: 24"
              className={FIELD} style={FS}
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
        </div>

        <Field label="התמחות">
          <NativeSelect value={form.specialization} onChange={v => set('specialization', v)} placeholder="בחרי" options={SPECIALIZATIONS} />
        </Field>
      </div>

      {/* Job type */}
      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>סוג משרה</p>
        <Field label="סוג שיבוץ">
          <Chips value={form.placement_type} onChange={v => set('placement_type', v)} options={PLACEMENT_TYPES} />
        </Field>
        {form.placement_type === 'מילוי מקום - חופשת לידה' && (
          <Field label="מתאריך">
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className={`${FIELD} max-w-[200px]`} style={FS} dir="ltr"
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
        )}
      </div>

      {/* Dates */}
      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>תאריכים</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.placement_type !== 'מילוי מקום - חופשת לידה' && (
            <Field label="תחילת המשרה">
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className={FIELD} style={FS} dir="ltr"
                onFocus={e => Object.assign(e.currentTarget.style, FF)}
                onBlur={e => Object.assign(e.currentTarget.style, FB)} />
            </Field>
          )}
          <Field label="סיום המשרה">
            <input type="date" value={form.end_date} min={form.start_date || undefined}
              onChange={e => set('end_date', e.target.value)}
              className={FIELD} style={FS} dir="ltr"
              onFocus={e => Object.assign(e.currentTarget.style, FF)}
              onBlur={e => Object.assign(e.currentTarget.style, FB)} />
          </Field>
        </div>
        <Field label="תוקף פרסום עד">
          <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
            className={`${FIELD} max-w-[200px]`} style={FS} dir="ltr"
            onFocus={e => Object.assign(e.currentTarget.style, FF)}
            onBlur={e => Object.assign(e.currentTarget.style, FB)} />
        </Field>
      </div>

      {/* Description */}
      <div className="rounded-[16px] border p-5 space-y-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>תיאור</p>
        <Field label="פרטים נוספים">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={4} placeholder="דרישות, תנאים, מידע נוסף..."
            className="w-full rounded-[10px] border text-[14px] font-medium outline-none transition-all px-3.5 py-2.5 resize-none"
            style={FS}
            onFocus={e => Object.assign(e.currentTarget.style, FF)}
            onBlur={e => Object.assign(e.currentTarget.style, FB)} />
        </Field>
      </div>

      {error && (
        <p className="text-[13px] font-semibold text-center py-2.5 px-3 rounded-[10px]"
          style={{ color: '#DC4F4F', background: '#FEE5E5' }}>{error}</p>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <button type="submit" disabled={saving}
          className="h-11 px-6 rounded-[11px] text-[14.5px] font-extrabold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)', boxShadow: '0 4px 14px rgba(91,58,171,.3)', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'שומר...' : job ? 'עדכן משרה' : 'פרסמי משרה'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="h-11 px-5 rounded-[11px] text-[14px] font-semibold border transition-all"
          style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
          ביטול
        </button>
        <button type="button" onClick={saveAsTemplate} disabled={templateSaving}
          className="h-11 px-4 rounded-[11px] text-[13px] font-semibold border transition-all"
          style={{ borderColor: 'var(--teal)', color: 'var(--teal-600)', background: 'var(--teal-050)' }}>
          {templateSaving ? 'שומר...' : 'שמור כתבנית'}
        </button>
        {templateMsg && <span className="text-[12.5px] font-semibold" style={{ color: 'var(--green)' }}>{templateMsg}</span>}
      </div>
    </form>
  )
}
