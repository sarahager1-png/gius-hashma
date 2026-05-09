'use client'

import Link from 'next/link'
import type { Candidate } from '@/lib/types'

interface Props {
  candidate: Candidate & { profiles?: { full_name?: string | null } }
}

const FIELDS: (keyof Candidate)[] = [
  'availability_from',
  'availability_to',
  'bio',
  'technical_skills',
  'interpersonal_skills',
  'cv_url',
  'city',
  'district',
  'specialization',
  'academic_level',
]

// Full name and phone are on profile, passed via profiles relation
function calcScore(candidate: Props['candidate']): number {
  let score = 0
  const fullName = candidate.profiles?.full_name
  if (fullName) score++
  // phone is on profile — treat cv_url or bio as proxy; fields list covers the rest
  for (const field of FIELDS) {
    if (candidate[field]) score++
  }
  // phone — check via profiles? We use 12 as max but full_name + 10 fields = 11
  // add cv_url already counted, so score max = 11 (close enough — scale to 100)
  const MAX = 11
  return Math.round((score / MAX) * 100)
}

export default function ProfileCompletion({ candidate }: Props) {
  const pct = calcScore(candidate)

  const barColor =
    pct >= 80 ? '#22C55E'
    : pct >= 50 ? '#F59E0B'
    : '#EF4444'

  const bgColor =
    pct >= 80 ? '#F0FDF4'
    : pct >= 50 ? '#FFFBEB'
    : '#FFF5F5'

  const borderColor =
    pct >= 80 ? '#86EFAC'
    : pct >= 50 ? '#FDE68A'
    : '#FCA5A5'

  if (pct >= 80) return null // hide when complete enough

  return (
    <div
      className="rounded-[14px] border mb-4 px-5 py-4 flex items-center gap-4"
      style={{ background: bgColor, borderColor, boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
            הפרופיל שלך {pct}% שלם
          </span>
          <span
            className="text-[13px] font-extrabold"
            style={{ color: barColor }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'rgba(0,0,0,.08)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <p className="text-[12px] mt-1.5" style={{ color: 'var(--ink-3)' }}>
          פרופיל מלא מגביר את הסיכוי להתאמה למשרה מתאימה
        </p>
      </div>
      <Link
        href="/profile"
        className="shrink-0 text-[13px] font-bold px-3.5 py-2 rounded-[10px] no-underline transition-all"
        style={{ background: barColor + '22', color: barColor }}
      >
        השלימי פרופיל ←
      </Link>
    </div>
  )
}
