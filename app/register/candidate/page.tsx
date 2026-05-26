'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ACADEMIC_LEVELS, DISTRICTS } from '@/lib/constants'
import {
  CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Trash2, Check, User, GraduationCap, Briefcase, Sparkles, FileText, Camera,
} from 'lucide-react'

/* ─── Constants ─── */
const HANDWRITING_FONTS = ['כתב עגול', 'כתב זקוף', 'כתב דפוס', 'כתב מקוון']
const MARITAL_STATUSES  = ['רווקה', 'נשואה', 'אחר']
const SPEC_OPTIONS      = ['יסודי', 'חט"ב', 'מתמטיקה', 'אנגלית', 'חינוך מיוחד', 'אחר']
const PRACTICAL_YEARS   = ["שנה א'", "שנה ב'"]

/* ─── Step definitions ─── */
const STEPS = [
  { id: 0, icon: User,          label: 'פרטים אישיים' },
  { id: 1, icon: GraduationCap, label: 'השכלה'        },
  { id: 2, icon: Briefcase,     label: 'ניסיון'        },
  { id: 3, icon: Sparkles,      label: 'כישורים'       },
  { id: 4, icon: FileText,      label: 'ביטוי אישי'   },
]

/* ─── Shared input styles ─── */
const inp = 'w-full h-11 px-3 rounded-[10px] border text-[16px] font-medium outline-none transition-all focus:border-purple focus:shadow-[0_0_0_3px_var(--purple-050)]'
const inpStyle = { borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }

/* ─── Sub-components ─── */
function Label({ children, optional, required }: { children: React.ReactNode; optional?: boolean; required?: boolean }) {
  return (
    <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: 'var(--ink-2)' }}>
      {children}
      {required && <span className="ms-1 text-[13px] font-bold" style={{ color: 'var(--purple)' }}>*</span>}
      {optional && <span className="ms-1.5 text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>(אופציונלי)</span>}
    </label>
  )
}

function NativeSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`${inp} pe-8 ps-3 appearance-none cursor-pointer`}
        style={{ ...inpStyle, color: value ? 'var(--ink)' : 'var(--ink-4)' }}>
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none"
        style={{ color: 'var(--ink-4)' }} />
    </div>
  )
}

function SpecChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[13px] font-semibold border transition-all"
      style={checked
        ? { background: 'var(--purple)', borderColor: 'var(--purple)', color: '#fff' }
        : { background: 'var(--purple-050)', borderColor: 'var(--purple-200)', color: 'var(--purple)' }}>
      {checked && <Check size={12} />}{label}
    </button>
  )
}

function Field({ label, optional, required, children }: { label: string; optional?: boolean; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label optional={optional} required={required}>{label}</Label>
      {children}
    </div>
  )
}

interface Experience    { role: string; employer: string; years: string }
interface PracticalWork { year: string; school_name: string; supervisor_name: string; supervisor_phone: string }

const EMPTY_EXP: Experience    = { role: '', employer: '', years: '' }
const EMPTY_PW:  PracticalWork = { year: '', school_name: '', supervisor_name: '', supervisor_phone: '' }

/* ══════════════════════════════════════════════════
   Step components
══════════════════════════════════════════════════ */

