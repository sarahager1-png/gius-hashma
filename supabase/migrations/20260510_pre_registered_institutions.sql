-- טבלת מוסדות רשומים מראש (לפני כניסה ראשונה עם Google)
-- כשמוסד נכנס עם Google — הcallback מאתר לפי מייל ויוצר פרופיל אוטומטית

CREATE TABLE IF NOT EXISTS pre_registered_institutions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        UNIQUE NOT NULL,
  institution_name text        NOT NULL,
  full_name        text,
  city             text,
  institution_type text        CHECK (institution_type IN ('בית חינוך', 'קהילתי', 'שלהבות חב"ד')),
  created_at       timestamptz DEFAULT now()
);

-- service role בלבד
ALTER TABLE pre_registered_institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON pre_registered_institutions USING (false);
