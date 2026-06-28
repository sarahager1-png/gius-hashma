'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import JobCard from './job-card'
import { SPECIALIZATIONS, JOB_TYPES } from '@/lib/constants'
import type { Job } from '@/lib/types'

type JobWithInst = Job & { institutions?: { institution_name: string; city: string | null } }

interface Props {
  jobs: JobWithInst[]
  appliedJobIds: Set<string>
  candidateId: string | null
  candidateHasPhone?: boolean
  candidateDistrict?: string | null
  candidateWorkCities?: string[] | null
  initialSearch?: string
}

function matchScore(job: JobWithInst, district?: string | null, workCities?: string[] | null): number {
  let s = 0
  if (workCities?.length && job.city && workCities.includes(job.city)) s += 3
  if (district && job.district === district) s += 2
  return s
}

// האם המשרה נמצאת באזור של המועמדת — עיר מרשימת ערי-העבודה או אותו מחוז
function inArea(job: JobWithInst, district?: string | null, workCities?: string[] | null): boolean {
  if (workCities?.length && job.city && workCities.includes(job.city)) return true
  if (district && job.district === district) return true
  return false
}

export default function JobsClient({ jobs, appliedJobIds, candidateId, candidateHasPhone = true, candidateDistrict, candidateWorkCities, initialSearch = '' }: Props) {
  const [search, setSearch] = useState(initialSearch)
  const [specialization, setSpecialization] = useState('הכל')
  const [jobType, setJobType] = useState('הכל')
  const [showAllCountry, setShowAllCountry] = useState(false)

  const hasLocationData = !!(candidateDistrict || candidateWorkCities?.length)

  // כמה משרות באזור המועמדת מול סך הארץ (לפני סינוני חיפוש/התמחות)
  const areaCount = hasLocationData
    ? jobs.filter(j => inArea(j, candidateDistrict, candidateWorkCities)).length
    : jobs.length
  // ברירת מחדל: מציגות רק משרות באזור. אם אין למועמדת נתון אזורי — מציגות הכל ממילא.
  const restrictToArea = hasLocationData && !showAllCountry

  const filtered = jobs
    .filter(job => {
      if (restrictToArea && !inArea(job, candidateDistrict, candidateWorkCities)) return false
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
    .sort((a, b) =>
      matchScore(b, candidateDistrict, candidateWorkCities) -
      matchScore(a, candidateDistrict, candidateWorkCities)
    )

  return (
    <div>
      {hasLocationData && (
        <div className="flex items-center gap-3 mb-5 flex-wrap rounded-[14px] px-4 py-3"
          style={{ background: '#fff', border: '1px solid #EAE6F5' }}>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--purple)' }}>
            {showAllCountry
              ? `מציגה משרות מכל הארץ (${jobs.length})`
              : `מציגה משרות באזור שלך (${areaCount})`}
          </span>
          <button
            type="button"
            onClick={() => setShowAllCountry(v => !v)}
            className="text-[13px] font-bold underline underline-offset-2 transition-opacity hover:opacity-70 mr-auto"
            style={{ color: 'var(--cyan)' }}
            aria-pressed={showAllCountry}
          >
            {showAllCountry
              ? `הצג רק את האזור שלי (${areaCount})`
              : `הצג משרות בכל הארץ (${jobs.length})`}
          </button>
        </div>
      )}

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
        <div className="text-center py-16">
          <p className="text-gray-400">
            {restrictToArea ? 'אין כרגע משרות פתוחות באזור שלך' : 'לא נמצאו משרות'}
          </p>
          {restrictToArea && jobs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllCountry(true)}
              className="mt-3 text-[14px] font-bold underline underline-offset-2 hover:opacity-70"
              style={{ color: 'var(--cyan)' }}
            >
              הצג משרות בכל הארץ ({jobs.length})
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedJobIds.has(job.id)}
              candidateId={candidateId}
              candidateHasPhone={candidateHasPhone}
              isMatched={hasLocationData && matchScore(job, candidateDistrict, candidateWorkCities) > 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
