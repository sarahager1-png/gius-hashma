-- ============================================================
-- Communication & Automation Layer — דשבורד עתודות לשליחות
-- ============================================================

-- message_templates: configurable WA/SMS templates per event type
CREATE TABLE IF NOT EXISTS message_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text UNIQUE NOT NULL,          -- e.g. 'registration_confirmation'
  name         text NOT NULL,                 -- human label
  channel      text NOT NULL DEFAULT 'both'
                 CHECK (channel IN ('wa', 'sms', 'both')),
  wa_text      text,                          -- WhatsApp body (supports {{var}})
  sms_text     text,                          -- SMS body (supports {{var}})
  variables    text[] DEFAULT '{}',           -- declared variable names
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage templates"
  ON message_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));

-- communication_logs: every outbound message ever sent
CREATE TABLE IF NOT EXISTS communication_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_phone      text,
  recipient_name       text,
  template_key         text,
  channel              text NOT NULL CHECK (channel IN ('wa', 'sms', 'email', 'in_app')),
  message_body         text NOT NULL,
  status               text NOT NULL DEFAULT 'sent'
                         CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  context_type         text,                  -- e.g. 'interview', 'learning_day'
  context_id           uuid,
  sent_by              uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at              timestamptz DEFAULT now()
);

ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read logs"
  ON communication_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));
CREATE POLICY "service can insert logs"
  ON communication_logs FOR INSERT WITH CHECK (true);

-- interview_slots: admin-published slots; candidates book one
CREATE TABLE IF NOT EXISTS interview_slots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date        date NOT NULL,
  slot_time        time NOT NULL,
  duration_minutes int  DEFAULT 30,
  location         text,
  meeting_link     text,
  notes            text,
  is_available     boolean DEFAULT true,
  booked_by        uuid REFERENCES candidates(id) ON DELETE SET NULL,
  booked_at        timestamptz,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage slots"
  ON interview_slots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));
CREATE POLICY "candidates read available slots"
  ON interview_slots FOR SELECT
  USING (
    is_available = true
    OR booked_by = (
      SELECT c.id FROM candidates c WHERE c.profile_id = auth.uid()
    )
  );
CREATE POLICY "candidates can update own booking"
  ON interview_slots FOR UPDATE
  USING (is_available = true)
  WITH CHECK (true);

-- learning_days: learning day events
CREATE TABLE IF NOT EXISTS learning_days (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  day_date            date NOT NULL,
  location            text,
  description         text,
  reflection_prompt   text DEFAULT 'שלחי שיקוף קצר על יום הלימוד — מה לקחת איתך?',
  reflection_sent_at  timestamptz,
  created_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE learning_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage learning days"
  ON learning_days FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));

-- learning_day_attendees: who participated in each day
CREATE TABLE IF NOT EXISTS learning_day_attendees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_day_id uuid NOT NULL REFERENCES learning_days(id) ON DELETE CASCADE,
  candidate_id    uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  attended        boolean DEFAULT true,
  added_at        timestamptz DEFAULT now(),
  UNIQUE(learning_day_id, candidate_id)
);

ALTER TABLE learning_day_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage attendees"
  ON learning_day_attendees FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));

-- learning_day_reflections: reflection status per attendee
CREATE TABLE IF NOT EXISTS learning_day_reflections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_day_id uuid NOT NULL REFERENCES learning_days(id) ON DELETE CASCADE,
  candidate_id    uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'ממתין לשיקוף'
                    CHECK (status IN ('ממתין לשיקוף', 'שיקוף התקבל', 'לא השיב', 'דורש בירור')),
  reflection_text text,
  submitted_at    timestamptz,
  reviewed_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes    text,
  UNIQUE(learning_day_id, candidate_id)
);

ALTER TABLE learning_day_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage reflections"
  ON learning_day_reflections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));
-- Candidates can submit their own reflection
CREATE POLICY "candidates submit own reflection"
  ON learning_day_reflections FOR UPDATE
  USING (
    candidate_id = (
      SELECT c.id FROM candidates c WHERE c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    candidate_id = (
      SELECT c.id FROM candidates c WHERE c.profile_id = auth.uid()
    )
  );
CREATE POLICY "candidates read own reflection"
  ON learning_day_reflections FOR SELECT
  USING (
    candidate_id = (
      SELECT c.id FROM candidates c WHERE c.profile_id = auth.uid()
    )
  );

-- reminders: scheduled outbound reminders
CREATE TABLE IF NOT EXISTS reminders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title             text NOT NULL,
  body              text NOT NULL,
  channel           text NOT NULL DEFAULT 'in_app'
                      CHECK (channel IN ('wa', 'sms', 'in_app')),
  scheduled_at      timestamptz NOT NULL,
  sent_at           timestamptz,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  context_type      text,
  context_id        uuid,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage reminders"
  ON reminders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));

