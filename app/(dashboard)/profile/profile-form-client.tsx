'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { AVAILABILITY_STATUSES, ACADEMIC_LEVELS, ACADEMIC_LEVELS_WITH_EXPERIENCE, DISTRICTS, SPECIALIZATIONS } from '@/lib/constants'
import type { Profile, Candidate } from '@/lib/types'
import { ChevronDown, Pencil, CheckCircle2, Circle } from 'lucide-react'

const CITIES = [
  'אבן יהודה','אבני חפץ','אופקים','אור יהודה','אור עקיבא','אילת',
  'אלעד','אריאל','אשדוד','אשקלון','באר שבע','בית שאן','בית שמש',
  'ביתר עילית','בנימינה-גבעת עדה','בני ברק','בת ים','גבעת זאב',
  'גבעת שמואל','גבעתיים','גדרה','גן יבנה','דימונה','הוד השרון',
  'הרצליה','חדרה','חולון','חיפה','יבנה','יהוד-מונוסון','ירוחם',
  'ירושלים','זיכרון יעקב','טבריה','טירת כרמל','כפר חב"ד','כפר סבא',
  'לוד','מבשרת ציון','מודיעין','מודיעין עילית','מעלה אדומים','מצפה רמון',
  'נהריה','נס ציונה','נתיבות','נתניה','עכו','עמנואל','עפולה','ערד',
  'פתח תקווה','צפת','קריית אתא','קריית ביאליק','קריית גת','קריית מוצקין',
  'קריית מלאכי','קריית שמונה','ראש העין','ראשון לציון','רהט','רחובות',
  'רמלה','רמת גן','רעננה','שדרות','תל אביב','אחר',
]

const COLLEGES = [
  'אוניברסיטת תל אביב','האוניברסיטה העברית בירושלים','אוניברסיטת בר-אילן',
  'אוניברסיטת חיפה','אוניברסיטת בן-גוריון בנגב','הטכניון','האוניברסיטה הפתוחה',
  'מכללת לוינסקי לחינוך','מכללת בית ברל','מכללת סמינר הקיבוצים','מכללת גורדון',
  'מכללת תלפיות','מכללת אחוה','מכללת קיי','מכללת הרצוג','מדרשת ליפשיץ',
  'מכללת אוהלו','מכללת ספיר','מכללת עמק יזרעאל','מכללת צפת','מכון לב',
  'מכון טל','מכללת אריאל','המכללה האקדמית נתניה','אחר',
]

const SENIORITY_YEARS = Array.from({ length: 20 }, (_, i) => String(i + 1))
const MARITAL_STATUSES = ['רווקה', 'נשואה', 'אחר']
const STUDY_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
const INTERPERSONAL_SKILLS_OPTIONS = [
  'עבודת צוות','יכולת הכלה','יצירתיות','יוזמה','מנהיגות','אמפתיה',
  'גמישות מחשבתית','תקשורת טובה','ארגון וסדר','אחריות',
]
const SPECIAL_SKILLS_OPTIONS = [
  'ניגון בכלי','שירה','ציור / אמנות','ספורט','בישול / אפייה','תיאטרון',
  'מחול','צילום','בנייה / מלאכה','גרפיקה','עיצוב','בניית מצגות',
]

