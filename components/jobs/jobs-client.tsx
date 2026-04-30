'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import JobCard from './job-card'
import { SPECIALIZATIONS, JOB_TYPES } from '@/lib/constants'
import type { Job } from '@/lib/types'

interface Props {
  jobs: (Job & { institutions?: { institution_name: string; city: string | null; institution_type: string | null } })[]
  appliedJobIds: Set<string>
  candidateId: string | null
  initialSearch?: string
}

export default function JobsClient({ jobs, appliedJobIds, candidateId, initialSearch = '' }: Props) {
  const [search, setSearch] = useState(initialSearch)
  const [specialization, setSpecialization] = useState('הכל')
  const [jobType, setJobType] = useState('הכל')

  const filtered = jobs.filter(job => {
    const text = search.toLowerCase()
    const matchSearch =
      !text ||
      job.title.toLowerCase().includes(text) ||
      job.city?.toLowerCase().includes(text) ||
      job.institutions?.institution_name.toLowerCase().includes(text)
    const matchSpec = specialization === 'הכל' || job.specialization === specialization
    const matchType = jobType === 'הכל' || job.job_type === jobType
    return matchSearch && matchSpec && matchType
  })

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          placeholder="חיפוש לפי שם, עיר, מוסד..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs bg-white"
        />
        <Select value={specialization} onValueChange={setSpecialization}>
          <SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="הכל">כל ההתמחויות</SelectItem>
            {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={jobType} onValueChange={setJobType}>
          <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="הכל">כל הסוגים</SelectItem>
            {JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-16">לא נמצאו משרות</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedJobIds.has(job.id)}
              candidateId={candidateId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
