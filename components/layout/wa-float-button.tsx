'use client'

import { useState } from 'react'

interface Props {
  phone: string
}

export default function WaFloatButton({ phone }: Props) {
  const [hovered, setHovered] = useState(false)

  const normalized = phone.replace(/\D/g, '')
  const link = `https://wa.me/${normalized}?text=${encodeURIComponent('שלום, יש לי שאלה לגבי מערכת הגיוס')}`

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 52,
        borderRadius: 26,
        background: '#25D366',
        color: '#fff',
        textDecoration: 'none',
        boxShadow: hovered
          ? '0 6px 28px rgba(37,211,102,.55)'
          : '0 4px 18px rgba(37,211,102,.4)',
        padding: '0 18px 0 14px',
        transition: 'all .2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        fontFamily: 'inherit',
      }}
      aria-label="פנייה לתמיכה בוואצאפ"
    >
      {/* WhatsApp SVG icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.532 5.848L.057 23.184a.5.5 0 0 0 .613.637l5.457-1.435A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.073-1.383l-.363-.215-3.767.99 1.006-3.668-.236-.376A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
      <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {hovered ? 'שלחי הודעה' : 'תמיכה'}
      </span>
    </a>
  )
}