function StepPersonal({ form, set, workCities, setWorkCities, cityInput, setCityInput, photoUrl, setPhotoUrl }: {
  form: Record<string, string>; set: (k: string, v: string) => void
  workCities: string[]; setWorkCities: (v: string[]) => void
  cityInput: string; setCityInput: (v: string) => void
  photoUrl: string; setPhotoUrl: (v: string) => void
}) {
  const [photoLoading, setPhotoLoading] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/photo', { method: 'POST', body: fd })
    setPhotoLoading(false)
    if (res.ok) {
      const d = await res.json()
      setPhotoUrl(d.url)
    }
  }

  function addCity() {
    const c = cityInput.trim()
    if (c && !workCities.includes(c)) setWorkCities([...workCities, c])
    setCityInput('')
  }
  return (
    <div className="space-y-4">
      {/* Photo upload */}
      <div className="flex justify-center mb-2">
        <label className="relative cursor-pointer group">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center transition-all"
            style={{ background: photoUrl ? 'transparent' : 'var(--purple-050)', border: '2px dashed var(--purple-200)' }}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="תמונת פרופיל" className="w-full h-full object-cover" />
            ) : photoLoading ? (
              <span className="text-[12px] font-semibold" style={{ color: 'var(--purple)' }}>טוענת...</span>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera size={22} style={{ color: 'var(--purple)' }} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--purple)' }}>תמונה</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} color="#fff" />
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoLoading} />
        </label>
      </div>
      <p className="text-center text-[11.5px] -mt-2 mb-1" style={{ color: 'var(--ink-4)' }}>
        תמונת פרופיל <span className="font-medium">(אופציונלי)</span>
      </p>
      <div className="rounded-[12px] p-3.5" style={{ background: 'var(--teal-050)', border: '1px solid var(--teal-100)' }}>
        <p className="text-[12.5px] font-semibold" style={{ color: 'var(--teal-700)' }}>
          💡 ככל שתמלאי יותר פרטים — כך המערכת תוכל למצוא לך התאמה מהירה וטובה יותר
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="שם מלא" required>
          <input className={inp} style={inpStyle} value={form.full_name}
            onChange={e => set('full_name', e.target.value)} placeholder="שם פרטי ושם משפחה" dir="rtl" required />
        </Field>
        <Field label="טלפון" required>
          <input className={inp} style={inpStyle} dir="ltr" value={form.phone}
            onChange={e => set('phone', e.target.value)} placeholder="05X-XXXXXXX" required />
        </Field>
      </div>
      <Field label="אימייל" required>
        <input className={inp} style={inpStyle} dir="ltr" type="email" value={form.email}
          onChange={e => set('email', e.target.value)} placeholder="your@email.com" required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="שנת לידה" required>
          <input className={inp} style={inpStyle} type="number" min={1950} max={2010}
            value={form.birth_year} onChange={e => set('birth_year', e.target.value)}
            placeholder="1998" required />
        </Field>
        <Field label="מצב משפחתי" required>
          <NativeSelect value={form.marital_status} onChange={v => set('marital_status', v)}
            placeholder="בחרי" options={MARITAL_STATUSES} />
        </Field>
      </div>
      {form.marital_status === 'נשואה' && (
        <Field label="שם נעורים" optional>
          <input className={inp} style={inpStyle} value={form.maiden_name}
            onChange={e => set('maiden_name', e.target.value)} />
        </Field>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="מחוז" required>
          <NativeSelect value={form.district} onChange={v => set('district', v)}
            placeholder="בחרי מחוז" options={DISTRICTS} />
        </Field>
        <Field label="עיר" required>
          <input className={inp} style={inpStyle} value={form.city}
            onChange={e => set('city', e.target.value)} required />
        </Field>
      </div>
      <Field label="כתובת" optional>
        <input className={inp} style={inpStyle} value={form.address}
          onChange={e => set('address', e.target.value)} placeholder="רחוב ומספר בית" />
      </Field>
      <Field label="ערים שאני יכולה לעבוד בהן" optional>
        <div className="flex gap-2">
          <input className={inp} style={inpStyle} value={cityInput}
            onChange={e => setCityInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity() } }}
            placeholder="הקלידי עיר ולחצי הוספה..." />
          <button type="button" onClick={addCity}
            className="h-11 px-4 rounded-[10px] text-[13px] font-bold shrink-0"
            style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid var(--purple-200)' }}>
            + הוספה
          </button>
        </div>
        {workCities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {workCities.map(c => (
              <span key={c} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold"
                style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid var(--purple-200)' }}>
                {c}
                <button type="button" onClick={() => setWorkCities(workCities.filter(x => x !== c))}
                  className="text-[15px] leading-none opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
        <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-4)' }}>
          עוזר למערכת למצוא משרות גם בערים קרובות אליך
        </p>
      </Field>
    </div>
  )
}

function StepEducation({ form, set, specs, toggleSpec, customSpec, setCustomSpec }: {
  form: Record<string, string>; set: (k: string, v: string) => void
  specs: string[]; toggleSpec: (s: string) => void
  customSpec: string; setCustomSpec: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="מכללה / בית ספר להוראה" optional>
        <input className={inp} style={inpStyle} value={form.college}
          onChange={e => set('college', e.target.value)} placeholder="שם המוסד האקדמי..." />
      </Field>
      <Field label="רמה אקדמית">
        <NativeSelect value={form.academic_level}
          onChange={v => { set('academic_level', v); set('seniority_years', '') }}
          placeholder="בחרי" options={ACADEMIC_LEVELS} />
      </Field>
      {['תואר ראשון', 'תואר שני'].includes(form.academic_level) && (
        <Field label="שנות ותק">
          <NativeSelect value={form.seniority_years} onChange={v => set('seniority_years', v)}
            placeholder="בחרי" options={['1','2','3','4','5','6','7','8','9','10','11-15','15+']} />
        </Field>
      )}
      <div>
        <Label>התמחויות</Label>
        <div className="flex flex-wrap gap-2">
          {SPEC_OPTIONS.map(s => (
            <SpecChip key={s} label={s} checked={specs.includes(s)} onChange={() => toggleSpec(s)} />
          ))}
        </div>
        {specs.includes('אחר') && (
          <input className={`${inp} mt-3`} style={inpStyle}
            value={customSpec} onChange={e => setCustomSpec(e.target.value)}
            placeholder="פרטי את ההתמחות..." />
        )}
      </div>
    </div>
  )
}

function StepExperience({
  practicalWork, setPractical, addPractical, removePractical,
  experiences, setExp, addExp, removeExp,
  form, set,
}: {
  practicalWork: PracticalWork[]; setPractical: (i: number, k: keyof PracticalWork, v: string) => void
  addPractical: () => void; removePractical: () => void
  experiences: Experience[]; setExp: (i: number, k: keyof Experience, v: string) => void
  addExp: () => void; removeExp: (i: number) => void
  form: Record<string, string>; set: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-6">

      {/* עבודה מעשית */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[13px]"
            style={{ background: 'var(--purple-050)' }}>👩‍🏫</div>
          <h3 className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>עבודה מעשית</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-4)' }}>אופציונלי</span>
        </div>
        <div className="space-y-4">
          {practicalWork.map((pw, idx) => (
            <div key={idx} className="rounded-[12px] p-4 space-y-3"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
              {idx > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--ink-3)' }}>תקופה {idx + 1}</span>
                  <button type="button" onClick={removePractical}
                    className="flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--red)' }}>
                    <Trash2 size={12} />הסירי
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="שנה">
                  <NativeSelect value={pw.year} onChange={v => setPractical(idx, 'year', v)}
                    placeholder="בחרי" options={PRACTICAL_YEARS} />
                </Field>
                <Field label="שם בית הספר">
                  <input className={inp} style={inpStyle} value={pw.school_name}
                    onChange={e => setPractical(idx, 'school_name', e.target.value)} />
                </Field>
                <Field label="שם המדריכה">
                  <input className={inp} style={inpStyle} value={pw.supervisor_name}
                    onChange={e => setPractical(idx, 'supervisor_name', e.target.value)} />
                </Field>
                <Field label="טלפון מדריכה">
                  <input className={inp} style={inpStyle} dir="ltr" value={pw.supervisor_phone}
                    onChange={e => setPractical(idx, 'supervisor_phone', e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
          {practicalWork.length < 2 && (
            <button type="button" onClick={addPractical}
              className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-2 rounded-[9px] border transition-all"
              style={{ borderColor: 'var(--purple-200)', color: 'var(--purple)', background: 'var(--purple-050)' }}>
              <Plus size={13} />הוסיפי תקופה שנייה
            </button>
          )}
        </div>
      </div>

      {/* ניסיון תעסוקתי */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[13px]"
            style={{ background: 'var(--purple-050)' }}>💼</div>
          <h3 className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>ניסיון תעסוקתי</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-4)' }}>אופציונלי</span>
        </div>
        <div className="space-y-3">
          {experiences.map((exp, idx) => (
            <div key={idx} className="rounded-[12px] p-4 space-y-3"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
              {idx > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--ink-3)' }}>מקום עבודה {idx + 1}</span>
                  <button type="button" onClick={() => removeExp(idx)}
                    className="flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--red)' }}>
                    <Trash2 size={12} />הסירי
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="תפקיד">
                  <input className={inp} style={inpStyle} value={exp.role}
                    onChange={e => setExp(idx, 'role', e.target.value)} placeholder="מחנכת כיתה" />
                </Field>
                <Field label="מקום עבודה">
                  <input className={inp} style={inpStyle} value={exp.employer}
                    onChange={e => setExp(idx, 'employer', e.target.value)} />
                </Field>
              </div>
              <Field label="שנים">
                <input className={`${inp} max-w-[180px]`} style={inpStyle} value={exp.years}
                  onChange={e => setExp(idx, 'years', e.target.value)} placeholder='תשפ"ב–תשפ"ד' />
              </Field>
            </div>
          ))}
          <button type="button" onClick={addExp}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-2 rounded-[9px] border transition-all"
            style={{ borderColor: 'var(--purple-200)', color: 'var(--purple)', background: 'var(--purple-050)' }}>
            <Plus size={13} />הוסיפי מקום עבודה נוסף
          </button>
        </div>
      </div>

      {/* שליחות */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[13px]"
            style={{ background: 'var(--purple-050)' }}>✈️</div>
          <h3 className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>שליחות</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-4)' }}>אופציונלי</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="מקום שליחות">
            <input className={inp} style={inpStyle} value={form.shlichut_location}
              onChange={e => set('shlichut_location', e.target.value)} placeholder="עיר / מדינה..." />
          </Field>
          <Field label="תקופה">
            <input className={inp} style={inpStyle} value={form.shlichut_years}
              onChange={e => set('shlichut_years', e.target.value)} placeholder='תשפ"א–תשפ"ג' />
          </Field>
        </div>
      </div>
    </div>
  )
}

const STUDY_DAYS = ["יום א'", "יום ב'", "יום ג'", "יום ד'", "יום ה'", "אין יום לימודים"]

function StepSkills({ form, set, whatsappPref, setWhatsappPref }: {
  form: Record<string, string>; set: (k: string, v: string) => void
  whatsappPref: boolean; setWhatsappPref: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="כישורים טכניים" optional>
        <input className={inp} style={inpStyle} value={form.technical_skills}
          onChange={e => set('technical_skills', e.target.value)}
          placeholder="אופיס, עריכת וידאו, כלי AI, Canva..." />
      </Field>
      <Field label="כישורים בינאישיים" optional>
        <input className={inp} style={inpStyle} value={form.interpersonal_skills}
          onChange={e => set('interpersonal_skills', e.target.value)}
          placeholder="עבודת צוות, מנהיגות, תקשורת..." />
      </Field>
      <Field label="יום לימודים" optional>
        <NativeSelect value={form.study_day} onChange={v => set('study_day', v)}
          placeholder="בחרי" options={STUDY_DAYS} />
        {form.study_day && form.study_day !== "אין יום לימודים" && (
          <p className="text-[12px] mt-1.5 font-medium" style={{ color: 'var(--amber)' }}>
            ⚠️ ביום זה לא תוכלי לעבוד — יצוין בפרופיל שלך
          </p>
        )}
      </Field>
      <div className="rounded-[12px] p-4 space-y-4"
        style={{ background: 'var(--teal-050)', border: '1px solid var(--teal-100)' }}>
        <p className="text-[13px] font-bold" style={{ color: 'var(--teal-600)' }}>📅 תקופת פניות</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="מתאריך">
            <input type="date" value={form.availability_from}
              onChange={e => { set('availability_from', e.target.value); set('availability_to', '') }}
              className={inp} style={inpStyle} />
          </Field>
          <Field label="עד תאריך">
            <input type="date" value={form.availability_to}
              min={form.availability_from || undefined}
              onChange={e => set('availability_to', e.target.value)}
              className={inp} style={inpStyle} />
          </Field>
        </div>
        {form.availability_from && form.availability_to && (
          <p className="text-[13px] font-semibold" style={{ color: 'var(--teal-700)' }}>
            ✓ זמינה: {new Date(form.availability_from).toLocaleDateString('he-IL')} —{' '}
            {new Date(form.availability_to).toLocaleDateString('he-IL')}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-[12px] p-4"
        style={{ background: 'var(--purple-050)', border: '1px solid var(--purple-200)' }}>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>קבלת עדכונים בוואטסאפ</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>עדכונים על משרות ישלחו גם לוואטסאפ (בנוסף ל-SMS)</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={whatsappPref}
          onClick={() => setWhatsappPref(!whatsappPref)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0"
          style={{ background: whatsappPref ? 'var(--teal)' : '#D1D5DB' }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: whatsappPref ? 'translateX(-6px)' : 'translateX(-26px)' }}
          />
        </button>
      </div>
    </div>
  )
}

function StepPersonalExpression({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="גופן כתיבה" optional>
        <NativeSelect value={form.handwriting_font} onChange={v => set('handwriting_font', v)}
          placeholder="בחרי" options={HANDWRITING_FONTS} />
      </Field>
      <Field label="פרויקטים ויוזמות בולטים" optional>
        <textarea
          className="w-full px-3 py-2.5 rounded-[10px] border text-[14px] outline-none resize-none transition-all focus:border-purple focus:shadow-[0_0_0_3px_var(--purple-050)]"
          style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)', fontFamily: 'inherit', minHeight: '88px' }}
          value={form.past_projects} onChange={e => set('past_projects', e.target.value)}
          placeholder="פרויקטים, יוזמות או הישגים בולטים..." />
      </Field>
      <Field label="כמה מילים על עצמך" optional>
        <textarea
          className="w-full px-3 py-2.5 rounded-[10px] border text-[14px] outline-none resize-none transition-all focus:border-purple focus:shadow-[0_0_0_3px_var(--purple-050)]"
          style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)', fontFamily: 'inherit', minHeight: '110px' }}
          value={form.personal_note} onChange={e => set('personal_note', e.target.value)}
          placeholder="ספרי קצת על עצמך, על הדרך שלך, על מה שמניע אותך..." />
      </Field>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Main wizard
════════════════════════════════════════════════ */
export default function RegisterCandidatePage() {
  return (
    <Suspense>
      <RegisterCandidateForm />
    </Suspense>
  )
}

function RegisterCandidateForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const isGoogleFlow = searchParams.get('google') === '1'

  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState({
    full_name: '', phone: '', email: '',
    district: '', city: '', address: '',
    birth_year: '', marital_status: '', maiden_name: '',
    college: '', academic_level: '', seniority_years: '',
    technical_skills: '', interpersonal_skills: '',
    study_day: '',
    availability_from: '', availability_to: '',
    shlichut_location: '', shlichut_years: '',
    past_projects: '', personal_note: '', handwriting_font: '',
  })
  const [whatsappPref, setWhatsappPref] = useState(true)
  const [workCities, setWorkCities]   = useState<string[]>([])
  const [cityInput, setCityInput]     = useState('')
  const [specs, setSpecs]         = useState<string[]>([])
  const [customSpec, setCustomSpec] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([{ ...EMPTY_EXP }])
  const [practicalWork, setPracticalWork] = useState<PracticalWork[]>([{ ...EMPTY_PW }])
  const [photoUrl, setPhotoUrl]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  // Pre-fill from Google session when coming from OAuth
  useEffect(() => {
    if (!isGoogleFlow) return
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const meta = session.user.user_metadata
      setForm(f => ({
        ...f,
        full_name: meta?.full_name ?? f.full_name,
        email:     session.user.email ?? f.email,
      }))
    })
  }, [isGoogleFlow])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function toggleSpec(s: string)     { setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]) }

  function addExp()                { setExperiences(p => [...p, { ...EMPTY_EXP }]) }
  function removeExp(i: number)    { setExperiences(p => p.filter((_, j) => j !== i)) }
  function setExp(i: number, k: keyof Experience, v: string) {
    setExperiences(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e))
  }
  function addPractical()          { if (practicalWork.length < 2) setPracticalWork(p => [...p, { ...EMPTY_PW }]) }
  function removePractical()       { setPracticalWork(p => p.slice(0, 1)) }
  function setPractical(i: number, k: keyof PracticalWork, v: string) {
    setPracticalWork(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e))
  }

  function canGoNext() {
    if (step === 0) return !!(form.full_name.trim() && form.phone.trim() && form.birth_year && form.marital_status && form.district && form.city.trim())
    return true
  }

  function buildSpec() {
    const base = specs.filter(s => s !== 'אחר')
    if (specs.includes('אחר') && customSpec.trim()) base.push(customSpec.trim())
    return base.join(', ') || null
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    const hasExp       = experiences.some(ex => ex.role.trim() || ex.employer.trim())
    const hasPractical = practicalWork.some(pw => pw.school_name.trim() || pw.supervisor_name.trim())

    const sharedPayload = {
      college:              form.college.trim() || null,
      academic_level:       form.academic_level || null,
      seniority_years:      form.seniority_years || null,
      specialization:       buildSpec(),
      handwriting_font:     form.handwriting_font || null,
      technical_skills:     form.technical_skills.trim() || null,
      interpersonal_skills: form.interpersonal_skills.trim() || null,
      study_day:            form.study_day && form.study_day !== "אין יום לימודים" ? form.study_day : null,
      experiences:          hasExp ? experiences.filter(ex => ex.role.trim() || ex.employer.trim()) : null,
      practical_work:       hasPractical ? practicalWork.filter(pw => pw.school_name.trim() || pw.supervisor_name.trim()) : null,
      availability_from:    form.availability_from || null,
      availability_to:      form.availability_to || null,
      shlichut_location:    form.shlichut_location.trim() || null,
      shlichut_years:       form.shlichut_years.trim() || null,
      past_projects:        form.past_projects.trim() || null,
      personal_note:        form.personal_note.trim() || null,
      district:             form.district || null,
      city:                 form.city.trim() || null,
      address:              form.address.trim() || null,
      birth_year:           form.birth_year ? parseInt(form.birth_year) : null,
      marital_status:       form.marital_status || null,
      maiden_name:          form.maiden_name.trim() || null,
      whatsapp_preference:  whatsappPref,
      work_cities:          workCities.length > 0 ? workCities : null,
      photo_url:            photoUrl || null,
    }

    let res: Response

    if (isGoogleFlow) {
      // Google user — already has profile+candidates row; just PATCH the candidates record
      res = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            full_name: form.full_name.trim(),
            phone:     form.phone.trim(),
          },
          candidate: sharedPayload,
        }),
      })
    } else {
      // Anonymous user — submit to pending approval queue
      res = await fetch('/api/candidate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone:     form.phone.trim(),
          email:     form.email.trim() || null,
          ...sharedPayload,
        }),
      })
    }

    setLoading(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה, נסי שוב')
      return
    }

    if (isGoogleFlow) {
      router.push('/profile')
    } else {
      setDone(true)
    }
  }

  /* ── Success screen ── */
  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(94,61,174,.10) 0%, transparent 60%), var(--bg)' }}>
      <div className="bg-white rounded-[24px] p-10 w-full max-w-sm text-center"
        style={{ boxShadow: '0 20px 60px rgba(15,11,35,.12)', border: '1px solid var(--line)' }}>
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: '#DCFCE7' }}>
          <CheckCircle size={40} style={{ color: '#16A34A' }} />
        </div>
        <h2 className="text-[24px] font-extrabold mb-2" style={{ color: '#166534' }}>הבקשה נשלחה!</h2>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          בקשתך התקבלה בהצלחה.<br />
          מנהלת הרשת תאשר את הצטרפותך בהקדם.<br />
          תישלח אליך הודעה עם אישור.
        </p>
        <Link href="/"
          className="block mt-7 py-3 rounded-[12px] text-[14px] font-extrabold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,var(--purple),var(--teal))', boxShadow: '0 4px 14px rgba(91,58,171,.3)' }}>
          חזרה לדף הבית ←
        </Link>
      </div>
    </div>
  )

  const StepIcon = STEPS[step].icon

  return (
    <div dir="rtl" className="min-h-screen py-8 px-4"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(94,61,174,.10) 0%, transparent 60%), var(--bg)',
        fontFamily: 'Heebo, system-ui, sans-serif',
      }}>
      <div className="w-full max-w-[540px] mx-auto">

        {/* Logo + title */}
        <div className="flex flex-col items-center mb-6">
          <div className="rounded-2xl bg-white p-2.5 shadow-sm border border-purple-100 mb-3">
            <Image src="/logo-chabad.png" alt="לוגו הרשת" width={130} height={40} className="object-contain" priority />
          </div>
          <h1 className="text-[20px] font-extrabold text-center" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
            ברוכה הבאה למערכת השביל!
          </h1>
          <p className="text-[13px] mt-1 text-center" style={{ color: 'var(--ink-4)' }}>
            מלאי את הפרטים לשליחת בקשת הצטרפות
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done  = i < step
            const active = i === step
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={
                      done   ? { background: 'var(--purple)', color: '#fff', cursor: 'pointer' }
                    : active ? { background: 'linear-gradient(135deg,var(--purple),var(--teal))', color: '#fff', boxShadow: '0 4px 12px rgba(94,61,174,.35)' }
                    :           { background: 'var(--bg-2)', color: 'var(--ink-4)', border: '1.5px solid var(--line)' }
                    }>
                    {done ? <Check size={15} strokeWidth={2.5} /> : <Icon size={15} />}
                  </button>
                  <span className="text-[10px] font-bold text-center leading-tight"
                    style={{ color: active ? 'var(--purple)' : done ? 'var(--ink-3)' : 'var(--ink-5)' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-[2px] flex-1 mx-1 rounded-full mb-4"
                    style={{ background: i < step ? 'var(--purple)' : 'var(--line)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="rounded-[20px] overflow-hidden mb-4"
          style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: '0 4px 40px rgba(94,61,174,.08)' }}>

          {/* Card header */}
          <div className="h-[3px] w-full"
            style={{ background: 'linear-gradient(90deg,var(--purple),var(--teal))' }} />
          <div className="px-4 sm:px-6 pt-5 pb-3 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: 'var(--purple-050)' }}>
              <StepIcon size={18} style={{ color: 'var(--purple)' }} />
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
                {STEPS[step].label}
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
                שלב {step + 1} מתוך {STEPS.length}
              </p>
            </div>
          </div>

          {/* Step content */}
          <div className="px-4 sm:px-6 py-5">
            {step === 0 && (
              <div className="rounded-[12px] p-3.5 mb-5"
                style={{ background: 'var(--purple-050)', border: '1px solid var(--purple-200)' }}>
                {isGoogleFlow ? (
                  <>
                    <p className="text-[12px] font-extrabold mb-1" style={{ color: 'var(--purple)' }}>כמעט סיימנו 🎉</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
                      מלאי את הפרטים — הפרופיל שלך יהיה מוכן מיד ותוכלי להתחיל לחפש משרות
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] font-extrabold mb-2" style={{ color: 'var(--purple)' }}>איך זה עובד?</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        'מלאי את הטופס ושלחי בקשת הצטרפות',
                        'מנהלת המערכת תאשר את בקשתך תוך 24 שעות',
                        'תקבלי SMS — ותוכלי להיכנס עם Google',
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0"
                            style={{ background: 'var(--purple)', color: '#fff' }}>{i + 1}</span>
                          <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {step === 0 && <StepPersonal form={form} set={set} workCities={workCities} setWorkCities={setWorkCities} cityInput={cityInput} setCityInput={setCityInput} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} />}
            {step === 1 && <StepEducation form={form} set={set}
              specs={specs} toggleSpec={toggleSpec}
              customSpec={customSpec} setCustomSpec={setCustomSpec} />}
            {step === 2 && <StepExperience
              practicalWork={practicalWork} setPractical={setPractical}
              addPractical={addPractical} removePractical={removePractical}
              experiences={experiences} setExp={setExp}
              addExp={addExp} removeExp={removeExp}
              form={form} set={set} />}
            {step === 3 && <StepSkills form={form} set={set} whatsappPref={whatsappPref} setWhatsappPref={setWhatsappPref} />}
            {step === 4 && <StepPersonalExpression form={form} set={set} />}

            {error && (
              <p className="text-[13px] font-medium px-3 py-2 rounded-[9px] mt-4"
                style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex items-center justify-between gap-3">
            <button type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1.5 h-11 px-5 rounded-[11px] border text-[14px] font-semibold transition-all"
              style={{
                borderColor: step === 0 ? 'transparent' : 'var(--line)',
                color: step === 0 ? 'transparent' : 'var(--ink)',
                background: step === 0 ? 'transparent' : '#fff',
              }}>
              <ChevronRight size={16} />
              הקודם
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button"
                onClick={() => { if (canGoNext()) { setError(''); setStep(s => s + 1) } else setError('יש למלא את כל השדות המסומנים') }}
                className="flex items-center gap-1.5 h-11 px-6 rounded-[11px] text-[14px] font-extrabold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg,var(--purple),var(--teal))',
                  boxShadow: '0 4px 14px rgba(94,61,174,.28)',
                }}>
                הבא
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 h-11 px-6 rounded-[11px] text-[14px] font-extrabold text-white transition-all"
                style={{
                  background: loading ? 'var(--ink-4)' : 'linear-gradient(135deg,var(--purple),var(--teal))',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(94,61,174,.28)',
                }}>
                {loading ? 'שולחת...' : isGoogleFlow ? 'סיימתי — לדשבורד ←' : 'שלחי בקשת הצטרפות ✓'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[12px] mb-8" style={{ color: 'var(--ink-4)' }}>
          <Link href="/" style={{ color: 'var(--ink-4)', textDecoration: 'none' }}>← חזרה לדף הבית</Link>
        </p>
      </div>
    </div>
  )
}
