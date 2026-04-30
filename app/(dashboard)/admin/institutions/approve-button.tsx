'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle, Mail } from 'lucide-react'

interface NotifyInfo { name: string; phone: string }

function buildWaLink(name: string, phone: string) {
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '972')
  const text = encodeURIComponent(`שלום,\nמוסדכם "${name}" אושר במערכת גיוס והשמה חב"ד.\nכעת תוכלו להיכנס למערכת ולפרסם משרות.\nבברכה, צוות המערכת`)
  return `https://wa.me/${normalized}?text=${text}`
}

export default function ApproveButton({ institutionId }: { institutionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notify, setNotify] = useState<NotifyInfo | null>(null)

  async function approve() {
    setLoading(true)
    const res = await fetch(`/api/institutions/${institutionId}/approve`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      if (data.phone) setNotify({ name: data.name, phone: data.phone })
    }
    router.refresh()
  }

  if (notify) {
    return (
      <div className="flex flex-col gap-2 items-end">
        <span className="text-[12px] font-bold" style={{ color: '#15803D' }}>✓ אושר — שלחי הודעה:</span>
        <div className="flex gap-2">
          <a href={buildWaLink(notify.name, notify.phone)} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-white"
            style={{ background: '#25D366' }}>
            <MessageCircle size={13} />וואצאפ
          </a>
          <a href={`mailto:?subject=${encodeURIComponent('אישור הרשמה למערכת גיוס')}&body=${encodeURIComponent(`שלום,\nמוסדכם "${notify.name}" אושר במערכת.\nבברכה`)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-white"
            style={{ background: '#3B82F6' }}>
            <Mail size={13} />מייל
          </a>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={approve}
      disabled={loading}
      size="sm"
      className="text-white shrink-0"
      style={{ background: '#15803D' }}
    >
      {loading ? '...' : 'אשרי'}
    </Button>
  )
}
