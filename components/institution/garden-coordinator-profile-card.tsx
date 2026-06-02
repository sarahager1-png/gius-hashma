'use client'

import { MapPin, TreePine, Phone, MessageCircle, Mail } from 'lucide-react'

export interface GardenCoordinatorProfileCardProps {
  name: string
  district: string | null
  phone: string | null
  email: string | null
}

function waLink(phone: string | null, name: string) {
  if (!phone) return '#'
  const p = phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')
  return `https://wa.me/972${p}?text=${encodeURIComponent(`שלום ${name}, `)}`
}

export default function GardenCoordinatorProfileCard({
  name,
  district,
  phone,
  email,
}: GardenCoordinatorProfileCardProps) {
  const firstName = name.split(' ')[0]

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid var(--line)',
      boxShadow: '0 2px 8px rgba(75,46,131,.07)',
      overflow: 'hidden',
    }}>
      {/* Brand bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4B2E83 0%, #16A34A 100%)' }} />

      <div className="px-4 pt-4 pb-4">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3"
          style={{ background: 'rgba(22,163,74,.10)', color: '#15803D', border: '1px solid rgba(22,163,74,.2)' }}>
          <TreePine size={10} strokeWidth={2.5} />
          מדריכה אזורית — גנים
        </span>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[16px] font-black"
            style={{ background: 'linear-gradient(135deg, #4B2E83 0%, #16A34A 100%)', color: '#fff' }}>
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold" style={{ color: 'var(--ink)' }}>{name}</h3>
            {district && (
              <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--ink-3)' }}>
                <MapPin size={11} style={{ color: 'var(--red)' }} />{district}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {phone && (
            <div className="flex gap-2">
              <a href={`tel:${phone}`}
                className="flex-1 flex items-center gap-2 h-9 px-3 rounded-[10px] border text-[13px] font-semibold no-underline"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', background: '#fff' }}>
                <Phone size={13} style={{ color: 'var(--ink-4)' }} />{phone}
              </a>
              <a href={waLink(phone, firstName)} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-[10px] border text-[13px] font-semibold no-underline"
                style={{ borderColor: '#BBF7D0', color: '#16A34A', background: '#F0FDF4' }}>
                <MessageCircle size={13} />WA
              </a>
            </div>
          )}
          {email && (
            <a href={`mailto:${email}`}
              className="flex items-center gap-2 h-9 px-3 rounded-[10px] border text-[13px] font-medium no-underline w-full"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}>
              <Mail size={13} style={{ color: 'var(--ink-4)' }} />{email}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
