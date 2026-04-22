'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SPECIALIZATIONS, JOB_TYPES } from '@/lib/constants'

interface Props {
  institutionId: string
  job?: {
    id: string
    title: string
    description: string | null
    city: string | null
    specialization: string | null
    job_type: string | null
    expires_at: string | null
  }
}

export default function JobFormClient({ institutionId, job }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: job?.title ?? '',
    description: job?.description ?? '',
    city: job?.city ?? '',
    specialization: job?.specialization ?? '',
    job_type: job?.job_type ?? '',
    expires_at: job?.expires_at ? job.expires_at.substring(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      institution_id: institutionId,
      title: form.title,
      description: form.description || null,
      city: form.city || null,
      specialization: form.specialization || null,
      job_type: form.job_type || null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    }

    const res = job
      ? await fetch(`/api/jobs/${job.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    setSaving(false)
    if (!res.ok) {
      setError('שגיאה בשמירה')
      return
    }
    router.push('/institution/jobs')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <div className="space-y-1">
        <Label>כותרת המשרה</Label>
        <Input value={form.title} onChange={e => set('title', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>עיר</Label>
          <Input value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>סוג משרה</Label>
          <Select value={form.job_type} onValueChange={v => set('job_type', v)}>
            <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>התמחות</Label>
          <Select value={form.specialization} onValueChange={v => set('specialization', v)}>
            <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
            <SelectContent>
              {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>תפוגה</Label>
          <Input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} dir="ltr" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>תיאור המשרה</Label>
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="text-white" style={{ background: '#5B3AAB' }}>
          {saving ? 'שומר...' : job ? 'עדכן משרה' : 'פרסמי משרה'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>ביטול</Button>
      </div>
    </form>
  )
}
