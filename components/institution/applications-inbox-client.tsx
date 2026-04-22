'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { APPLICATION_STATUS_COLORS, JOB_STATUS_COLORS } from '@/lib/constants'
import type { Application, Candidate, Profile } from '@/lib/types'

type AppWithDetails = Application & {
  candidates: (Candidate & { profiles: Profile }) | null
}

interface Props {
  applications: AppWithDetails[]
  jobId: string
  jobStatus: string
}

const APP_STATUSES = ['ממתינה', 'נצפתה', 'התקבלה', 'נדחתה', 'בוטלה']
const JOB_STATUSES = ['פעילה', 'מושהית', 'אוישה', 'בוטלה', 'פג תוקפה']

export default function ApplicationsInboxClient({ applications: initial, jobId, jobStatus: initialJobStatus }: Props) {
  const [apps, setApps] = useState(initial)
  const [jobStatus, setJobStatus] = useState(initialJobStatus)

  async function updateAppStatus(appId: string, status: string) {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: status as Application['status'] } : a))
    }
  }

  async function updateJobStatus(status: string) {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setJobStatus(status)
  }

  return (
    <div>
      {/* Job status controls */}
      <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl p-4 shadow-sm">
        <span className="text-sm text-gray-600 font-medium">סטטוס משרה:</span>
        <Select value={jobStatus} onValueChange={updateJobStatus}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full mr-auto"
          style={{ background: (JOB_STATUS_COLORS[jobStatus] ?? '#6B7280') + '18', color: JOB_STATUS_COLORS[jobStatus] ?? '#6B7280' }}
        >
          {apps.length} הגשות
        </span>
      </div>

      {apps.length === 0 ? (
        <p className="text-center text-gray-400 py-12">עדיין אין הגשות למשרה זו</p>
      ) : (
        <div className="space-y-3">
          {apps.map(app => {
            const candidate = app.candidates
            const profile = candidate?.profiles
            const color = APPLICATION_STATUS_COLORS[app.status] ?? '#6B7280'

            return (
              <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-800">{profile?.full_name ?? 'ללא שם'}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {candidate?.city && <span>{candidate.city} · </span>}
                      {candidate?.college && <span>{candidate.college} · </span>}
                      {candidate?.academic_level}
                    </div>
                    {profile?.phone && (
                      <a href={`tel:${profile.phone}`} className="text-sm mt-1 block" style={{ color: '#00B4CC' }}>
                        {profile.phone}
                      </a>
                    )}
                    {candidate?.cv_url && (
                      <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="text-xs mt-1 block" style={{ color: '#5B3AAB' }}>
                        קורות חיים ↗
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Select value={app.status} onValueChange={v => updateAppStatus(app.id, v)}>
                      <SelectTrigger
                        className="h-8 text-xs w-28 font-medium border-0"
                        style={{ background: color + '18', color }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-400">{formatDate(app.applied_at)}</span>
                  </div>
                </div>
                {app.cover_letter && (
                  <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100 line-clamp-2">{app.cover_letter}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
