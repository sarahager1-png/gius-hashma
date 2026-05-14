import type { AvailabilityStatus, JobStatus, JobType, Specialization, AcademicLevel } from './types'

export const DISTRICTS = [
  'ירושלים והסביבה',
  'תל אביב והמרכז',
  'חיפה והצפון',
  'נתניה והשרון',
  'פתח תקווה וסביבה',
  'ראשון לציון והדרום',
  'באר שבע והנגב',
  'אשדוד ואשקלון',
  'רחובות והסביבה',
  'הגליל',
  'יהודה ושומרון',
  'אחר',
]

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "מחפשת סטאג'", 'משובצת', 'בוגרת מחפשת משרה', 'פתוחה להצעות', 'לא פעילה',
]

export const JOB_STATUSES: JobStatus[] = ['פעילה', 'מושהית', 'אוישה', 'בוטלה', 'פג תוקפה']

export const JOB_TYPES: JobType[] = ["סטאג'", 'חלקי', 'מלא']

export const SCHOOL_TYPES = [
  'יסודי - קהילתי',
  'יסודי - בית חינוך',
  'יסודי - שלהבות',
  'חט"ב',
  'תיכון',
]

export const SCHOOL_TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'יסודי - קהילתי':   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'יסודי - בית חינוך': { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  'יסודי - שלהבות':   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  'חט"ב':              { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  'תיכון':             { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
}

export const SPECIALIZATIONS: Specialization[] = ['יסודי', 'חט"ב', 'מתמטיקה', 'אנגלית', 'חינוך מיוחד', 'אחר']

export const PLACEMENT_TYPES = ['שיבוץ לשנה', 'שיבוץ קבוע', 'מילוי מקום לחופשת לידה']

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  "שנה ב' - סטאג'",
  "שנה ג' - סטאג'",
  'תואר ראשון',
  'תואר שני',
]

export const ACADEMIC_LEVELS_WITH_EXPERIENCE: AcademicLevel[] = ['תואר ראשון', 'תואר שני']

export const INSTITUTION_TYPES = ['בית חינוך', 'קהילתי', 'שלהבות חב"ד']

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
