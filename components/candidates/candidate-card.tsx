import { MapPin, GraduationCap, Phone } from 'lucide-react'
import type { Candidate, Profile } from '@/lib/types'

interface Props {
  candidate: Candidate & { profiles?: Profile }
}

const STATUS_COLORS: Record<string, string> = {
  "מחפשת סטאג'": 'var(--purple)',
  'משובצת': '#6B7280',
  'בוגרת מחפשת משרה': 'var(--teal)',
  'פתוחה להצעות': '#15803D',
  'לא פעילה': '#9CA3AF',
}

export default function CandidateCard({ candidate }: Props) {
  const profile = candidate.profiles
  const color = STATUS_COLORS[candidate.availability_status] ?? '#6B7280'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-gray-800">{profile?.full_name ?? 'ללא שם'}</div>
          {candidate.college && (
            <div className="text-sm text-gray-500">{candidate.college}</div>
          )}
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ background: color + '18', color }}
        >
          {candidate.availability_status}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {candidate.city && (
          <span className="flex items-center gap-1"><MapPin size={13} />{candidate.city}</span>
        )}
        {candidate.specialization && (
          <span className="flex items-center gap-1"><GraduationCap size={13} />{candidate.specialization}</span>
        )}
        {candidate.academic_level && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{candidate.academic_level}</span>
        )}
      </div>

      {candidate.bio && (
        <p className="text-sm text-gray-600 line-clamp-2">{candidate.bio}</p>
      )}

      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-100">
        {profile?.phone && (
          <a href={`tel:${profile.phone}`} className="flex items-center gap-1 text-sm" style={{ color: 'var(--teal)' }}>
            <Phone size={13} />{profile.phone}
          </a>
        )}
        {candidate.cv_url && (
          <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="text-xs mr-auto" style={{ color: 'var(--purple)' }}>
            קורות חיים ↗
          </a>
        )}
      </div>
    </div>
  )
}
