'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AVAILABILITY_STATUSES, ACADEMIC_LEVELS, ACADEMIC_LEVELS_WITH_EXPERIENCE, DISTRICTS, SPECIALIZATIONS } from '@/lib/constants'
import type { Profile, Candidate } from '@/lib/types'
import { Upload, FileText, ExternalLink } from 'lucide-react'

interface Props {
  profile: Profile
  candidate: Candidate | null
}

export default function ProfileFormClient({ profile, candidate }: Props) {
  const [profileForm, setProfileForm] = useState({
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
  })
  const [candForm, setCandForm] = useState({
    district: candidate?.district ?? '',
    city: candidate?.city ?? '',
    college: candidate?.college ?? '',
    graduation_year: candidate?.graduation_year?.toString() ?? '',
    specialization: candidate?.specialization ?? '',
    academic_level: candidate?.academic_level ?? '',
    years_experience: candidate?.years_experience?.toString() ?? '',
    availability_status: candidate?.availability_status ?? "מחפשת סטאג'",
    availability_from: candidate?.availability_from ?? '',
    availability_to: candidate?.availability_to ?? '',
    technical_skills: candidate?.technical_skills ?? '',
    interpersonal_skills: candidate?.interpersonal_skills ?? '',
    personal_note: candidate?.personal_note ?? '',
    bio: candidate?.bio ?? '',
    cv_url: candidate?.cv_url ?? '',
    whatsapp_preference: candidate?.whatsapp_preference ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError] = useState('')
  const cvInputRef = useRef<HTMLInputElement>(null)

  function setP(k: string, v: string) { setProfileForm(f => ({ ...f, [k]: v })) }
  function setC(k: string, v: string | boolean) { setCandForm(f => ({ ...f, [k]: v })) }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCvUploading(true)
    setCvError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/candidates/cv-upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (res.ok) {
      setC('cv_url', json.url)
    } else {
      setCvError(json.error ?? 'שגיאה בהעלאה')
    }
    setCvUploading(false)
    if (cvInputRef.current) cvInputRef.current.value = ''
  }

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
          graduation_year: candForm.graduation_year ? parseInt(candForm.graduation_year) : null,
          years_experience: candForm.years_experience ? parseInt(candForm.years_experience) : null,
        },
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="space-y-6 bg-white rounded-2xl p-6 shadow-sm">
      {/* פרטים אישיים */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">פרטים אישיים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>שם מלא</Label>
            <Input value={profileForm.full_name} onChange={e => setP('full_name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>טלפון</Label>
            <Input value={profileForm.phone} onChange={e => setP('phone', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>מחוז</Label>
            <Select value={candForm.district} onValueChange={v => setC('district', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי מחוז" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>עיר</Label>
            <Input value={candForm.city} onChange={e => setC('city', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>סטטוס זמינות</Label>
            <Select value={candForm.availability_status} onValueChange={v => setC('availability_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVAILABILITY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>התמחות</Label>
            <Select value={candForm.specialization} onValueChange={v => setC('specialization', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי התמחות" /></SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>זמינות מ-</Label>
            <Input type="date" value={candForm.availability_from} onChange={e => setC('availability_from', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>זמינות עד-</Label>
            <Input type="date" value={candForm.availability_to} onChange={e => setC('availability_to', e.target.value)} dir="ltr" />
          </div>
        </div>
      </section>

      {/* השכלה */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">השכלה</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>מכללה / אוניברסיטה</Label>
            <Input value={candForm.college} onChange={e => setC('college', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>שנת סיום</Label>
            <Input type="number" value={candForm.graduation_year} onChange={e => setC('graduation_year', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>רמה אקדמית</Label>
            <Select value={candForm.academic_level} onValueChange={v => setC('academic_level', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
              <SelectContent>
                {ACADEMIC_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {showExperience && (
            <div className="space-y-1">
              <Label>שנות ותק</Label>
              <Input
                type="number"
                min={0}
                value={candForm.years_experience}
                onChange={e => setC('years_experience', e.target.value)}
                dir="ltr"
                placeholder="מספר שנים"
              />
            </div>
          )}
        </div>
      </section>

      {/* כישורים */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">כישורים</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <Label>כישורים מקצועיים / טכניים</Label>
            <Textarea value={candForm.technical_skills} onChange={e => setC('technical_skills', e.target.value)} rows={2} placeholder="למשל: שליטה בלוח חכם, כלי הוראה דיגיטליים..." />
          </div>
          <div className="space-y-1">
            <Label>כישורים בין-אישיים</Label>
            <Textarea value={candForm.interpersonal_skills} onChange={e => setC('interpersonal_skills', e.target.value)} rows={2} placeholder="למשל: יכולת הכלה, עבודת צוות, יוזמה..." />
          </div>
        </div>
      </section>

      {/* אודות */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">אודות</h2>
        <div className="space-y-1">
          <Label>ביוגרפיה קצרה</Label>
          <Textarea value={candForm.bio} onChange={e => setC('bio', e.target.value)} rows={3} />
        </div>
        <div className="space-y-1 mt-4">
          <Label>הערה אישית</Label>
          <Textarea value={candForm.personal_note} onChange={e => setC('personal_note', e.target.value)} rows={2} placeholder="מידע נוסף שתרצי לשתף..." />
        </div>
        <div className="space-y-1 mt-4">
          <Label>קורות חיים</Label>
          <div className="flex flex-col gap-2">
            {/* Upload button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                disabled={cvUploading}
                className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-semibold border transition-all"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', background: '#fff' }}>
                <Upload size={14} />
                {cvUploading ? 'מעלה...' : 'העלאת קובץ (PDF / Word)'}
              </button>
              {candForm.cv_url && (
                <a href={candForm.cv_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-semibold no-underline"
                  style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                  <FileText size={13} />צפייה <ExternalLink size={11} />
                </a>
              )}
              <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvUpload} />
            </div>
            {cvError && <p className="text-[12px] font-semibold" style={{ color: 'var(--red)' }}>{cvError}</p>}
            {/* Or paste URL */}
            <div>
              <p className="text-[11px] mb-1" style={{ color: 'var(--ink-4)' }}>או הדביקי קישור ישיר:</p>
              <Input value={candForm.cv_url} onChange={e => setC('cv_url', e.target.value)} dir="ltr" placeholder="https://" />
            </div>
          </div>
        </div>
      </section>

      {/* הגדרות תקשורת */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">הגדרות תקשורת</h2>
        <div className="rounded-xl border p-4" style={{ borderColor: '#E9E3FC', background: '#FDFCFF' }}>
          <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>ערוץ קבלת עדכונים</p>
          <p className="text-[12px] mb-3" style={{ color: 'var(--ink-4)' }}>בחרי את הערוץ שדרכו תקבלי עדכונים על משרות חדשות וסטטוס הגשות</p>
          <div className="flex gap-2">
            {[
              { label: 'WhatsApp', value: true },
              { label: 'SMS', value: false },
            ].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setC('whatsapp_preference', opt.value)}
                className="flex-1 h-10 rounded-[10px] text-[13px] font-bold border-2 transition-all"
                style={{
                  borderColor: candForm.whatsapp_preference === opt.value ? 'var(--teal)' : 'var(--line)',
                  background: candForm.whatsapp_preference === opt.value ? 'var(--teal-050)' : '#fff',
                  color: candForm.whatsapp_preference === opt.value ? 'var(--teal-600)' : 'var(--ink-3)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="text-white" style={{ background: 'var(--purple)' }}>
        {saved ? 'נשמר ✓' : saving ? 'שומר...' : 'שמירה'}
      </Button>
    </div>
  )
}
