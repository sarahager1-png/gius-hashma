'use client'

import { useState } from 'react'
import { AVAILABILITY_STATUSES, ACADEMIC_LEVELS, ACADEMIC_LEVELS_WITH_EXPERIENCE, DISTRICTS, SPECIALIZATIONS } from '@/lib/constants'
import type { Profile, Candidate } from '@/lib/types'

const MARITAL_STATUSES = ['רווקה', 'נשואה', 'גרושה', 'אלמנה']
const HANDWRITING_FONTS = ['כתב ויצמן', 'כתב רש"י', 'כתב מודפס', 'אחר']
const STUDY_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

interface Props {
  profile: Profile
  candidate: Candidate | null
}

const inputCls = 'w-full h-10 rounded-[10px] border px-3 text-[14px] outline-none transition-all'
const inputStyle = { borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }
const inputFocus = { borderColor: 'var(--purple)', boxShadow: '0 0 0 3px rgba(75,46,131,.08)' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[12px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
    </div>
  )
}

export default function ProfileFormClient({ profile, candidate }: Props) {
  const [profileForm, setProfileForm] = useState({
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
  })
  const [candForm, setCandForm] = useState({
    maiden_name:         candidate?.maiden_name ?? '',
    birth_year:          candidate?.birth_year?.toString() ?? '',
    marital_status:      candidate?.marital_status ?? '',
    district:            candidate?.district ?? '',
    city:                candidate?.city ?? '',
    address:             candidate?.address ?? '',
    availability_status: candidate?.availability_status ?? "מחפשת סטאג'",
    availability_from:   candidate?.availability_from ?? '',
    availability_to:     candidate?.availability_to ?? '',
    shlichut_location:   candidate?.shlichut_location ?? '',
    shlichut_years:      candidate?.shlichut_years ?? '',
    study_day:           candidate?.study_day ?? '',
    college:             candidate?.college ?? '',
    graduation_year:     candidate?.graduation_year?.toString() ?? '',
    specialization:      candidate?.specialization ?? '',
    academic_level:      candidate?.academic_level ?? '',
    handwriting_font:    candidate?.handwriting_font ?? '',
    years_experience:    candidate?.years_experience?.toString() ?? '',
    seniority_years:     candidate?.seniority_years ?? '',
    prev_employer:       candidate?.prev_employer ?? '',
    prev_role:           candidate?.prev_role ?? '',
    past_projects:       candidate?.past_projects ?? '',
    technical_skills:    candidate?.technical_skills ?? '',
    interpersonal_skills:candidate?.interpersonal_skills ?? '',
    special_skills:      candidate?.special_skills ?? '',
    bio:                 candidate?.bio ?? '',
    personal_note:       candidate?.personal_note ?? '',
    whatsapp_preference: candidate?.whatsapp_preference ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  function setP(k: string, v: string) { setProfileForm(f => ({ ...f, [k]: v })) }
  function setC(k: string, v: string | boolean) { setCandForm(f => ({ ...f, [k]: v })) }

  const showExperience = ACADEMIC_LEVELS_WITH_EXPERIENCE.includes(candForm.academic_level as never)

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: profileForm,
        candidate: {
          ...candForm,
          birth_year:      candForm.birth_year ? parseInt(candForm.birth_year) : null,
          graduation_year: candForm.graduation_year ? parseInt(candForm.graduation_year) : null,
          years_experience:candForm.years_experience ? parseInt(candForm.years_experience) : null,
        },
      }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const sel = (value: string, onChange: (v: string) => void, options: string[], placeholder = 'בחרי') => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={inputCls}
      style={inputStyle}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  const inp = (value: string, onChange: (v: string) => void, extra: object = {}) => (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className={inputCls}
      style={inputStyle}
      onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
      onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
      {...extra}
    />
  )

  return (
    <div className="space-y-8 bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)' }}>

      {/* ── פרטים אישיים ── */}
      <section>
        <SectionTitle title="פרטים אישיים" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם מלא *">
            {inp(profileForm.full_name, v => setP('full_name', v))}
          </Field>
          <Field label="שם נעורים">
            {inp(candForm.maiden_name, v => setC('maiden_name', v))}
          </Field>
          <Field label="טלפון">
            {inp(profileForm.phone, v => setP('phone', v), { dir: 'ltr' })}
          </Field>
          <Field label="שנת לידה">
            {inp(candForm.birth_year, v => setC('birth_year', v), { type: 'number', min: 1960, max: 2010, dir: 'ltr', placeholder: 'למשל: 1998' })}
          </Field>
          <Field label="מצב משפחתי">
            {sel(candForm.marital_status, v => setC('marital_status', v), MARITAL_STATUSES)}
          </Field>
          <Field label="מחוז">
            {sel(candForm.district, v => setC('district', v), DISTRICTS)}
          </Field>
          <Field label="עיר">
            {inp(candForm.city, v => setC('city', v))}
          </Field>
          <Field label="כתובת">
            {inp(candForm.address, v => setC('address', v))}
          </Field>
        </div>
      </section>

      {/* ── זמינות ── */}
      <section>
        <SectionTitle title="זמינות ותפקיד" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="סטטוס זמינות">
            {sel(candForm.availability_status, v => setC('availability_status', v), AVAILABILITY_STATUSES)}
          </Field>
          <Field label="התמחות">
            {sel(candForm.specialization, v => setC('specialization', v), SPECIALIZATIONS)}
          </Field>
          <Field label="זמינות מ-">
            {inp(candForm.availability_from, v => setC('availability_from', v), { type: 'date', dir: 'ltr' })}
          </Field>
          <Field label="זמינות עד-">
            {inp(candForm.availability_to, v => setC('availability_to', v), { type: 'date', dir: 'ltr' })}
          </Field>
        </div>
      </section>

      {/* ── שליחות ── */}
      <section>
        <SectionTitle title="שליחות" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מיקום שליחות">
            {inp(candForm.shlichut_location, v => setC('shlichut_location', v), { placeholder: 'עיר / מוסד' })}
          </Field>
          <Field label="שנות שליחות">
            {inp(candForm.shlichut_years, v => setC('shlichut_years', v), { placeholder: 'למשל: 2020-2022' })}
          </Field>
          <Field label="יום לימוד שבועי">
            {sel(candForm.study_day, v => setC('study_day', v), STUDY_DAYS)}
          </Field>
        </div>
      </section>

      {/* ── הכשרה ── */}
      <section>
        <SectionTitle title="הכשרה אקדמית" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מכללה / אוניברסיטה">
            {inp(candForm.college, v => setC('college', v))}
          </Field>
          <Field label="שנת סיום">
            {inp(candForm.graduation_year, v => setC('graduation_year', v), { type: 'number', dir: 'ltr', placeholder: '2025' })}
          </Field>
          <Field label="רמה אקדמית">
            {sel(candForm.academic_level, v => setC('academic_level', v), ACADEMIC_LEVELS)}
          </Field>
          {showExperience && (
            <Field label="שנות ניסיון">
              {inp(candForm.years_experience, v => setC('years_experience', v), { type: 'number', min: 0, dir: 'ltr', placeholder: '0' })}
            </Field>
          )}
          <Field label="כתב יד">
            {sel(candForm.handwriting_font, v => setC('handwriting_font', v), HANDWRITING_FONTS)}
          </Field>
          <Field label="שנות ותק (תיאור)">
            {inp(candForm.seniority_years, v => setC('seniority_years', v), { placeholder: 'למשל: 3 שנות הוראה' })}
          </Field>
        </div>
      </section>

      {/* ── ניסיון ── */}
      <section>
        <SectionTitle title="ניסיון ופרויקטים" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מעסיק קודם">
            {inp(candForm.prev_employer, v => setC('prev_employer', v), { placeholder: 'שם בית הספר / מוסד' })}
          </Field>
          <Field label="תפקיד קודם">
            {inp(candForm.prev_role, v => setC('prev_role', v), { placeholder: 'למשל: גננת, מורה לכיתות א-ג' })}
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <Field label="פרויקטים ותפקידים נוספים">
            <textarea
              value={candForm.past_projects}
              onChange={e => setC('past_projects', e.target.value)}
              rows={3}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
              style={inputStyle}
              placeholder="תארי ניסיון קודם, תפקידים, פרויקטים מיוחדים..."
            />
          </Field>
        </div>
      </section>

      {/* ── כישורים ── */}
      <section>
        <SectionTitle title="כישורים" />
        <div className="grid grid-cols-1 gap-4">
          <Field label="כישורים מקצועיים / טכניים">
            <textarea
              value={candForm.technical_skills}
              onChange={e => setC('technical_skills', e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
              style={inputStyle}
              placeholder="למשל: שליטה בלוח חכם, כלי הוראה דיגיטליים..."
            />
          </Field>
          <Field label="כישורים בין-אישיים">
            <textarea
              value={candForm.interpersonal_skills}
              onChange={e => setC('interpersonal_skills', e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
              style={inputStyle}
              placeholder="למשל: יכולת הכלה, עבודת צוות, יוזמה..."
            />
          </Field>
          <Field label="כישורים מיוחדים">
            <textarea
              value={candForm.special_skills}
              onChange={e => setC('special_skills', e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
              style={inputStyle}
              placeholder="למשל: ניגון בכלי, ספורט, אמנות..."
            />
          </Field>
        </div>
      </section>

      {/* ── אודות ── */}
      <section>
        <SectionTitle title="אודות" />
        <div className="grid grid-cols-1 gap-4">
          <Field label="ביוגרפיה קצרה">
            <textarea
              value={candForm.bio}
              onChange={e => setC('bio', e.target.value)}
              rows={3}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
              style={inputStyle}
            />
          </Field>
          <Field label="הערה אישית">
            <textarea
              value={candForm.personal_note}
              onChange={e => setC('personal_note', e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
              style={inputStyle}
              placeholder="מידע נוסף שתרצי לשתף..."
            />
          </Field>
        </div>
      </section>

      {/* ── תקשורת ── */}
      <section>
        <SectionTitle title="הגדרות תקשורת" />
        <div className="rounded-[12px] border p-4" style={{ borderColor: '#E9E3FC', background: '#FDFCFF' }}>
          <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>ערוץ קבלת עדכונים</p>
          <p className="text-[12px] mb-3" style={{ color: 'var(--ink-4)' }}>בחרי את הערוץ שדרכו תקבלי עדכונים על משרות חדשות וסטטוס הגשות</p>
          <div className="flex gap-2">
            {[{ label: 'WhatsApp', value: true }, { label: 'SMS', value: false }].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setC('whatsapp_preference', opt.value)}
                className="flex-1 h-10 rounded-[10px] text-[13px] font-bold border-2 transition-all"
                style={{
                  borderColor: candForm.whatsapp_preference === opt.value ? 'var(--teal)' : 'var(--line)',
                  background:  candForm.whatsapp_preference === opt.value ? 'var(--teal-050)' : '#fff',
                  color:       candForm.whatsapp_preference === opt.value ? 'var(--teal-600)' : 'var(--ink-3)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-11 px-8 rounded-[12px] text-[14px] font-bold text-white transition-all"
        style={{ background: saved ? '#1A7A4A' : 'var(--purple)', opacity: saving ? 0.7 : 1 }}>
        {saved ? '✓ נשמר' : saving ? 'שומר...' : 'שמירת שינויים'}
      </button>

    </div>
  )
}
