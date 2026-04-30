'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Copy, Check } from 'lucide-react'

const SQL = `-- הרצי את הפקודות האלה ב-Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New query → הדבקי → Run

-- constraints מעודכנים
UPDATE candidates SET specialization = NULL
  WHERE specialization NOT IN ('יסודי','חט"ב','מתמטיקה','אנגלית','חינוך מיוחד','אחר');
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_specialization_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_specialization_check
  CHECK (specialization IN ('יסודי','חט"ב','מתמטיקה','אנגלית','חינוך מיוחד','אחר'));

UPDATE candidates SET academic_level = NULL
  WHERE academic_level NOT IN ('שנה ב'' - סטאג''','שנה ג'' - סטאג''','תואר ראשון','תואר שני');
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_academic_level_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_academic_level_check
  CHECK (academic_level IN ('שנה ב'' - סטאג''','שנה ג'' - סטאג''','תואר ראשון','תואר שני'));

UPDATE jobs SET specialization = NULL
  WHERE specialization NOT IN ('יסודי','חט"ב','מתמטיקה','אנגלית','חינוך מיוחד','אחר');
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_specialization_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_specialization_check
  CHECK (specialization IN ('יסודי','חט"ב','מתמטיקה','אנגלית','חינוך מיוחד','אחר'));

UPDATE institutions SET institution_type = NULL
  WHERE institution_type NOT IN ('בית חינוך','קהילתי','שלהבות חב"ד');
ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_institution_type_check;
ALTER TABLE institutions ADD CONSTRAINT institutions_institution_type_check
  CHECK (institution_type IN ('בית חינוך','קהילתי','שלהבות חב"ד'));

-- עמודות חדשות
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS placement_type text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_year int;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS maiden_name text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS seniority_years text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS handwriting_font text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_experience int;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_cv boolean DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS placement_location text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS supervisor_name text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS supervisor_phone text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS prev_employer text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS prev_role text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS special_skills text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS technical_skills text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interpersonal_skills text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS personal_note text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability_from date;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability_to date;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experiences jsonb;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS practical_work jsonb;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS shlichut_location text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS shlichut_years text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS past_projects text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS placement_date date;

-- טבלאות חדשות
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  location text, notes text, candidate_confirmed boolean,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='interviews' AND policyname='candidate can view own interviews') THEN
    CREATE POLICY "candidate can view own interviews" ON interviews FOR SELECT USING (
      EXISTS (SELECT 1 FROM applications a JOIN candidates c ON c.id=a.candidate_id WHERE a.id=application_id AND c.profile_id=auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='interviews' AND policyname='institution can view interviews for own jobs') THEN
    CREATE POLICY "institution can view interviews for own jobs" ON interviews FOR SELECT USING (
      EXISTS (SELECT 1 FROM applications a JOIN jobs j ON j.id=a.job_id JOIN institutions i ON i.id=j.institution_id WHERE a.id=application_id AND i.profile_id=auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='interviews' AND policyname='service role can manage interviews') THEN
    CREATE POLICY "service role can manage interviews" ON interviews FOR ALL WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, body text,
  read boolean NOT NULL DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='users can read own notifications') THEN
    CREATE POLICY "users can read own notifications" ON notifications FOR SELECT USING (auth.uid()=profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='users can update own notifications') THEN
    CREATE POLICY "users can update own notifications" ON notifications FOR UPDATE USING (auth.uid()=profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='service role can insert notifications') THEN
    CREATE POLICY "service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה','התקבלה','נדחתה','בוטלה')),
  scheduled_at timestamptz, message text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invitations' AND policyname='candidate can manage own invitations') THEN
    CREATE POLICY "candidate can manage own invitations" ON invitations FOR ALL USING (
      EXISTS (SELECT 1 FROM candidates c WHERE c.id=candidate_id AND c.profile_id=auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invitations' AND policyname='institution can manage own invitations') THEN
    CREATE POLICY "institution can manage own invitations" ON invitations FOR ALL USING (
      EXISTS (SELECT 1 FROM institutions i WHERE i.id=institution_id AND i.profile_id=auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invitations' AND policyname='admins can manage all invitations') THEN
    CREATE POLICY "admins can manage all invitations" ON invitations FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS candidate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL, phone text NOT NULL, email text,
  district text, city text, address text, birth_year int,
  marital_status text, maiden_name text, college text,
  specialization text, academic_level text, graduation_year int,
  seniority_years text, handwriting_font text,
  technical_skills text, interpersonal_skills text,
  past_projects text, personal_note text,
  availability_from date, availability_to date,
  experiences jsonb, practical_work jsonb,
  shlichut_location text, shlichut_years text,
  status text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה','אושרה','נדחתה')),
  access_code text,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE candidate_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='candidate_requests' AND policyname='admins can manage candidate requests') THEN
    CREATE POLICY "admins can manage candidate requests" ON candidate_requests FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='candidate_requests' AND policyname='service role can insert candidate requests') THEN
    CREATE POLICY "service role can insert candidate requests" ON candidate_requests FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, label text,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='access_codes' AND policyname='admins can manage access codes') THEN
    CREATE POLICY "admins can manage access codes" ON access_codes FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
END $$;

SELECT 'Done!' AS result;`

