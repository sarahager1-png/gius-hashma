import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'
import { logAction } from '@/lib/audit'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode() {
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => CHARS[b % CHARS.length]).join('')
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

function buildApprovalWA(name: string, loginLink: string): string {
  const firstName = name.split(' ')[0]
  return (
    `✅ ברוכה הבאה ${firstName}! בקשתך אושרה 🎉\n\n` +
    `אנחנו כאן איתך — בשבילך 💜\n\n` +
    `*איך המערכת עובדת?*\n` +
    `🔍 הפרופיל שלך שמור במאגר — מוסדות יוכלו לראות אותך\n` +
    `📩 כשתפורסם משרה שמתאימה לך — *תקבלי הודעה כאן בוואטסאפ*\n` +
    `🏫 אם מוסד בחר בך — תגיע אלייך *הזמנה לראיון* עם תאריך ושעה מוצעים\n` +
    `✍️ תאשרי את ההזמנה — וייקבע ביניכן קשר ישיר\n` +
    `📊 את כל הגשותיך ותהליכי הראיון תוכלי לעקוב בדשבורד\n\n` +
    `*כל עדכון יגיע אלייך ישירות לוואטסאפ* 📱\n\n` +
    `⚠️ *שלב חשוב — כניסה ראשונה*\n` +
    `כדי שהמועמדות שלך תהיה פעילה, יש להיכנס למערכת עם *Google* לפחות פעם אחת.\n` +
    `ללא כניסה ראשונה — המועמדות אינה תקפה.\n\n` +
    `🔗 לכניסה עם Google:\n${loginLink}\n\n` +
    `בהצלחה! 🌟\n*רשת חינוך חב"ד*`
  )
}

