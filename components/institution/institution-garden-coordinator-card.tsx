'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, TreePine, Phone, MessageCircle, ChevronDown } from 'lucide-react'

export interface GardenCoordinatorCardProps {
  institutionId: string
  name: string
  coordinatorName: string | null
  district: string | null
  city: string | null
  phone: string | null
  gardensCount?: number
  activeJobsCount?: number
  variant?: 'admin' | 'institution'
}

const AGE_GROUPS = ['גיל 3', 'קדם חובה', 'חובה']
const GARDEN_TYPES = ['ממ"ד', 'ממ', 'שיבוץ']
const ROLES = [
  { value: 'גננת אם',     days: false },
  { value: 'גננת שילוב',  days: false },
  { value: 'גננת משלימה', days: true  },
]

function waLink(phone: string | null, name: string) {
  if (!phone) return '#'
  const p = phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')
  return `https://wa.me/972${p}?text=${encodeURIComponent(`שלום ${name}, `)}`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-bold mb-1" style={{ color: 'var(--ink-3)' }}>{label}</label>
      {children}
    </div>
  )
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt} type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
          style={{
            border: `1.5px solid ${value === opt ? '#16A34A' : 'var(--line)'}`,
            background: value === opt ? 'rgba(22,163,74,.08)' : '#fff',
            color: value === opt ? '#15803D' : 'var(--ink-3)',
          }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function InstitutionGardenCoordinatorCard({
  institutionId,
  name,
  coordinatorName,
  district,
  city: defaultCity,
  phone,
  gardensCount,
  activeJobsCount = 0,
  variant = 'institution',
}: GardenCoordinatorCardProps) {
  const [gardenName, setGardenName] = useState('')
  const [city, setCity] = useState(defaultCity ?? '')
  const [ageGroup, setAgeGroup] = useState('')
  const [gardenType, setGardenType] = useState('')
  const [role, setRole] = useState('')
  const [days, setDays] = useState('2')

  const firstName = (coordinatorName ?? name).split(' ')[0]
  const roleObj = ROLES.find(r => r.value === role)

  const isValid = gardenName.trim() && city.trim() && ageGroup && gardenType && role

  const jobUrl = isValid
    ? `/institution/jobs/new?` + new URLSearchParams({
        title: `${role} — גן ${gardenName}`,
        role,
        city,
        garden_name: gardenName,
        age_group: ageGroup,
        garden_type: gardenType,
        ...(roleObj?.days ? { days } : {}),
        institution: institutionId,
        type: 'גן ילדים',
      }).toString()
    : '#'

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 22,
        border: '1px solid var(--line)',
        boxShadow: '0 2px 12px rgba(75,46,131,.08)',
        overflow: 'hidden',
      }}
    >
      {/* Brand bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #16A34A 100%)' }} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3"
        style={{ background: 'linear-gradient(160deg,#FDFCFF 0%,#F5FBF5 100%)' }}>
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2"
            style={{ background: 'rgba(22,163,74,.10)', color: '#15803D', border: '1px solid rgba(22,163,74,.2)' }}>
            <TreePine size={10} strokeWidth={2.5} />מדריכה אזורית — גנים
          </span>
          <h3 className="text-[17px] font-extrabold leading-tight mb-0.5"
            style={{ color: 'var(--purple)', letterSpacing: '-.02em' }}>{name}</h3>
          {coordinatorName && (
            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>{coordinatorName}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {(defaultCity || district) && (
              <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--ink-4)' }}>
                <MapPin size={11} style={{ color: 'var(--red)' }} />{defaultCity ?? district}
              </span>
            )}
            {activeJobsCount > 0 && (
              <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                {activeJobsCount} משרות
              </span>
            )}
          </div>
        </div>
        {gardensCount !== undefined && (
          <div className="shrink-0 text-center px-3 py-2 rounded-[12px]"
            style={{ background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.15)' }}>
            <div className="text-[22px] font-black leading-none" style={{ color: '#15803D' }}>{gardensCount}</div>
            <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#16A34A' }}>גנים</div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--line-soft)' }} />

      {/* Form */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-[12.5px] font-bold" style={{ color: 'var(--ink-2)' }}>פרסום משרה לגן:</p>

        {/* Row: שם גן + עיר */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="שם הגן *">
            <input value={gardenName} onChange={e => setGardenName(e.target.value)}
              placeholder='גן "שם הגן"'
              className="w-full h-9 rounded-[9px] border px-3 text-[13px] outline-none"
              style={{ borderColor: gardenName ? '#16A34A' : 'var(--line)', background: '#fff', color: 'var(--ink)' }} />
          </Field>
          <Field label="עיר *">
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="עיר"
              className="w-full h-9 rounded-[9px] border px-3 text-[13px] outline-none"
              style={{ borderColor: city ? '#16A34A' : 'var(--line)', background: '#fff', color: 'var(--ink)' }} />
          </Field>
        </div>

        {/* שכבת גיל */}
        <Field label="שכבת גיל *">
          <Chips options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} />
        </Field>

        {/* סוג */}
        <Field label="סוג *">
          <Chips options={GARDEN_TYPES} value={gardenType} onChange={setGardenType} />
        </Field>

        {/* תפקיד */}
        <Field label="תפקיד *">
          <div className="flex flex-col gap-1.5">
            {ROLES.map(r => (
              <label key={r.value}
                className="flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-all"
                style={{
                  border: `1.5px solid ${role === r.value ? '#16A34A' : 'var(--line)'}`,
                  background: role === r.value ? 'rgba(22,163,74,.05)' : '#fff',
                }}>
                <input type="radio" name={`role-${institutionId}`} value={r.value}
                  checked={role === r.value} onChange={() => setRole(r.value)}
                  className="accent-green-600 shrink-0" />
                <span className="flex-1 text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{r.value}</span>
                {r.days && role === r.value && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>ימים:</span>
                    <div className="relative">
                      <select value={days} onChange={e => setDays(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="h-7 px-2 pe-6 rounded-[7px] border text-[12px] font-bold appearance-none outline-none"
                        style={{ borderColor: '#16A34A', color: '#15803D', background: '#F0FDF4' }}>
                        {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute top-1/2 -translate-y-1/2 end-1.5 pointer-events-none" style={{ color: '#16A34A' }} />
                    </div>
                  </div>
                )}
              </label>
            ))}
          </div>
        </Field>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        <Link href={jobUrl} onClick={e => { if (!isValid) e.preventDefault() }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[14px] font-extrabold no-underline transition-all"
          style={{
            background: isValid ? 'linear-gradient(135deg, #4B2E83 0%, #16A34A 100%)' : '#E5E7EB',
            color: isValid ? '#fff' : '#9CA3AF',
            boxShadow: isValid ? '0 4px 14px rgba(75,46,131,.28)' : 'none',
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}>
          {isValid
            ? `פרסמי: ${role}${roleObj?.days ? ` (${days} ימים)` : ''} — ${gardenName}`
            : 'מלאי את כל השדות'}
        </Link>

        {phone && (
          <div className="flex gap-2">
            <a href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[10px] border text-[12.5px] font-semibold no-underline"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
              <Phone size={13} />{phone}
            </a>
            <a href={waLink(phone, firstName)} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-[10px] border text-[13px] font-semibold no-underline"
              style={{ borderColor: '#BBF7D0', color: '#16A34A', background: '#F0FDF4' }}>
              <MessageCircle size={13} />WA
            </a>
          </div>
        )}

        {variant === 'admin' && (
          <Link href="/admin/institutions" className="text-[11.5px] font-medium no-underline text-center"
            style={{ color: 'var(--ink-4)' }}>← לכל המוסדות</Link>
        )}
      </div>
    </div>
  )
}