interface Check { col: string; ok: boolean }

export default function MigrationRunner({ checks }: { checks: Check[] }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(SQL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  const needsMigration = checks.some(c => !c.ok)

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-[22px] font-extrabold mb-2" style={{ color: 'var(--purple)' }}>
        מיגריישן מסד נתונים
      </h1>

      {/* Status */}
      <div className="rounded-[14px] border p-5 mb-5 space-y-2" style={{ background: '#fff', borderColor: 'var(--line)' }}>
        <p className="text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-4)' }}>
          סטטוס נוכחי
        </p>
        {checks.map(c => (
          <div key={c.col} className="flex items-center gap-2.5 text-[14px]">
            {c.ok
              ? <CheckCircle size={16} style={{ color: '#1A7A4A' }} />
              : <XCircle size={16} style={{ color: '#DC4F4F' }} />
            }
            <span style={{ color: c.ok ? '#1A7A4A' : '#DC4F4F', fontWeight: c.ok ? 500 : 700 }}>
              {c.col}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>
              {c.ok ? '✓ קיים' : '✗ חסר'}
            </span>
          </div>
        ))}
      </div>

      {needsMigration ? (
        <>
          <div className="rounded-[14px] border p-5 mb-4" style={{ background: '#FDF3E3', borderColor: '#F59E0B' }}>
            <p className="font-bold text-[14px]" style={{ color: '#92400E' }}>
              נדרש מיגריישן — יש עמודות/טבלאות חסרות
            </p>
            <p className="text-[13px] mt-1" style={{ color: '#92400E' }}>
              לחצי "העתקי SQL" → פתחי Supabase SQL Editor → הדביקי → לחצי Run
            </p>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold" style={{ color: 'var(--ink-2)' }}>קוד ה-SQL להרצה:</p>
            <button
              onClick={copy}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold text-white transition-all"
              style={{ background: copied ? '#1A7A4A' : 'var(--purple)' }}
            >
              {copied ? <><Check size={14} />הועתק!</> : <><Copy size={14} />העתקי SQL</>}
            </button>
          </div>

          <div className="rounded-[12px] border overflow-auto" style={{ background: '#1A1830', borderColor: 'var(--line)', maxHeight: 400 }}>
            <pre className="p-4 text-[12px] leading-relaxed" style={{ color: '#E5E3EF', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>
              {SQL}
            </pre>
          </div>

          <div className="mt-4 rounded-[12px] border p-4" style={{ background: '#E0FAFB', borderColor: 'var(--teal-100)' }}>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--teal-700)' }}>
              קישור ישיר לעורך SQL של Supabase:
            </p>
            <a
              href="https://supabase.com/dashboard/project/wluwiicclhzxlliugnqn/sql/new"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-bold underline mt-1 block"
              style={{ color: 'var(--teal-700)' }}
            >
              פתחי SQL Editor ←
            </a>
          </div>
        </>
      ) : (
        <div className="rounded-[14px] border p-8 text-center" style={{ background: '#E4F6ED', borderColor: '#86EFAC' }}>
          <CheckCircle size={36} className="mx-auto mb-3" style={{ color: '#1A7A4A' }} />
          <p className="font-bold text-[16px]" style={{ color: '#1A7A4A' }}>מסד הנתונים מעודכן!</p>
          <p className="text-[13px] mt-1" style={{ color: '#1A7A4A' }}>כל העמודות והטבלאות קיימות</p>
        </div>
      )}
    </div>
  )
}