// PATCH — admin approves or rejects a candidate request
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, reason } = await request.json() // action: 'approve' | 'reject', reason?: string
  if (!['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })

  const service = createServiceClient()

  const { data: req } = await service
    .from('candidate_requests')
    .select('*')
    .eq('id', id)
    .single()
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'reject') {
    await service.from('candidate_requests').update({ status: 'נדחתה' }).eq('id', id)
    void logAction(user.id, 'reject_candidate_request', 'candidate_request', id)

    const rejectBody = reason?.trim()
      ? `לצערנו בקשת ההצטרפות שלך לא אושרה. סיבה: ${reason.trim()}`
      : 'לצערנו בקשת ההצטרפות שלך לא אושרה. לפרטים נוספים ניתן לפנות למנהלת הרשת.'

    if (req.profile_id) {
      await service.from('notifications').insert({
        profile_id: req.profile_id,
        type: 'request_rejected',
        title: 'בקשתך לא אושרה',
        body: rejectBody,
      })
    }

    // Send WhatsApp/SMS to candidate with reason
    if (req.phone) {
      const firstName = (req.full_name ?? '').split(' ')[0]
      const waMsg = `שלום ${firstName},\nלצערנו בקשת ההצטרפות שלך למערכת השביל לא אושרה בשלב זה.${reason?.trim() ? `\n\nסיבה: ${reason.trim()}` : ''}\n\nלשאלות ניתן לפנות למנהלת הרשת.\n*רשת חינוך חב"ד*`
      void sendExternal({ phone: req.phone, whatsapp_preference: req.whatsapp_preference ?? true, waMessage: waMsg, smsMessage: waMsg })
    }

    return NextResponse.json({ ok: true })
  }

  // ── APPROVE ──

  // If the candidate submitted via Google OAuth, create profile directly (no access code)
  if (req.profile_id) {
    // Create/update the profile
    await service.from('profiles').upsert({
      id: req.profile_id,
      role: 'מועמדת',
      full_name: req.full_name,
      phone: req.phone,
    })

    // Upsert the candidates row — handles the case where auth callback already created a blank row
    await service.from('candidates').upsert({
      profile_id: req.profile_id,
      city: req.city || null,
      college: req.college || null,
      graduation_year: req.graduation_year || null,
      specialization: req.specialization || null,
      academic_level: req.academic_level || null,
      district: req.district || null,
      address: req.address || null,
      birth_year: req.birth_year || null,
      marital_status: req.marital_status || null,
      maiden_name: req.maiden_name || null,
      seniority_years: req.seniority_years || null,
      handwriting_font: req.handwriting_font || null,
      technical_skills: req.technical_skills || null,
      interpersonal_skills: req.interpersonal_skills || null,
      experiences: req.experiences || null,
      practical_work: req.practical_work || null,
      shlichut_location: req.shlichut_location || null,
      shlichut_years: req.shlichut_years || null,
      past_projects: req.past_projects || null,
      personal_note: req.personal_note || null,
      availability_from: req.availability_from || null,
      availability_to: req.availability_to || null,
      study_day: req.study_day || null,
      work_cities: req.work_cities || null,
      photo_url: req.photo_url || null,
      whatsapp_preference: typeof req.whatsapp_preference === 'boolean' ? req.whatsapp_preference : true,
    }, { onConflict: 'profile_id' })

    await service.from('candidate_requests').update({ status: 'אושרה' }).eq('id', id)
    void logAction(user.id, 'approve_candidate_request', 'candidate_request', id)

    // In-app notification
    await service.from('notifications').insert({
      profile_id: req.profile_id,
      type: 'request_approved',
      title: 'בקשתך אושרה! 🎉',
      body: `שלום ${req.full_name}, ברוכה הבאה לפלטפורמת הגיוס של רשת חב"ד. תוכלי כעת להיכנס עם Google.`,
    })

    // Send welcome message
    const waMsg = buildApprovalWA(req.full_name, `${APP_URL}/login`)
    const smsMsg = `ברוכה הבאה למערכת השביל! הבקשה אושרה. חשוב: יש להיכנס עם Google כדי שהמועמדות תהיה פעילה — ${APP_URL}/login`
    void sendExternal({ phone: req.phone, whatsapp_preference: req.whatsapp_preference ?? true, waMessage: waMsg, smsMessage: smsMsg })

    return NextResponse.json({ ok: true, directApproval: true })
  }

  // ── No profile_id yet ──
  // Create auth user + profile + candidates immediately so the candidate is active right away.

  if (req.email?.trim()) {
    // 1. Create auth user (or find existing)
    let authUserId: string
    const { data: authData } = await service.auth.admin.createUser({
      email: req.email.trim(),
      email_confirm: true,
    })
    if (authData?.user) {
      authUserId = authData.user.id
    } else {
      // User already exists — get their ID via generateLink (works regardless of total user count)
      const { data: linkData } = await service.auth.admin.generateLink({
        type: 'magiclink',
        email: req.email.trim(),
        options: { redirectTo: `${APP_URL}/auth/callback` },
      })
      const existingId = (linkData as { user?: { id?: string } } | null)?.user?.id
      if (!existingId) return NextResponse.json({ error: 'שגיאה ביצירת חשבון' }, { status: 500 })
      authUserId = existingId
    }

    // 2. Create or update profile
    const { data: existingProfile } = await service.from('profiles').select('id').eq('id', authUserId).single()
    if (!existingProfile) {
      await service.from('profiles').insert({
        id: authUserId,
        role: 'מועמדת',
        full_name: req.full_name,
        phone: req.phone,
      })
    }

    // 3. Upsert candidates row — always populate data from the request,
    //    even if a blank row already exists (e.g. from a prior Google sign-in)
    await service.from('candidates').upsert({
      profile_id: authUserId,
      city: req.city || null,
      college: req.college || null,
      graduation_year: req.graduation_year || null,
      specialization: req.specialization || null,
      academic_level: req.academic_level || null,
      district: req.district || null,
      address: req.address || null,
      birth_year: req.birth_year || null,
      marital_status: req.marital_status || null,
      maiden_name: req.maiden_name || null,
      seniority_years: req.seniority_years || null,
      handwriting_font: req.handwriting_font || null,
      technical_skills: req.technical_skills || null,
      interpersonal_skills: req.interpersonal_skills || null,
      experiences: req.experiences || null,
      practical_work: req.practical_work || null,
      shlichut_location: req.shlichut_location || null,
      shlichut_years: req.shlichut_years || null,
      past_projects: req.past_projects || null,
      personal_note: req.personal_note || null,
      availability_from: req.availability_from || null,
      availability_to: req.availability_to || null,
      study_day: req.study_day || null,
      work_cities: req.work_cities || null,
      photo_url: req.photo_url || null,
      whatsapp_preference: typeof req.whatsapp_preference === 'boolean' ? req.whatsapp_preference : true,
    }, { onConflict: 'profile_id' })

    // 3. Mark request as approved and link to profile
    await service.from('candidate_requests').update({ status: 'אושרה', profile_id: authUserId }).eq('id', id)
    void logAction(user.id, 'approve_candidate_request', 'candidate_request', id)

    // 4. In-app notification
    void service.from('notifications').insert({
      profile_id: authUserId,
      type: 'request_approved',
      title: 'בקשתך אושרה! 🎉',
      body: `שלום ${req.full_name}, ברוכה הבאה לפלטפורמת הגיוס של רשת חב"ד. תוכלי כעת להיכנס למערכת.`,
    })

    // 5. Send approval message — direct to Google sign-in
    const loginLink = `${APP_URL}/login`
    const waMsg = buildApprovalWA(req.full_name, loginLink)
    const smsMsg = `ברוכה הבאה למערכת השביל! הבקשה אושרה. חשוב: יש להיכנס עם Google לפחות פעם אחת כדי שהמועמדות תהיה פעילה — ${loginLink}`
    void sendExternal({ phone: req.phone, whatsapp_preference: req.whatsapp_preference ?? true, waMessage: waMsg, smsMessage: smsMsg })

    return NextResponse.json({ ok: true, directApproval: true })
  }

  // No email → access code
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await service.from('access_codes').select('id').eq('code', code).single()
    if (!existing) break
    code = genCode()
  }
  await service.from('access_codes').insert({ code, label: req.full_name })
  await service.from('candidate_requests').update({ access_code: code }).eq('id', id)

  const waCode =
    `✅ שלום ${req.full_name}! בקשתך אושרה 🎉\n\n` +
    `כל פרטי הרישום שלך שמורים במערכת.\n\n` +
    `🔑 קוד הגישה שלך: *${code}*\n` +
    `🔗 כניסה: ${APP_URL}/register/candidate/activate\n\n` +
    `⚠️ *שלב חשוב!*\n` +
    `כדי שהמועמדות שלך תהיה פעילה — יש להיכנס עם הקוד ולהשלים את הרישום.\n` +
    `ללא כניסה ראשונה, המועמדות אינה תקפה.\n\n` +
    `תמיד ניתן לעדכן את הפרופיל לאחר הכניסה 😊`
  const smsCode = `שלום ${req.full_name}, הבקשה אושרה! קוד גישה: ${code} | חשוב: יש להיכנס כדי שהמועמדות תהיה פעילה: ${APP_URL}/register/candidate/activate`
  void sendExternal({ phone: req.phone, whatsapp_preference: req.whatsapp_preference ?? true, waMessage: waCode, smsMessage: smsCode })

  return NextResponse.json({ ok: true })
}
