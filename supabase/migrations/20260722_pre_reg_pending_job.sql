-- מאפשר לאדמין לצרף פרטי משרה ראשונה למוסד שנרשם מראש (pre_registered_institutions),
-- כדי שהמשרה תיפתח אוטומטית ברגע שהמנהלת מתחברת בפעם הראשונה ונוצר לה מוסד אמיתי.
-- לא נוגע במוסד/auth.users/פרופיל עצמם — כל אלה נוצרים רק בהתחברות אמיתית (post-login.ts).

ALTER TABLE pre_registered_institutions
  ADD COLUMN IF NOT EXISTS pending_job jsonb;
