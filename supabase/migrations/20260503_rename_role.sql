-- Rename role: מנהל רשת → מנהלת מערכת
-- Run this once in the Supabase SQL Editor

-- 1. Drop the CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Rename existing rows
UPDATE profiles SET role = 'מנהלת מערכת' WHERE role = 'מנהל רשת';

-- 3. Re-add CHECK constraint with new role name
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('מועמדת', 'מוסד', 'מנהלת מערכת', 'אדמין מערכת'));
