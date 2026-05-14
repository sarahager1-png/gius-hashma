'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Calendar, Clock, MapPin, Video, User, X } from 'lucide-react'
import type { InterviewSlot } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  slots: InterviewSlot[]
}

type CandidateRef = { id: string; profiles: { id: string; full_name: string | null; phone: string | null } | null } | null

export default function SlotsClient({ slots: initSlots }: Props) {
  const [slots, setSlots] = useState(initSlots)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ slot_date: '', slot_time: '', duration_minutes: 30, location: '', meeting_link: '', notes: '' })

  async function createSlot(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/interview-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) { toast.error('שגיאה ביצירת זמן'); return }
    const [created] = await res.json()
    setSlots(s => [...s, created].sort((a, b) => `${a.slot_date}${a.slot_time}` > `${b.slot_date}${b.slot_time}` ? 1 : -1))
    setShowNew(false)
    setForm({ slot_date: '', slot_time: '', duration_minutes: 30, location: '', meeting_link: '', notes: '' })
    toast.success('זמן ראיון נוצר')
  }

  async function deleteSlot(id: string) {
    if (!confirm('למחוק זמן זה?')) return
    const res = await fetch(`/api/interview-slots/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSlots(s => s.filter(x => x.id !== id))
      toast.success('נמחק')
    }
  }

  const available = slots.filter(s => s.is_available)
  const booked    = slots.filter(s => !s.is_available)

  // Generate .ics calendar placeholder for a slot
  function downloadICS(slot: InterviewSlot) {
    const candidateRef = slot.candidates as unknown as CandidateRef
    const name = candidateRef?.profiles?.full_name ?? 'מועמדת'
    const dtStart = `${slot.slot_date.replace(/-/g, '')}T${slot.slot_time.replace(/:/g, '')}00`
    const end = new Date(`${slot.slot_date}T${slot.slot_time}`)
    end.setMinutes(end.getMinutes() + (slot.duration_minutes ?? 30))
    const dtEnd = end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Giuus//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${slot.id}@giuus`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd.slice(0, 15)}`,
      `SUMMARY:ראיון — ${name}`,
      slot.location ? `LOCATION:${slot.location}` : '',
      slot.meeting_link ? `URL:${slot.meeting_link}` : '',
      slot.notes ? `DESCRIPTION:${slot.notes}` : '',
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `interview-${slot.id}.ics`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl" dir="rtl">
      <div className="flex items-start justify-between mb-6">
        <div className="page-header">
          <h1 className="page-title">זמני ראיון</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{available.length} פנויים · {booked.length} תפוסים</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white"
          style={{ background: 'var(--teal)' }}>
          <Plus size={14} /> זמן חדש
        </button>
      </div>

      {/* Available slots */}
      {available.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-bold mb-3" style={{ color: 'var(--ink-2)' }}>פנויים ({available.length})</h2>
          <div className="grid gap-3">
            {available.map(slot => (
              <SlotRow key={slot.id} slot={slot} onDelete={deleteSlot} onICS={downloadICS} />
            ))}
          </div>
        </section>
      )}

      {/* Booked slots */}
      {booked.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold mb-3" style={{ color: 'var(--ink-2)' }}>תפוסים ({booked.length})</h2>
          <div className="grid gap-3">
            {booked.map(slot => (
              <SlotRow key={slot.id} slot={slot} onDelete={deleteSlot} onICS={downloadICS} />
            ))}
          </div>
        </section>
      )}

      {!slots.length && (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px solid var(--line)' }}>
          <Calendar size={40} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} />
          <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין זמני ראיון — צרי זמן חדש</p>
        </div>
      )}

      {/* New slot modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <h2 className="font-black text-[15px]" style={{ color: 'var(--ink)' }}>זמן ראיון חדש</h2>
              <button onClick={() => setShowNew(false)} style={{ color: 'var(--ink-4)' }}><X size={16} /></button>
            </div>
            <form onSubmit={createSlot} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>תאריך *</label>
                  <input required type="date" value={form.slot_date} onChange={e => setForm(f => ({ ...f, slot_date: e.target.value }))}
                    className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>שעה *</label>
                  <input required type="time" value={form.slot_time} onChange={e => setForm(f => ({ ...f, slot_time: e.target.value }))}
                    className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>משך (דקות)</label>
                <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
                  min={15} max={120} className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>מיקום</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="כתובת / Zoom / טלפון"
                  className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" style={{ borderColor: 'var(--line)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>קישור פגישה</label>
                <input value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none" dir="ltr" style={{ borderColor: 'var(--line)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>ביטול</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white"
                  style={{ background: 'var(--teal)' }}>צור</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SlotRow({ slot, onDelete, onICS }: {
  slot: InterviewSlot
  onDelete: (id: string) => void
  onICS: (slot: InterviewSlot) => void
}) {
  const booked = !slot.is_available
  const candidateRef = slot.candidates as unknown as { id: string; profiles: { id: string; full_name: string | null } | null } | null

  return (
    <div className="rounded-2xl bg-white p-4 flex items-center gap-4"
      style={{ border: `1px solid ${booked ? '#BBF7D0' : 'var(--line)'}`, boxShadow: 'var(--shadow-card)' }}>
      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl shrink-0"
        style={{ background: booked ? '#F0FDF4' : 'var(--bg-2)' }}>
        <Calendar size={14} style={{ color: booked ? '#15803D' : 'var(--ink-3)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-[13px]" style={{ color: 'var(--ink)' }}>{formatDate(slot.slot_date)}</span>
          <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--ink-3)' }}>
            <Clock size={11} />{slot.slot_time.slice(0, 5)} · {slot.duration_minutes} דק׳
          </span>
          {slot.location && (
            <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--ink-3)' }}>
              <MapPin size={11} />{slot.location}
            </span>
          )}
          {slot.meeting_link && (
            <a href={slot.meeting_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--teal)' }}>
              <Video size={11} />קישור
            </a>
          )}
        </div>
        {booked && candidateRef?.profiles?.full_name && (
          <div className="flex items-center gap-1 mt-1 text-[12px]" style={{ color: '#15803D' }}>
            <User size={11} />{candidateRef.profiles.full_name}
            {slot.booked_at && ` · ${formatDate(slot.booked_at)}`}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {booked && (
          <button onClick={() => onICS(slot)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold"
            style={{ background: '#EFF6FF', color: '#1E40AF' }}>
            📅 לוח שנה
          </button>
        )}
        <span className="text-[11px] font-bold px-2 py-1 rounded-full"
          style={{ background: booked ? '#F0FDF4' : '#FFF7ED', color: booked ? '#15803D' : '#C2410C' }}>
          {booked ? 'תפוס' : 'פנוי'}
        </span>
        {!booked && (
          <button onClick={() => onDelete(slot.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  )
}