-- ── Seed default templates ────────────────────────────────────────────

INSERT INTO message_templates (key, name, channel, wa_text, sms_text, variables) VALUES
(
  'registration_confirmation',
  'אישור הרשמה',
  'both',
  'שלום {{name}} 👋

ההרשמה שלך לתכנית השליחות התקבלה בהצלחה!

מספר מועמדת: {{candidate_id}}
נציגינו יצרו איתך קשר בקרוב עם הצעדים הבאים.

בברכה,
צוות השליחות',
  'שלום {{name}}, ההרשמה לתכנית השליחות התקבלה! מספר מועמדת: {{candidate_id}}. נהיה איתך בקשר בקרוב.',
  ARRAY['name', 'candidate_id']
),
(
  'interview_invitation',
  'הזמנה לראיון',
  'both',
  'שלום {{name}} 😊

שמחים להזמין אותך לראיון קבלה לתכנית השליחות!

📅 תאריך: {{date}}
🕐 שעה: {{time}}
📍 מיקום: {{location}}

לבחירת זמן נוח: {{slot_link}}

לאישור השיבי *כן*, לביטול השיבי *לא*.

בברכה,
צוות השליחות',
  'הזמנה לראיון קבלה — {{date}} בשעה {{time}}, {{location}}. לבחירת זמן: {{slot_link}}',
  ARRAY['name', 'date', 'time', 'location', 'slot_link']
),
(
  'rejection',
  'דחייה',
  'both',
  'שלום {{name}},

תודה רבה על פנייתך לתכנית השליחות וההשקעה שהשקעת בתהליך.

לאחר בחינת מועמדותך, לא נוכל לקדם אותה בשלב זה.

נשמח לשמוע ממך בהגשות עתידיות.

בברכה,
צוות השליחות',
  'שלום {{name}}, תודה על הגשתך לתכנית השליחות. לאחר שיקול דעת, לא נוכל לקדם את מועמדותך בשלב זה. בברכה, צוות השליחות.',
  ARRAY['name']
),
(
  'acceptance',
  'קבלה',
  'both',
  '🎉 ברכות {{name}}!

שמחים לבשר לך כי *התקבלת* לתכנית השליחות!

הצטרפי למשפחה המדהימה שלנו.
נציגינו יצרו איתך קשר עם פרטים על הצעדים הבאים.

ברכות וסיוע בדרך!
צוות השליחות',
  'ברכות {{name}}! התקבלת לתכנית השליחות! נציגינו יצרו איתך קשר בקרוב עם הצעדים הבאים. ברכות!',
  ARRAY['name']
),
(
  'receipt_reminder',
  'תזכורת קבלה',
  'both',
  'שלום {{name}},

תזכורת: ממתינים לקבלת התשלום עבור *{{item}}*.

💰 סכום: {{amount}} ₪
📅 עד תאריך: {{due_date}}

לתשלום או לשאלות, צרי קשר עם צוות השליחות.

תודה,
צוות השליחות',
  'שלום {{name}}, תזכורת לתשלום עבור {{item}} — {{amount}} ₪, עד {{due_date}}. לפרטים צרי קשר.',
  ARRAY['name', 'item', 'amount', 'due_date']
),
(
  'registration_completed',
  'הרשמה הושלמה',
  'both',
  'שלום {{name}} ✅

ההרשמה שלך הושלמה בהצלחה!

את רשומה לתכנית השליחות לשנת {{year}}.
כל הפרטים שנשלחו: {{details_link}}

נתראה בקרוב!
צוות השליחות',
  'שלום {{name}}, ההרשמה לתכנית השליחות לשנת {{year}} הושלמה! לפרטים: {{details_link}}',
  ARRAY['name', 'year', 'details_link']
),
(
  'learning_day_reflection',
  'בקשת שיקוף יום לימוד',
  'both',
  'שלום {{name}} 📚

יום הלימוד *{{day_title}}* הסתיים.

{{reflection_prompt}}

לשיקוף: {{reflection_link}}

*ממתינים לשמוע ממך עד {{deadline}}*

צוות השליחות',
  'שלום {{name}}, יום הלימוד {{day_title}} הסתיים. שלחי שיקוף קצר: {{reflection_link}} (עד {{deadline}})',
  ARRAY['name', 'day_title', 'reflection_prompt', 'reflection_link', 'deadline']
)
ON CONFLICT (key) DO NOTHING;
