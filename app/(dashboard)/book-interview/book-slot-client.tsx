'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Video, CheckCircle2 } from 'lucide-react'
import type { InterviewSlot } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  slots: InterviewSlot[]
  mySlot: InterviewSlot | null
}

export default function BookSlotClient({ slots, mySlot: initMySlot }: Props) {
  const [mySlot, setMySlot] = useState(initMySlot)
  const [booking, setBooking] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState(new Set<string>())

  async function book(slotId: string) {
    setBooking(slotId)
    try {
      const res = await fetch(`/api/interview-slots/${slotId}/book`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookedSlots(s => new Set([...s, slotId]))
      toast.success('הזמן נקבע! תקבלי אישור בקרוב.')
      window.location.reload()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setBooking(null)
    }
  }

  if (mySlot) {
    return (
      <div className="p-4 md:p-8 max-w-lg" dir="rtl">
        <div className="page-header mb-8">
          <h1 className="page-title">ראיון קבלה</h1>
          <span className="brand-line" />
        </div>
        <div className="rounded-2xl p-6 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: '#15803D' }} />
          <h2 className="text-[17px] font-black mb-2" style={{ color: '#14532D' }}>הראיון שלך קבוע!</h2>
          <div className="space-y-2 mt-4 text-[14px]" style={{ color: '#166534' }}>
            <p className="flex items-center justify-center gap-2">
              <Calendar size={15} />{formatDate(mySlot.slot_date)}
            </p>
            <p className="flex items-center justify-center gap-2">
              <Clock size={15} />{mySlot.slot_time.slice(0, 5)} · {mySlot.duration_minutes} דקות
            </p>
            {mySlot.location && (
              <p className="flex items-center justify-center gap-2"><MapPin size={15} />{mySlot.location}</p>
            )}
            {mySlot.meeting_link && (
              <a href={mySlot.meeting_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 underline" style={{ color: '#15803D' }}>
                <Video size={15} />קישור לפגישה
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      <div className="page-header mb-8">
        <h1 className="page-title">בחרי זמן לראיון</h1>
        <span className="brand-line" />
        <p className="page-subtitle">בחרי את הזמן המתאים לך ביותר</p>
      </div>

      {!slots.length ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: '1px solid var(--line)' }}>
          <Calendar size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} />
          <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין זמנים פנויים כרגע</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>צרי קשר עם הצוות לתיאום</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {slots.map(slot => {
            const isBooked = bookedSlots.has(slot.id)
            return (
              <div key={slot.id}
                className="rounded-2xl bg-white p-4 flex items-center gap-4"
                style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl shrink-0"
                  style={{ background: 'var(--bg-2)' }}>
                  <Calendar size={16} style={{ color: 'var(--teal)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px]" style={{ color: 'var(--ink)' }}>
                    {formatDate(slot.slot_date)}
                  </div>
                  <div className="flex items-center flex-wrap gap-3 mt-1 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                    <span className="flex items-center gap-1"><Clock size={11} />{slot.slot_time.slice(0, 5)} · {slot.duration_minutes} דק׳</span>
                    {slot.location && <span className="flex items-center gap-1"><MapPin size={11} />{slot.location}</span>}
                    {slot.meeting_link && <span className="flex items-center gap-1"><Video size={11} />פגישה מקוונת</span>}
                  </div>
                </div>

                <button
                  onClick={() => book(slot.id)}
                  disabled={booking === slot.id || isBooked}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-60 shrink-0"
                  style={{ background: isBooked ? '#15803D' : 'var(--teal)' }}>
                  {isBooked ? '✓ נקבע' : booking === slot.id ? '...' : 'בחרי זמן זה'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
