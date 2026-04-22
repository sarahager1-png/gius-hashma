'use client'

import { useState } from 'react'
import { MapPin, Briefcase, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Job } from '@/lib/types'

interface Props {
  job: Job & { institutions?: { institution_name: string; city: string | null; institution_type: string | null } }
  applied: boolean
  candidateId: string | null
}

export default function JobCard({ job, applied: initialApplied, candidateId }: Props) {
  const [applied, setApplied] = useState(initialApplied)
  const [applying, setApplying] = useState(false)

  async function apply() {
    if (!candidateId || applied) return
    setApplying(true)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id, candidate_id: candidateId }),
    })
    setApplying(false)
    if (res.ok) setApplied(true)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 text-base">{job.title}</h3>
          {job.job_type && (
            <Badge variant="secondary" className="shrink-0 text-xs">{job.job_type}</Badge>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">{job.institutions?.institution_name}</div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {job.city && (
          <span className="flex items-center gap-1"><MapPin size={13} />{job.city}</span>
        )}
        {job.specialization && (
          <span className="flex items-center gap-1"><GraduationCap size={13} />{job.specialization}</span>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatDate(job.created_at)}</span>
        {candidateId ? (
          <Button
            size="sm"
            disabled={applied || applying}
            onClick={apply}
            className="text-white text-xs"
            style={{ background: applied ? '#15803D' : '#5B3AAB' }}
          >
            {applied ? 'הגשה נשלחה ✓' : applying ? '...' : 'הגשי מועמדות'}
          </Button>
        ) : (
          <a href="/register/candidate" className="text-xs" style={{ color: '#5B3AAB' }}>
            הרשמי להגשה
          </a>
        )}
      </div>
    </div>
  )
}
