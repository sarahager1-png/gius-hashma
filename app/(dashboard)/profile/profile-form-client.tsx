'use client'

import { useState } from 'react'
import { AVAILABILITY_STATUSES, ACADEMIC_LEVELS, ACADEMIC_LEVELS_WITH_EXPERIENCE, DISTRICTS, SPECIALIZATIONS } from '@/lib/constants'
import type { Profile, Candidate } from '@/lib/types'
import { ChevronDown } from 'lucide-react'

const CITIES = [
  'אבן יהודה',
  'אבני חפץ',
  'אופקים',
  'אור יהודה',
  'אור עקיבא',
  'אילת',
  'אלעד',
  'אריאל',
  'אשדוד',
  'אשקלון',
  'באר שבע',
  'בית שאן',
  'בית שמש',
  'ביתר עילית',
  'בנימינה-גבעת עדה',
  'בני ברק',
  'בת ים',
  'גבעת זאב',
  'גבעת שמואל',
  'גבעתיים',
  'גדרה',
  'גן יבנה',
  'דימונה',
  'הוד השרון',
  'הרצליה',
  'חדרה',
  'חולון',
  'חיפה',
  'יבנה',
  'יהוד-מונוסון',
  'ירוחם',
  'ירושלים',
  'זיכרון יעקב',
  'טבריה',
  'טירת כרמל',
  'כפר חב\"ד',
  'כפר סבא',
  'לוד',
  'מבשרת ציון',
  'מודיעין',
  'מודיעין עילית',
  'מעלה אדומים',
  'מצפה רמון',
  'נהריה',
  'נס ציונה',
  'נתיבות',
  'נתניה',
  'עכו',
  'עמנואל',
  'עפולה',
  'ערד',
  'פתח תקווה',
  'צפת',
  'קריית אתא',
  'קריית ביאליק',
  'קריית גת',
  'קריית מוצקין',
  'קריית מלאכי',
  'קריית שמונה',
  'ראש העין',
  'ראשון לציון',
  'רהט',
  'רחובות',
  'רמלה',
  'רמת גן',
  'רעננה',
  'שדרות',
  'תל אביב',
  'אחר',
]

const MARITAL_STATUSES = ['רווקה', 'נשואה', 'גרושה', 'אלמנה']
const STUDY_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
const SENIORITY_OPTIONS = ['שנה ראשונה', '1–2 שנים', '3–5 שנים', '5–10 שנים', '10+ שנים']

const TECHNICAL_SKILLS_OPTIONS = [
  'לוח חכם', 'Google Classroom', 'כלים דיגיטליים', 'Office Suite',
  'Zoom / Teams', 'ניהול כיתה', 'הוראה דיפרנציאלית',
  'חינוך מיוחד', 'הוראת קריאה וכתיבה', 'עבודה עם ת.ל.מ',
]
const INTERPERSONAL_SKILLS_OPTIONS = [
  'עבודת צוות', 'יכולת הכלה', 'יצירתיות', 'יוזמה',
  'מנהיגות', 'אמפתיה', 'גמישות מחשבתית',
  'תקשורת טובה', 'ארגון וסדר', 'אחריות',
]
const SPECIAL_SKILLS_OPTIONS = [
  'ניגון בכלי', 'שירה', 'ציור / אמנות', 'ספורט',
  'בישול / אפייה', 'תיאטרון', 'מחול', 'צילום',
  'בנייה / מלאכה', 'קריאה / ספרות',
]

interface Props {
  profile: Profile
  candidate: Candidate | null
}

const inputCls = 'w-full h-10 rounded-[10px] border px-3 text-[14px] outline-none'
const inputStyle = { borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }
const inputFocus = { borderColor: 'var(--purple)', boxShadow: '0 0 0 3px rgba(75,46,131,.08)' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>{label}</label>
      {children}
    </div>
  )
}

