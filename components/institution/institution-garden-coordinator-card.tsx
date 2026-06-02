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

const ROLES = [
  { value: 'גננת אם',       label: 'גננת אם',       desc: 'הגננת הראשית של הגן', days: false },
  { value: 'גננת שילוב',    label: 'גננת שילוב',    desc: 'תמיכה בילדים עם צרכים מיוחדים', days: false },
  { value: 'גננת משלימה',   label: 'גננת משלימה',   desc: 'משרה חלקית לפי מספר ימים', days: true  },
]

function waLink(phone: string | null, name: string) {
  if (!phone) return '#'
  const p = phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')
  return `https://wa.me/972${p}?text=${encodeURIComponent(`שלום ${name}, `)}`
}

export default function InstitutionGardenCoordinatorCard({
  institutionId,
  name,
  coordinatorName,
  district,
  city,
  phone,
  gardensCount,
  activeJobsCount = 0,
  variant = 'institution',
}: GardenCoordinatorCardProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [days, setDays] = useState<string>('2')
  const firstName = (coordinatorName ?? name).split(' ')[0]

  const roleObj = ROLES.find(r => r.value === selectedRole)
  const jobUrl = selectedRole
    ? `/institution/jobs/new?role=${encodeURIComponent(selectedRole)}${roleObj?.days ? `&days=${days}` : ''}&institution=${institutionId}&type=${encodeURIComponent('גן ילדים')}`
    : '#'

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #FDFCFF 0%, #F5FBF5 100%)',
        borderRadius: 22,
        border: '1px solid var(--line)',
        boxShadow: '0 2px 12px rgba(75,46,131,.08)',
        overflow: 'hidden',
        transition: 'box-shadow 240ms, transform 240ms, border-color 240ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 12px 36px rgba(75,46,131,.16)'
        el.style.transform = 'translateY(-3px)'
        el.style.borderColor = 'var(--purple-200)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 2px 12px rgba(75,46,131,.08)'
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--line)'
      }}
    >
      {/* Brand bar — purple + green for gardens */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #16A34A 100%)' }} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2"
            style={{ background: 'rgba(22,163,74,.10)', color: '#15803D', border: '1px solid rgba(22,163,74,.2)' }}
          >
            <TreePine size={10} strokeWidth={2.5} />
            מדריכה אזורית — גנים
          </span>

          <h3 className="text-[18px] font-extrabold leading-tight mb-0.5"
            style={{ color: 'var(--purple)', letterSpacing: '-.02em' }}>
            {name}
          </h3>

          {coordinatorName && (
            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              {coordinatorName}
            </p>
          )}
        </div>

        {gardensCount !== undefined && (
          <div className="shrink-0 text-center px-3 py-2 rounded-[12px]"
            style={{ background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.15)' }}>
            <div className="text-[22px] font-black leading-none" style={{ color: '#15803D' }}>{gardensCount}</div>
            <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#16A34A' }}>גנים</div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="px-5 pb-3 flex flex-wrap gap-x-4 gap-y-1">
        {(city || district) && (
          <span className="flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>
            <MapPin size={12} strokeWidth={2.5} style={{ color: 'var(--red)' }} />
            {city ?? district}
          </span>
        )}
        {activeJobsCount > 0 && (
          <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
            {activeJobsCount} משרות פעילות
          </span>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--line-soft)', margin: '0 20px' }} />

      {/* Job type selector */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[12px] font-bold mb-2.5" style={{ color: 'var(--ink-3)' }}>בחרי סוג תפקיד לפרסום:</p>
        <div className="flex flex-col gap-2">
          {ROLES.map(role => (
            <label key={role.value}
              className="flex items-start gap-3 p-2.5 rounded-[11px] cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${selectedRole === role.value ? '#16A34A' : 'var(--line)'}`,
                background: selectedRole === role.value ? 'rgba(22,163,74,.06)' : '#fff',
              }}
            >
              <input
                type="radio"
                name={`role-${institutionId}`}
                value={role.value}
                checked={selectedRole === role.value}
                onChange={() => setSelectedRole(role.value)}
                className="mt-0.5 accent-green-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-bold" style={{ color: 'var(--ink)' }}>{role.label}</span>
                  {role.days && selectedRole === role.value && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>ימים:</span>
                      <div className="relative">
                        <select
                          value={days}
                          onChange={e => setDays(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="h-7 px-2 pe-6 rounded-[7px] border text-[12px] font-bold appearance-none outline-none"
                          style={{ borderColor: '#16A34A', color: '#15803D', background: '#F0FDF4' }}
                        >
                          {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute top-1/2 -translate-y-1/2 end-1.5 pointer-events-none" style={{ color: '#16A34A' }} />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[11.5px]" style={{ color: 'var(--ink-4)' }}>{role.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <Link
          href={selectedRole ? jobUrl : '#'}
          onClick={e => { if (!selectedRole) e.preventDefault() }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[14px] font-extrabold no-underline transition-all"
          style={{
            background: selectedRole
              ? 'linear-gradient(135deg, #4B2E83 0%, #16A34A 100%)'
              : '#E5E7EB',
            color: selectedRole ? '#fff' : '#9CA3AF',
            boxShadow: selectedRole ? '0 4px 14px rgba(75,46,131,.28)' : 'none',
            cursor: selectedRole ? 'pointer' : 'not-allowed',
          }}
        >
          {selectedRole ? `פרסמי: ${selectedRole}${roleObj?.days ? ` (${days} ימים)` : ''}` : 'בחרי סוג תפקיד'}
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
      </div>

      {variant === 'admin' && (
        <div className="px-5 pb-4">
          <Link href="/admin/institutions" className="text-[11.5px] font-medium no-underline" style={{ color: 'var(--ink-4)' }}>
            ← לכל המוסדות
          </Link>
        </div>
      )}
    </div>
  )
}