interface Props { profile: Profile; candidate: Candidate | null }
type WorkEntry = { workplace: string; manager: string }

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
          style={{ borderColor: value === o ? 'var(--purple)' : 'var(--line)', background: value === o ? 'var(--purple-050)' : '#fff', color: value === o ? 'var(--purple)' : 'var(--ink-3)' }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function MultiChips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  const [showInput, setShowInput] = useState(false)
  const [customVal, setCustomVal] = useState('')
  function toggle(o: string) { onChange(selected.includes(o) ? selected.filter(s => s !== o).join(', ') : [...selected, o].join(', ')) }
  function addCustom() {
    const t = customVal.trim()
    if (!t || selected.includes(t)) { setShowInput(false); setCustomVal(''); return }
    onChange([...selected, t].join(', ')); setCustomVal(''); setShowInput(false)
  }
  const customSelected = selected.filter(s => !options.includes(s))
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className="h-8 px-3 rounded-full text-[12px] font-semibold border transition-all"
          style={{ borderColor: selected.includes(o) ? 'var(--purple)' : 'var(--line)', background: selected.includes(o) ? 'var(--purple-050)' : '#fff', color: selected.includes(o) ? 'var(--purple)' : 'var(--ink-3)' }}>
          {o}
        </button>
      ))}
      {customSelected.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className="h-8 px-3 rounded-full text-[12px] font-semibold border transition-all"
          style={{ borderColor: 'var(--purple)', background: 'var(--purple-050)', color: 'var(--purple)' }}>
          {o} ×
        </button>
      ))}
      {showInput ? (
        <div className="flex items-center gap-1">
          <input autoFocus value={customVal} onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            className="h-8 px-2 rounded-[8px] border text-[12px] outline-none w-32"
            style={{ borderColor: 'var(--purple)', color: 'var(--ink)', background: '#fff' }} placeholder="הוסיפי..." />
          <button type="button" onClick={addCustom} className="h-8 px-3 rounded-[8px] text-[12px] font-bold text-white" style={{ background: 'var(--purple)' }}>+</button>
          <button type="button" onClick={() => { setShowInput(false); setCustomVal('') }} className="h-8 px-2 text-[13px]" style={{ color: 'var(--ink-4)' }}>×</button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowInput(true)}
          className="h-8 px-3 rounded-full text-[12px] font-semibold border border-dashed transition-all"
          style={{ borderColor: 'var(--purple)', color: 'var(--purple)', background: '#fff' }}>+ אחר</button>
      )}
    </div>
  )
}

function TechSkillsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const toArr = (v: string) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : ['']
  const [items, setItems] = useState<string[]>(() => { const a = toArr(value); return a.length ? a : [''] })
  function update(i: number, val: string) { const next = items.map((s, idx) => idx === i ? val : s); setItems(next); onChange(next.filter(Boolean).join(', ')) }
  function add() { if (items.length < 5) setItems(p => [...p, '']) }
  function remove(i: number) { const next = items.filter((_, idx) => idx !== i); const f = next.length ? next : ['']; setItems(f); onChange(f.filter(Boolean).join(', ')) }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={e => update(i, e.target.value)} className={inputCls} style={inputStyle}
            onFocus={e => Object.assign(e.currentTarget.style, inputFocus)} onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
            placeholder="תארי כישור מקצועי..." />
          {items.length > 1 && <button type="button" onClick={() => remove(i)} className="flex-shrink-0 w-8 h-8 rounded-[8px] text-[13px] font-bold" style={{ background: '#FEE2E2', color: '#B91C1C' }}>×</button>}
        </div>
      ))}
      {items.length < 5 && <button type="button" onClick={add} className="h-8 px-3 rounded-full text-[12px] font-semibold border border-dashed" style={{ borderColor: 'var(--purple)', color: 'var(--purple)', background: '#fff' }}>+ הוספה</button>}
    </div>
  )
}

function AccSection({ title, open, onToggle, children, done }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; done?: boolean }) {
  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: `1px solid ${open ? 'var(--purple-200)' : 'var(--line)'}`, boxShadow: open ? '0 0 0 3px rgba(75,46,131,.06)' : 'none', transition: 'box-shadow .2s' }}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4" style={{ background: open ? 'var(--purple-050)' : '#fff' }}>
        <div className="flex items-center gap-2.5">
          {done
            ? <CheckCircle2 size={15} style={{ color: 'var(--teal)' }} />
            : <Circle size={15} style={{ color: 'var(--ink-5)' }} />
          }
          <span className="text-[14px] font-bold" style={{ color: open ? 'var(--purple)' : 'var(--ink)' }}>{title}</span>
        </div>
        <ChevronDown size={16} style={{ color: 'var(--purple)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && <div className="px-5 py-5 space-y-5" style={{ borderTop: '1px solid var(--line)', background: '#fff' }}>{children}</div>}
    </div>
  )
}

function SkillTags({ value }: { value?: string | null }) {
  const items = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(s => <span key={s} className="px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold" style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>{s}</span>)}
    </div>
  )
}