function Chips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(value === o ? '' : o)}
          className="h-8 px-3 rounded-full text-[12px] font-semibold border transition-all"
          style={{
            borderColor: value === o ? 'var(--purple)' : 'var(--line)',
            background:  value === o ? 'var(--purple-050)' : '#fff',
            color:       value === o ? 'var(--purple)' : 'var(--ink-3)',
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function MultiChips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  function toggle(o: string) {
    const next = selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]
    onChange(next.join(', '))
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className="h-8 px-3 rounded-full text-[12px] font-semibold border transition-all"
          style={{
            borderColor: selected.includes(o) ? 'var(--purple)' : 'var(--line)',
            background:  selected.includes(o) ? 'var(--purple-050)' : '#fff',
            color:       selected.includes(o) ? 'var(--purple)' : 'var(--ink-3)',
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function AccSection({ id, title, open, onToggle, children }: {
  id: string; title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-[12px] overflow-hidden" style={{ border: '1px solid var(--line)' }}>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: open ? 'var(--purple-050)' : '#fff' }}>
        <span className="text-[14px] font-bold" style={{ color: open ? 'var(--purple)' : 'var(--ink)' }}>
          {title}
        </span>
        <ChevronDown size={16}
          style={{ color: 'var(--purple)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="px-5 py-5 space-y-5" style={{ borderTop: '1px solid var(--line)', background: '#fff' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function ProfileFormClient({ profile, candidate }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set(['personal']))
  function toggle(s: string) {
    setOpen(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  const [profileForm, setProfileForm] = useState({
    full_name: profile.full_name ?? '',
    phone:     profile.phone ?? '',
  })
  const [candForm, setCandForm] = useState({
    maiden_name:          candidate?.maiden_name ?? '',
    birth_year:           candidate?.birth_year?.toString() ?? '',
    marital_status:       candidate?.marital_status ?? '',
    district:             candidate?.district ?? '',
    city:                 candidate?.city ?? '',
    address:              candidate?.address ?? '',
    availability_status:  candidate?.availability_status ?? "מחפשת סטאג'",
    availability_from:    candidate?.availability_from ?? '',
    availability_to:      candidate?.availability_to ?? '',
    specialization:       candidate?.specialization ?? '',
    shlichut_location:    candidate?.shlichut_location ?? '',
    shlichut_years:       candidate?.shlichut_years ?? '',
    study_day:            candidate?.study_day ?? '',
    college:              candidate?.college ?? '',
    graduation_year:      candidate?.graduation_year?.toString() ?? '',
    academic_level:       candidate?.academic_level ?? '',
    years_experience:     candidate?.years_experience?.toString() ?? '',
    seniority_years:      candidate?.seniority_years ?? '',
    prev_employer:        candidate?.prev_employer ?? '',
    prev_role:            candidate?.prev_role ?? '',
    past_projects:        candidate?.past_projects ?? '',
    technical_skills:     candidate?.technical_skills ?? '',
    interpersonal_skills: candidate?.interpersonal_skills ?? '',
    special_skills:       candidate?.special_skills ?? '',
    bio:                  candidate?.bio ?? '',
    personal_note:        candidate?.personal_note ?? '',
    whatsapp_preference:  candidate?.whatsapp_preference ?? true,
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
          birth_year:       candForm.birth_year ? parseInt(candForm.birth_year) : null,
          graduation_year:  candForm.graduation_year ? parseInt(candForm.graduation_year) : null,
          years_experience: candForm.years_experience ? parseInt(candForm.years_experience) : null,
        },
      }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const inp = (value: string, onChange: (v: string) => void, extra: object = {}) => (
    <input value={value} onChange={e => onChange(e.target.value)}
      className={inputCls} style={inputStyle}
      onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
      onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
      {...extra} />
  )

  const sel = (value: string, onChange: (v: string) => void, options: string[], placeholder = 'בחרי') => (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls} style={inputStyle}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div className="space-y-3">

      <AccSection id="personal" title="פרטים אישיים" open={open.has('personal')} onToggle={() => toggle('personal')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם מלא *">{inp(profileForm.full_name, v => setP('full_name', v))}</Field>
          <Field label="שם נעורים">{inp(candForm.maiden_name, v => setC('maiden_name', v))}</Field>
          <Field label="טלפון">{inp(profileForm.phone, v => setP('phone', v), { dir: 'ltr' })}</Field>
          <Field label="שנת לידה">{inp(candForm.birth_year, v => setC('birth_year', v), { type: 'number', min: 1960, max: 2010, dir: 'ltr', placeholder: '1998' })}</Field>
          <Field label="עיר / ישוב">{sel(candForm.city, v => setC('city', v), CITIES, 'בחרי עיר')}</Field>
          <Field label="כתובת">{inp(candForm.address, v => setC('address', v))}</Field>
          <Field label="מחוז">{sel(candForm.district, v => setC('district', v), DISTRICTS)}</Field>
        </div>
        <Field label="מצב משפחתי">
          <Chips value={candForm.marital_status} onChange={v => setC('marital_status', v)} options={MARITAL_STATUSES} />
        </Field>
      </AccSection>

      <AccSection id="availability" title="זמינות ותפקיד" open={open.has('availability')} onToggle={() => toggle('availability')}>
        <Field label="התמחות">{sel(candForm.specialization, v => setC('specialization', v), SPECIALIZATIONS)}</Field>
        <Field label="סטאטוס זמינות">
          <Chips value={candForm.availability_status} onChange={v => setC('availability_status', v)} options={AVAILABILITY_STATUSES} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="זמינות מ-">{inp(candForm.availability_from, v => setC('availability_from', v), { type: 'date', dir: 'ltr' })}</Field>
          <Field label="זמינות עד-">{inp(candForm.availability_to, v => setC('availability_to', v), { type: 'date', dir: 'ltr' })}</Field>
        </div>
      </AccSection>

      <AccSection id="shlichut" title="שליחות" open={open.has('shlichut')} onToggle={() => toggle('shlichut')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מיקום שליחות">{inp(candForm.shlichut_location, v => setC('shlichut_location', v), { placeholder: 'עיר / מוסד' })}</Field>
          <Field label="שנות שליחות">{inp(candForm.shlichut_years, v => setC('shlichut_years', v), { placeholder: '2020–2022' })}</Field>
        </div>
        <Field label="יום לימוד שבועי">
          <Chips value={candForm.study_day} onChange={v => setC('study_day', v)} options={STUDY_DAYS} />
        </Field>
      </AccSection>

      <AccSection id="education" title="הכשרה אקדמית" open={open.has('education')} onToggle={() => toggle('education')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מכללה / אוניברסיטה">{inp(candForm.college, v => setC('college', v))}</Field>
          <Field label="שנת סיום">{inp(candForm.graduation_year, v => setC('graduation_year', v), { type: 'number', dir: 'ltr', placeholder: '2025' })}</Field>
          <Field label="רמה אקדמית">{sel(candForm.academic_level, v => setC('academic_level', v), ACADEMIC_LEVELS)}</Field>
          {showExperience && (
            <Field label="שנות ניסיון">{inp(candForm.years_experience, v => setC('years_experience', v), { type: 'number', min: 0, dir: 'ltr', placeholder: '0' })}</Field>
          )}
        </div>
        <Field label="ותק">
          <Chips value={candForm.seniority_years} onChange={v => setC('seniority_years', v)} options={SENIORITY_OPTIONS} />
        </Field>
      </AccSection>

      <AccSection id="experience" title="ניסיון" open={open.has('experience')} onToggle={() => toggle('experience')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מעסיק קודם">{inp(candForm.prev_employer, v => setC('prev_employer', v), { placeholder: 'שם בית הספר / מוסד' })}</Field>
          <Field label="תפקיד קודם">{inp(candForm.prev_role, v => setC('prev_role', v), { placeholder: 'גננת, מורה א–ג' })}</Field>
        </div>
        <Field label="פרויקטים ותפקידים נוספים">
          <textarea value={candForm.past_projects} onChange={e => setC('past_projects', e.target.value)}
            rows={3} className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
            style={inputStyle} placeholder="תארי ניסיון, תפקידים, פרויקטים מיוחדים..." />
        </Field>
      </AccSection>

      <AccSection id="skills" title="כישורים" open={open.has('skills')} onToggle={() => toggle('skills')}>
        <Field label="כישורים מקצועיים">
          <MultiChips value={candForm.technical_skills} onChange={v => setC('technical_skills', v)} options={TECHNICAL_SKILLS_OPTIONS} />
        </Field>
        <Field label="כישורים בין-אישיים">
          <MultiChips value={candForm.interpersonal_skills} onChange={v => setC('interpersonal_skills', v)} options={INTERPERSONAL_SKILLS_OPTIONS} />
        </Field>
        <Field label="כישורים מיוחדים">
          <MultiChips value={candForm.special_skills} onChange={v => setC('special_skills', v)} options={SPECIAL_SKILLS_OPTIONS} />
        </Field>
      </AccSection>

      <AccSection id="expression" title="ביטוי אישי" open={open.has('expression')} onToggle={() => toggle('expression')}>
        <Field label="ספרי לנו עליך">
          <textarea value={candForm.bio} onChange={e => setC('bio', e.target.value)}
            rows={4} className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
            style={inputStyle} placeholder="מה מניע אותך, מה את מביאה איתך, מה חשוב לך בעבודה..." />
        </Field>
        <Field label="הערה אישית">
          <textarea value={candForm.personal_note} onChange={e => setC('personal_note', e.target.value)}
            rows={2} className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none"
            style={inputStyle} placeholder="מידע נוסף שתרצי לשתף..." />
        </Field>
      </AccSection>

      <AccSection id="comm" title="הגדרות תקשורת" open={open.has('comm')} onToggle={() => toggle('comm')}>
        <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>ערוץ קבלת עדכונים על משרות וסטאטוס הגשות</p>
        <div className="flex gap-2">
          {[{ label: 'WhatsApp', value: true }, { label: 'SMS', value: false }].map(opt => (
            <button key={String(opt.value)} type="button" onClick={() => setC('whatsapp_preference', opt.value)}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-bold border-2 transition-all"
              style={{
                borderColor: candForm.whatsapp_preference === opt.value ? 'var(--teal)' : 'var(--line)',
                background:  candForm.whatsapp_preference === opt.value ? 'var(--teal-050)' : '#fff',
                color:       candForm.whatsapp_preference === opt.value ? 'var(--teal-600)' : 'var(--ink-3)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </AccSection>

      <button onClick={handleSave} disabled={saving}
        className="h-11 px-8 rounded-[12px] text-[14px] font-bold text-white transition-all"
        style={{ background: saved ? '#1A7A4A' : 'var(--purple)', opacity: saving ? 0.7 : 1 }}>
        {saved ? '✓ נשמר' : saving ? 'שומר...' : 'שמירת שינויים'}
      </button>

    </div>
  )
}
