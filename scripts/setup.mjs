/**
 * setup.mjs — הקמת מסד הנתונים + יצירת חשבון מנהל
 * הרצה: node scripts/setup.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://wluwiicclhzxlliugnqn.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXdpaWNjbGh6eGxsaXVnbnFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg4ODAyMiwiZXhwIjoyMDkyNDY0MDIyfQ.sR1g2O5Bq4p01UzSc27YQYGk-xNhSW3JVwBusj7XXZ0'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── 1. יצירת טבלאות דרך Supabase SQL ──────────────────────────
const SCHEMA = readFileSync(join(__dir, '../supabase/schema.sql'), 'utf8')

// שולח כל פקודה SQL בנפרד
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  })
  return res
}

// ── 2. יצירת חשבון מנהל ────────────────────────────────────────
async function createAdmin(email, password, fullName) {
  console.log(`\n📋 יוצר חשבון מנהל: ${email}`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('   ℹ️  המשתמש כבר קיים')
      // נסה לאחזר את ה-ID
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users?.find(u => u.email === email)
      return existing?.id
    }
    throw error
  }

  console.log(`   ✓ נוצר auth user: ${data.user.id}`)
  return data.user.id
}

async function insertProfile(userId, role, fullName) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, role, full_name: fullName }, { onConflict: 'id' })

  if (error) throw error
  console.log(`   ✓ פרופיל נוצר: ${role}`)
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 מתחיל הקמת מסד הנתונים...\n')

  // בדיקה שה-profiles table קיים
  const { error: testError } = await supabase.from('profiles').select('id').limit(1)

  if (testError?.code === '42P01') {
    console.log('⚠️  הטבלאות לא קיימות.')
    console.log('📋 יש להריץ את ה-SQL הבא ב-Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/wluwiicclhzxlliugnqn/sql/new\n')
    console.log('─'.repeat(60))
    console.log('העתיקי את תוכן קובץ: supabase/schema.sql')
    console.log('─'.repeat(60))
    console.log('\nלאחר הרצת ה-SQL — הרץ שוב: node scripts/setup.mjs')
    return
  }

  console.log('✓ טבלאות קיימות\n')

  // יצירת חשבון מנהל ראשי
  const adminId = await createAdmin(
    'admin@giuus.il',
    'Giuus2025!',
    'מנהל מערכת'
  )
  if (adminId) await insertProfile(adminId, 'אדמין מערכת', 'מנהל מערכת')

  // יצירת חשבון מנהל רשת
  const networkId = await createAdmin(
    'network@giuus.il',
    'Network2025!',
    'יאיר פרידק'
  )
  if (networkId) await insertProfile(networkId, 'מנהל רשת', 'יאיר פרידק')

  console.log('\n✅ הקמה הושלמה!\n')
  console.log('─'.repeat(40))
  console.log('פרטי כניסה:')
  console.log('  מנהל רשת:  network@giuus.il  /  Network2025!')
  console.log('  אדמין:     admin@giuus.il     /  Giuus2025!')
  console.log('  כתובת:     https://giuus.vercel.app/login')
  console.log('─'.repeat(40))
}

main().catch(err => {
  console.error('❌ שגיאה:', err.message)
  process.exit(1)
})
