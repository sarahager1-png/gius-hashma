export type UserRole = 'מועמדת' | 'מוסד' | 'מנהל רשת' | 'אדמין מערכת'

export type AvailabilityStatus =
  | "מחפשת סטאג'"
  | 'משובצת'
  | 'בוגרת מחפשת משרה'
  | 'פתוחה להצעות'
  | 'לא פעילה'

export type JobStatus = 'פעילה' | 'מושהית' | 'אוישה' | 'בוטלה' | 'פג תוקפה'
export type JobType = "סטאג'" | 'חלקי' | 'מלא'
export type ApplicationStatus = 'ממתינה' | 'נצפתה' | 'התקבלה' | 'נדחתה' | 'בוטלה'
export type Specialization = 'גן ילדים' | 'יסודי' | 'שניהם'
export type AcademicLevel = "סטאג'" | 'בוגרת' | 'מנוסה'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  created_at: string
}

export interface Candidate {
  id: string
  profile_id: string
  city: string | null
  college: string | null
  graduation_year: number | null
  specialization: Specialization | null
  academic_level: AcademicLevel | null
  availability_status: AvailabilityStatus
  bio: string | null
  cv_url: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Institution {
  id: string
  profile_id: string
  institution_name: string
  city: string | null
  address: string | null
  phone: string | null
  institution_type: string | null
  is_approved: boolean
  approved_at: string | null
  approved_by: string | null
  created_at: string
  profiles?: Profile
}

export interface Job {
  id: string
  institution_id: string
  title: string
  description: string | null
  city: string | null
  specialization: Specialization | null
  job_type: JobType | null
  status: JobStatus
  expires_at: string | null
  created_at: string
  updated_at: string
  institutions?: Institution
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  status: ApplicationStatus
  cover_letter: string | null
  institution_notes: string | null
  applied_at: string
  updated_at: string
  jobs?: Job
  candidates?: Candidate
}