function InfoRow({ label, value, ltr }: { label: string; value?: string | null; ltr?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--line-soft)' }}>
      <span className="text-[12px] font-semibold shrink-0 w-28" style={{ color: 'var(--ink-4)' }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: 'var(--ink)', direction: ltr ? 'ltr' : undefined }}>{value}</span>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
        <p className="text-[11px] font-black uppercase tracking-[.1em]" style={{ color: 'var(--ink-4)' }}>{title}</p>
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  )
}

/* ── completion score ── */
function useCompletion(c: Candidate | null, pf: { full_name: string; phone: string }) {
  return useMemo(() => {
    if (!c) return 0
    const checks = [
      !!pf.full_name, !!pf.phone, !!c.city, !!c.district,
      !!c.specialization, !!c.academic_level, !!c.college,
      !!c.shlichut_location, !!c.bio,
    ]
    return Math.round(checks.filter(Boolean).length / checks.length * 100)
  }, [c, pf])
}

/* ══ main component ══ */
export default function ProfileFormClient({ profile, candidate }: Props) {
  const [mode, setMode] = useState<'card' | 'edit'>('card')
  const [open, setOpen] = useState<Set<string>>(new Set(['personal']))
  function toggle(s: string) { setOpen(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n }) }

  const [profileForm, setProfileForm] = useState({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' })
  const [candForm, setCandForm] = useState({
    birth_year: candidate?.birth_year?.toString() ?? '',
    maiden_name: candidate?.maiden_name ?? '',
    marital_status: candidate?.marital_status ?? '', district: candidate?.district ?? '',
    city: candidate?.city ?? '', address: candidate?.address ?? '',
    availability_status: candidate?.availability_status ?? "מחפשת סטאג'",
    availability_from: candidate?.availability_from ?? '', availability_to: candidate?.availability_to ?? '',
    specialization: candidate?.specialization ?? '', shlichut_location: candidate?.shlichut_location ?? '',
    shlichut_years: candidate?.shlichut_years ?? '', study_day: candidate?.study_day ?? '',
    college: candidate?.college ?? '', graduation_year: candidate?.graduation_year?.toString() ?? '',
    academic_level: candidate?.academic_level ?? '', years_experience: candidate?.years_experience?.toString() ?? '',
    seniority_years: candidate?.seniority_years ?? '', past_projects: candidate?.past_projects ?? '',
    technical_skills: candidate?.technical_skills ?? '', interpersonal_skills: candidate?.interpersonal_skills ?? '',
    special_skills: candidate?.special_skills ?? '', bio: candidate?.bio ?? '',
    personal_note: candidate?.personal_note ?? '', whatsapp_preference: candidate?.whatsapp_preference ?? true,
  })

  const completion = useCompletion(candidate, profileForm)

  const initWork = (): WorkEntry[] => {
    const raw = candidate?.experiences
    if (!Array.isArray(raw) || raw.length === 0) return [{ workplace: '', manager: '' }]
    return raw.map((e: unknown) => {
      const entry = e as Record<string, string>
      return { workplace: entry.workplace ?? entry.employer ?? '', manager: entry.manager ?? '' }
    })
  }
  const [workHistory, setWorkHistory] = useState<WorkEntry[]>(initWork)
  function setWork(i: number, key: 'workplace' | 'manager', val: string) { setWorkHistory(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: val } : e)) }
  function addWork() { if (workHistory.length < 4) setWorkHistory(p => [...p, { workplace: '', manager: '' }]) }
  function removeWork(i: number) { setWorkHistory(p => p.filter((_, idx) => idx !== i)) }

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setP(k: string, v: string) { setProfileForm(f => ({ ...f, [k]: v })) }
  function setC(k: string, v: string | boolean) { setCandForm(f => ({ ...f, [k]: v })) }

  const showExperience = ACADEMIC_LEVELS_WITH_EXPERIENCE.includes(candForm.academic_level as never)
  const filledWork = workHistory.filter(e => e.workplace?.trim())

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/candidates', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: profileForm,
        candidate: {
          ...candForm,
          birth_year: candForm.birth_year ? parseInt(candForm.birth_year) : null,
          graduation_year: candForm.graduation_year ? parseInt(candForm.graduation_year) : null,
          years_experience: candForm.years_experience ? parseInt(candForm.years_experience) : null,
          experiences: workHistory.filter(e => e.workplace?.trim()),
        },
      }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => { setSaved(false); setMode('card') }, 1200) }
  }

  const inp = (value: string, onChange: (v: string) => void, extra: object = {}) => (
    <input value={value} onChange={e => onChange(e.target.value)} className={inputCls} style={inputStyle}
      onFocus={e => Object.assign(e.currentTarget.style, inputFocus)} onBlur={e => Object.assign(e.currentTarget.style, inputStyle)} {...extra} />
  )
  const sel = (value: string, onChange: (v: string) => void, options: string[], placeholder = 'בחרי') => (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls} style={inputStyle}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  const initials = profileForm.full_name.trim().split(' ').slice(0, 2).map(w => w[0]).filter(Boolean).join('')

  /* ══ CARD MODE ══ */
  if (mode === 'card') {
    return (
      <div className="space-y-4">

        {/* ── Hero card ── */}
        <div className="rounded-[20px] overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>

          {/* brand strip */}
          <div style={{ height: '4px', background: 'var(--brand-gradient)' }} />

          {/* dark header */}
          <div style={{ background: 'linear-gradient(135deg, #120929 0%, #1A0B35 40%, #2D1B5C 80%, #3D2570 100%)', padding: '24px 24px 20px' }}>

            {/* logo + system name */}
            <div className="flex items-center gap-2 mb-5">
              <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                <Image src="/logo-chabad.png" alt="השביל" width={22} height={22} className="object-contain" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>מערכת השביל</span>
            </div>

            {/* avatar + name */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-.02em', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,167,181,.3)' }}>
                  {initials || '?'}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-.02em', lineHeight: 1.2 }}>{profileForm.full_name || '—'}</h2>
                  {candForm.specialization && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4, fontWeight: 600 }}>{candForm.specialization}{candForm.city ? ` · ${candForm.city}` : ''}</p>}
                </div>
              </div>
              <button onClick={() => setMode('edit')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                <Pencil size={12} />עריכה
              </button>
            </div>

            {/* status badge */}
            {candForm.availability_status && (
              <div style={{ marginTop: 16 }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: 'rgba(0,167,181,.25)', color: '#7FE8F0', border: '1px solid rgba(0,167,181,.35)' }}>
                  {candForm.availability_status}
                </span>
              </div>
            )}
          </div>

          {/* completion bar */}
          <div style={{ background: '#fff', padding: '14px 24px', borderBottom: '1px solid var(--line)' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)' }}>השלמת פרופיל</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: completion >= 80 ? 'var(--teal-600)' : 'var(--purple)' }}>{completion}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completion}%`, borderRadius: 999, background: completion >= 80 ? 'linear-gradient(90deg, var(--teal) 0%, #00CFA8 100%)' : 'var(--brand-gradient)', transition: 'width .4s var(--ease-out)' }} />
            </div>
            {completion < 80 && (
              <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 6, fontWeight: 500 }}>פרופיל מלא מקבל עדיפות בהתאמות משרות</p>
            )}
          </div>
        </div>

        {/* ── Info sections ── */}
        <SectionCard title="פרטים אישיים">
          <InfoRow label="טלפון" value={profileForm.phone} ltr />
          <InfoRow label="עיר / ישוב" value={candForm.city} />
          <InfoRow label="כתובת" value={candForm.address} />
          <InfoRow label="מחוז" value={candForm.district} />
          <InfoRow label="שנת לידה" value={candForm.birth_year} />
          <InfoRow label="מצב משפחתי" value={candForm.marital_status} />
          {candForm.marital_status === 'נשואה' && <InfoRow label="שם נעורים" value={candForm.maiden_name} />}
        </SectionCard>

        {candForm.availability_from && (
          <SectionCard title="זמינות">
            <InfoRow label="פנויה מ-" value={new Date(candForm.availability_from).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </SectionCard>
        )}

        {(candForm.shlichut_location || candForm.shlichut_years || candForm.study_day) && (
          <SectionCard title="שליחות">
            <InfoRow label="מיקום" value={candForm.shlichut_location} />
            <InfoRow label="שנים" value={candForm.shlichut_years} />
            <InfoRow label="יום לימוד" value={candForm.study_day} />
          </SectionCard>
        )}

        {(candForm.college || candForm.academic_level || candForm.graduation_year || candForm.seniority_years) && (
          <SectionCard title="הכשרה אקדמית">
            <InfoRow label="מוסד" value={candForm.college} />
            <InfoRow label="רמה" value={candForm.academic_level} />
            <InfoRow label="שנת סיום" value={candForm.graduation_year} />
            <InfoRow label="ותק" value={candForm.seniority_years ? `${candForm.seniority_years} שנים` : ''} />
            {showExperience && <InfoRow label="שנות ניסיון" value={candForm.years_experience} />}
          </SectionCard>
        )}

        {filledWork.length > 0 && (
          <SectionCard title="ניסיון">
            <div className="space-y-3">
              {filledWork.map((e, i) => (
                <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < filledWork.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--purple-050)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'var(--purple)' }}>{i + 1}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{e.workplace}</p>
                    {e.manager && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>מנהלת: {e.manager}</p>}
                  </div>
                </div>
              ))}
            </div>
            {candForm.past_projects && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>פרויקטים נוספים</p>
                <p style={{ fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{candForm.past_projects}</p>
              </div>
            )}
          </SectionCard>
        )}

        {(candForm.technical_skills || candForm.interpersonal_skills || candForm.special_skills) && (
          <SectionCard title="כישורים">
            <div className="space-y-4">
              {candForm.technical_skills && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>מקצועיים</p>
                  <SkillTags value={candForm.technical_skills} />
                </div>
              )}
              {candForm.interpersonal_skills && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>בין-אישיים</p>
                  <SkillTags value={candForm.interpersonal_skills} />
                </div>
              )}
              {candForm.special_skills && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>מיוחדים</p>
                  <SkillTags value={candForm.special_skills} />
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {(candForm.bio || candForm.personal_note) && (
          <SectionCard title="ביטוי אישי">
            {candForm.bio && <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{candForm.bio}</p>}
            {candForm.personal_note && <p style={{ fontSize: 12.5, marginTop: 10, color: 'var(--ink-3)', lineHeight: 1.5 }}>{candForm.personal_note}</p>}
          </SectionCard>
        )}

        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-4)' }}>
            עדכונים דרך: {candForm.whatsapp_preference ? 'WhatsApp' : 'SMS'}
          </span>
        </div>

      </div>
    )
  }

  /* ══ EDIT MODE ══ */
  const isDone = (id: string) => {
    if (id === 'personal') return !!(profileForm.full_name && candForm.city && candForm.district)
    if (id === 'availability') return !!(candForm.specialization && candForm.availability_status)
    if (id === 'shlichut') return !!(candForm.shlichut_location)
    if (id === 'education') return !!(candForm.college && candForm.academic_level)
    if (id === 'experience') return filledWork.length > 0
    if (id === 'skills') return !!(candForm.technical_skills || candForm.interpersonal_skills)
    if (id === 'expression') return !!(candForm.bio)
    return false
  }

  return (
    <div className="space-y-3">

      <div className="flex items-center justify-between">
        <button onClick={() => setMode('card')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← חזרה לפרופיל
        </button>
        <div style={{ fontSize: 12, fontWeight: 700, color: completion >= 80 ? 'var(--teal-600)' : 'var(--ink-4)' }}>
          {completion}% הושלם
        </div>
      </div>

      {/* completion bar slim */}
      <div style={{ height: 4, borderRadius: 999, background: 'var(--bg-3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${completion}%`, background: 'var(--brand-gradient)', transition: 'width .3s' }} />
      </div>

      <div style={{ borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'linear-gradient(135deg, #EDE8F7 0%, #E0F7F9 100%)', border: '1px solid var(--purple-100)' }}>
        <span style={{ fontSize: 17, lineHeight: 1, marginTop: 1 }}>✨</span>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--purple)', margin: 0 }}>פרופיל מלא — עדיפות בהתאמות</p>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>פרטים אישיים נדרשים. שאר הסקציות אופציונליות.</p>
        </div>
      </div>

      <AccSection title="פרטים אישיים" open={open.has('personal')} onToggle={() => toggle('personal')} done={isDone('personal')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם מלא *">{inp(profileForm.full_name, v => setP('full_name', v))}</Field>
          <Field label="טלפון">{inp(profileForm.phone, v => setP('phone', v), { dir: 'ltr' })}</Field>
          <Field label="שנת לידה">{inp(candForm.birth_year, v => setC('birth_year', v), { type: 'number', min: 1960, max: 2010, dir: 'ltr', placeholder: '1998' })}</Field>
          <Field label="עיר / ישוב">{sel(candForm.city, v => setC('city', v), CITIES, 'בחרי עיר')}</Field>
          <Field label="כתובת">{inp(candForm.address, v => setC('address', v))}</Field>
          <Field label="מחוז">{sel(candForm.district, v => setC('district', v), DISTRICTS)}</Field>
        </div>
        <Field label="מצב משפחתי"><Chips value={candForm.marital_status} onChange={v => setC('marital_status', v)} options={MARITAL_STATUSES} /></Field>
        {candForm.marital_status === 'נשואה' && (
          <Field label="שם נעורים">{inp(candForm.maiden_name, v => setC('maiden_name', v), { placeholder: 'שם משפחה לפני הנישואין' })}</Field>
        )}
      </AccSection>

      <AccSection title="זמינות ותפקיד" open={open.has('availability')} onToggle={() => toggle('availability')} done={isDone('availability')}>
        <Field label="התמחות">{sel(candForm.specialization, v => setC('specialization', v), SPECIALIZATIONS)}</Field>
        <Field label="סטאטוס זמינות"><Chips value={candForm.availability_status} onChange={v => setC('availability_status', v)} options={AVAILABILITY_STATUSES} /></Field>
        <Field label="ממתי את פנויה לעבודה?">{inp(candForm.availability_from, v => setC('availability_from', v), { type: 'date', dir: 'ltr' })}</Field>
      </AccSection>

      <AccSection title="שליחות" open={open.has('shlichut')} onToggle={() => toggle('shlichut')} done={isDone('shlichut')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מיקום שליחות">{inp(candForm.shlichut_location, v => setC('shlichut_location', v), { placeholder: 'שם המוסד / התפקיד' })}</Field>
          <Field label="שנות שליחות">{inp(candForm.shlichut_years, v => setC('shlichut_years', v), { placeholder: '2020–2022' })}</Field>
        </div>
        <Field label="יום לימוד שבועי"><Chips value={candForm.study_day} onChange={v => setC('study_day', v)} options={STUDY_DAYS} /></Field>
      </AccSection>

      <AccSection title="הכשרה אקדמית" open={open.has('education')} onToggle={() => toggle('education')} done={isDone('education')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מכללה / אוניברסיטה">{sel(candForm.college, v => setC('college', v), COLLEGES, 'בחרי מוסד')}</Field>
          <Field label="שנת סיום">{inp(candForm.graduation_year, v => setC('graduation_year', v), { type: 'number', dir: 'ltr', placeholder: '2025' })}</Field>
          <Field label="רמה אקדמית">{sel(candForm.academic_level, v => setC('academic_level', v), ACADEMIC_LEVELS)}</Field>
          {showExperience && <Field label="שנות ניסיון">{inp(candForm.years_experience, v => setC('years_experience', v), { type: 'number', min: 0, dir: 'ltr', placeholder: '0' })}</Field>}
        </div>
        <Field label="ותק (שנים)">{sel(candForm.seniority_years, v => setC('seniority_years', v), SENIORITY_YEARS, 'בחרי')}</Field>
      </AccSection>

      <AccSection title="ניסיון" open={open.has('experience')} onToggle={() => toggle('experience')} done={isDone('experience')}>
        <div className="space-y-3">
          {workHistory.map((entry, i) => (
            <div key={i} className="rounded-[12px] p-4 space-y-3" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--purple)' }}>מקום עבודה {i + 1}</span>
                {workHistory.length > 1 && <button type="button" onClick={() => removeWork(i)} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, color: '#B91C1C', background: '#FEE2E2', border: 'none', cursor: 'pointer' }}>הסרה</button>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="מקום עבודה">{inp(entry.workplace, v => setWork(i, 'workplace', v), { placeholder: 'שם בית הספר / מוסד' })}</Field>
                <Field label="שם מנהלת">{inp(entry.manager, v => setWork(i, 'manager', v), { placeholder: 'שם המנהלת / הממונה' })}</Field>
              </div>
            </div>
          ))}
          {workHistory.length < 4 && (
            <button type="button" onClick={addWork} className="w-full h-10 rounded-[10px] text-[13px] font-semibold border border-dashed transition-all" style={{ borderColor: 'var(--purple)', color: 'var(--purple)', background: '#fff' }}>
              + הוספת מקום עבודה קודם
            </button>
          )}
        </div>
        <Field label="פרויקטים ותפקידים נוספים">
          <textarea value={candForm.past_projects} onChange={e => setC('past_projects', e.target.value)} rows={3}
            className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none" style={inputStyle}
            placeholder="תארי ניסיון, תפקידים, פרויקטים מיוחדים..." />
        </Field>
      </AccSection>

      <AccSection title="כישורים" open={open.has('skills')} onToggle={() => toggle('skills')} done={isDone('skills')}>
        <Field label="כישורים מקצועיים"><TechSkillsInput value={candForm.technical_skills} onChange={v => setC('technical_skills', v)} /></Field>
        <Field label="כישורים בין-אישיים"><MultiChips value={candForm.interpersonal_skills} onChange={v => setC('interpersonal_skills', v)} options={INTERPERSONAL_SKILLS_OPTIONS} /></Field>
        <Field label="כישורים מיוחדים"><MultiChips value={candForm.special_skills} onChange={v => setC('special_skills', v)} options={SPECIAL_SKILLS_OPTIONS} /></Field>
      </AccSection>

      <AccSection title="ביטוי אישי" open={open.has('expression')} onToggle={() => toggle('expression')} done={isDone('expression')}>
        <textarea value={candForm.bio} onChange={e => setC('bio', e.target.value)} rows={4}
          className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none" style={inputStyle}
          placeholder="הוסיפי ביטוי אישי — מה מניע אותך, מה את מביאה איתך, מה חשוב לך בעבודה..." />
        <Field label="הערה אישית">
          <textarea value={candForm.personal_note} onChange={e => setC('personal_note', e.target.value)} rows={2}
            className="w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none resize-none" style={inputStyle}
            placeholder="מידע נוסף שתרצי לשתף..." />
        </Field>
      </AccSection>

      <AccSection title="הגדרות תקשורת" open={open.has('comm')} onToggle={() => toggle('comm')} done>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>ערוץ קבלת עדכונים על משרות וסטאטוס הגשות</p>
        <div className="flex gap-2">
          {[{ label: 'WhatsApp', value: true }, { label: 'SMS', value: false }].map(opt => (
            <button key={String(opt.value)} type="button" onClick={() => setC('whatsapp_preference', opt.value)}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-bold border-2 transition-all"
              style={{ borderColor: candForm.whatsapp_preference === opt.value ? 'var(--teal)' : 'var(--line)', background: candForm.whatsapp_preference === opt.value ? 'var(--teal-050)' : '#fff', color: candForm.whatsapp_preference === opt.value ? 'var(--teal-600)' : 'var(--ink-3)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </AccSection>

      <button onClick={handleSave} disabled={saving}
        className="w-full h-12 rounded-[14px] text-[15px] font-bold text-white transition-all"
        style={{ background: saved ? '#1A7A4A' : 'var(--brand-gradient)', opacity: saving ? 0.7 : 1, boxShadow: saved ? 'none' : 'var(--shadow-purple)' }}>
        {saved ? '✓ נשמר בהצלחה' : saving ? 'שומר...' : 'שמירת שינויים'}
      </button>

    </div>
  )
}
