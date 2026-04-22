'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AVAILABILITY_STATUSES, SPECIALIZATIONS, ACADEMIC_LEVELS } from '@/lib/constants'
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
    city: candidate?.city ?? '',
    college: candidate?.college ?? '',
    graduation_year: candidate?.graduation_year?.toString() ?? '',
    specialization: candidate?.specialization ?? '',
    academic_level: candidate?.academic_level ?? '',
    availability_status: candidate?.availability_status ?? 'מחפשת סטאג\'',
    bio: candidate?.bio ?? '',
    cv_url: candidate?.cv_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setP(k: string, v: string) { setProfileForm(f => ({ ...f, [k]: v })) }
  function setC(k: string, v: string) { setCandForm(f => ({ ...f, [k]: v })) }

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
        </div>
      </section>

      {/* אקדמי */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">השכלה</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>מכללה</Label>
            <Input value={candForm.college} onChange={e => setC('college', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>שנת סיום</Label>
            <Input type="number" value={candForm.graduation_year} onChange={e => setC('graduation_year', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>התמחות</Label>
            <Select value={candForm.specialization ?? ''} onValueChange={v => setC('specialization', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>רמה אקדמית</Label>
            <Select value={candForm.academic_level ?? ''} onValueChange={v => setC('academic_level', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
              <SelectContent>
                {ACADEMIC_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ביוגרפיה */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-4">אודות</h2>
        <div className="space-y-1">
          <Label>ביוגרפיה קצרה</Label>
          <Textarea value={candForm.bio} onChange={e => setC('bio', e.target.value)} rows={3} />
        </div>
        <div className="space-y-1 mt-4">
          <Label>קישור קורות חיים (URL)</Label>
          <Input value={candForm.cv_url} onChange={e => setC('cv_url', e.target.value)} dir="ltr" placeholder="https://" />
        </div>
      </section>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="text-white"
        style={{ background: '#5B3AAB' }}
      >
        {saved ? 'נשמר ✓' : saving ? 'שומר...' : 'שמירה'}
      </Button>
    </div>
  )
}
