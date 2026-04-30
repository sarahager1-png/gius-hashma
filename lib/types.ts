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
export type Specialization = 'יסודי' | 'חט"ב' | 'מתמטיקה' | 'אנגלית' | 'חינוך מיוחד' | 'אחר'
export type AcademicLevel =
  | "שנה ב' - סטאג'"
  | "שנה ג' - סטאג'"
  | 'תואר ראשון'
  | 'תואר שני'

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
  district: string | null
  city: string | null
  address: string | null
  birth_year: number | null
  marital_status: string | null
  maiden_name: string | null
  college: string | null
  graduation_year: number | null
  specialization: Specialization | null
  academic_level: AcademicLevel | null
  seniority_years: string | null
  handwriting_font: string | null
  technical_skills: string | null
  interpersonal_skills: string | null
  experiences: unknown | null
  practical_work: unknown | null
  shlichut_location: string | null
  shlichut_years: string | null
  past_projects: string | null
  personal_note: string | null
  years_experience: number | null
  availability_status: AvailabilityStatus
  availability_from: string | null
  availability_to: string | null
  study_day: string | null
  placement_location: string | null
  supervisor_name: string | null
  supervisor_phone: string | null
  prev_employer: string | null
  prev_role: string | null
  special_skills: string | null
  has_cv: boolean
  bio: string | null
  cv_url: string | null
  whatsapp_preference: boolean | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Institution {
  id: string
  profile_id: string
  institution_name: string
  district: string | null
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
  job_types?: string[]
  placement_type: string | null
  start_date: string | null
  end_date: string | null
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
  placement_date: string | null
  jobs?: Job
  candidates?: Candidate
}

export interface Notification {
  id: string
  profile_id: string
  type: string
  title: string
  body: string | null
  read: boolean
  related_id: string | null
  created_at: string
}

export interface Invitation {
  id: string
  institution_id: string
  candidate_id: string
  job_id: string
  status: 'ממתינה' | 'התקבלה' | 'נדחתה'
  message: string | null
  scheduled_at: string | null
  created_at: string
  institutions?: Institution
  candidates?: Candidate
  jobs?: Job
}

export interface Interview {
  id: string
  application_id: string
  scheduled_at: string
  location: string | null
  notes: string | null
  candidate_confirmed: boolean | null
  created_at: string
  applications?: Application
}
