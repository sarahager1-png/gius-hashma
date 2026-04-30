'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AVAILABILITY_STATUSES, ACADEMIC_LEVELS, ACADEMIC_LEVELS_WITH_EXPERIENCE, DISTRICTS, SPECIALIZATIONS } from '@/lib/constants'
import type { Profile, Candidate } from '@/lib/types'

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

  function setP(k: string, v: string) { setProfileForm(f => ({ ...f, [k]: v })) }
  function setC(k: string, v: string | boolean) { setCandForm(f => ({ ...f, [k]: v })) }

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
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
          <Label>קישור קורות חיים (URL)</Label>
          <Input value={candForm.cv_url} onChange={e => setC('cv_url', e.target.value)} dir="ltr" placeholder="https://" />
        </div>
      </section>

      {/* הגדרות תקשורת */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">הגדרות תקשורת</h2>
        <div className="flex items-center justify-between rounded-xl border p-4"
          style={{ borderColor: '#E9E3FC', background: '#FDFCFF' }}>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>קבלת עדכונים בוואטסאפ</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>עדכונים על משרות חדשות והגשות ישלחו לנייד</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={candForm.whatsapp_preference}
            onClick={() => setC('whatsapp_preference', !candForm.whatsapp_preference)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            style={{
              background: candForm.whatsapp_preference ? 'var(--teal)' : '#D1D5DB',
            }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              style={{
                transform: candForm.whatsapp_preference ? 'translateX(-6px)' : 'translateX(-26px)',
              }}
            />
          </button>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="text-white" style={{ background: 'var(--purple)' }}>
        {saved ? 'נשמר ✓' : saving ? 'שומר...' : 'שמירה'}
      </Button>
    </div>
  )
}
