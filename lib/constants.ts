import type { AvailabilityStatus, JobStatus, JobType, Specialization, AcademicLevel } from './types'

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "מחפשת סטאג'", 'משובצת', 'בוגרת מחפשת משרה', 'פתוחה להצעות', 'לא פעילה',
]

export const JOB_STATUSES: JobStatus[] = ['פעילה', 'מושהית', 'אוישה', 'בוטלה', 'פג תוקפה']

export const JOB_TYPES: JobType[] = ["סטאג'", 'חלקי', 'מלא']

export const SPECIALIZATIONS: Specialization[] = ['יסודי']

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  "שנה ב' - סטאג'",
  "שנה ג' - סטאג'",
  'תואר ראשון',
  'תואר שני',
]

export const ACADEMIC_LEVELS_WITH_EXPERIENCE: AcademicLevel[] = ['תואר ראשון', 'תואר שני']

export const INSTITUTION_TYPES = ['בית ספר יסודי']

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  ממתינה: 'ממתינה',
  נצפתה: 'נצפתה',
  התקבלה: 'התקבלה',
  נדחתה: 'נדחתה',
  בוטלה: 'בוטלה',
}

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  ממתינה: '#B45309',
  נצפתה: '#1E40AF',
  התקבלה: '#15803D',
  נדחתה: '#B91C1C',
  בוטלה: '#6B7280',
}

export const JOB_STATUS_COLORS: Record<string, string> = {
  פעילה: '#15803D',
  מושהית: '#B45309',
  אוישה: '#5B3AAB',
  בוטלה: '#B91C1C',
  'פג תוקפה': '#6B7280',
}
