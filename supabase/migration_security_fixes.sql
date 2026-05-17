-- ============================================================
-- Security fixes migration
-- ============================================================

-- 1. Add 'מנהל רשת' to profiles.role CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('מועמדת', 'מוסד', 'מנהלת מערכת', 'אדמין מערכת', 'מנהל רשת'));

-- 2. Performance indexes on frequently-queried columns
CREATE INDEX IF NOT EXISTS idx_applications_status      ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at  ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at  ON applications(updated_at);
CREATE INDEX IF NOT EXISTS idx_candidates_availability  ON candidates(availability_status);
CREATE INDEX IF NOT EXISTS idx_candidates_profile_id    ON candidates(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status              ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at          ON jobs(created_at);
