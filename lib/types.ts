export type UserRole = 'מועמדת' | 'מוסד' | 'מנהלת מערכת' | 'אדמין מערכת' | 'מנהל רשת'

export type AvailabilityStatus =
  | "מחפשת סטאג'"
  | 'משובצת'
  | 'בוגרת מחפשת משרה'
  | 'פתוחה להצעות'
  | 'לא פעילה'

export type JobStatus = 'פעילה' | 'מושהית' | 'אוישה' | 'בוטלה' | 'פג תוקפה'
export type JobType = "סטאג'" | 'חלקי' | 'מלא'
export type ApplicationStatus = 'ממתינה' | 'נצפתה' | 'התקבלה' | 'נדחתה' | 'בוטלה'
export type Specialization = 'גן ילדים' | 'יסודי' | 'חט"ב' | 'תיכון' | 'מתמטיקה' | 'אנגלית' | 'חינוך מיוחד' | 'תושב"ע' | 'יעוץ' | 'אחר'
export type AcademicLevel =
  | "שנה ב' - סטאג'"
  | "שנה ג' - סטאג'"
  | "שנה ד' - סטאג'"
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
  school_type: string | null
  principal_name: string | null
  is_approved: boolean
  approved_at: string | null
  approved_by: string | null
  created_at: string
  profiles?: Profile
}

export interface InstitutionLead {
  id: string
  institution_name: string
  city: string | null
  phone: string | null
  institution_type: string | null
  created_at: string
  registered_profile_id: string | null
}

export interface Job {
  id: string
  institution_id: string
  title: string
  description: string | null
  city: string | null
  district: string | null
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
  role: string | null
  classes: string | null
  hours: string | null
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
  url: string | null
  created_at: string
}

export interface Invitation {
  id: string
  institution_id: string
  candidate_id: string
  job_id: string
  status: 'ממתינה' | 'התקבלה' | 'נדחתה' | 'פגה תוקף'
  message: string | null
  scheduled_at: string | null
  created_at: string
  institutions?: Institution
  candidates?: Candidate
  jobs?: Job
}

export interface Inquiry {
  id: string
  candidate_id: string
  institution_id: string
  job_id: string | null
  message: string
  status: 'ממתינה' | 'נצפתה' | 'נענתה'
  institution_reply: string | null
  replied_at: string | null
  created_at: string
  candidates?: Candidate
  institutions?: Institution
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

// ── Communication Layer ───────────────────────────────────────────────

export interface MessageTemplate {
  id: string
  key: string
  name: string
  channel: 'wa' | 'sms' | 'both'
  wa_text: string | null
  sms_text: string | null
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunicationLog {
  id: string
  recipient_profile_id: string | null
  recipient_phone: string | null
  recipient_name: string | null
  template_key: string | null
  channel: 'wa' | 'sms' | 'email' | 'in_app'
  message_body: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  context_type: string | null
  context_id: string | null
  sent_by: string | null
  sent_at: string
}

export interface InterviewSlot {
  id: string
  slot_date: string
  slot_time: string
  duration_minutes: number
  location: string | null
  meeting_link: string | null
  notes: string | null
  is_available: boolean
  booked_by: string | null
  booked_at: string | null
  created_by: string | null
  created_at: string
  candidates?: Candidate
}

export interface Reminder {
  id: string
  target_profile_id: string | null
  title: string
  body: string
  channel: 'wa' | 'sms' | 'in_app'
  scheduled_at: string
  sent_at: string | null
  status: 'pending' | 'sent' | 'cancelled' | 'failed'
  context_type: string | null
  context_id: string | null
  created_by: string | null
  created_at: string
}
