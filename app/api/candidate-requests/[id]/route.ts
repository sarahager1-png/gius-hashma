import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'
import { logAction } from '@/lib/audit'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode() {
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => CHARS[b % CHARS.length]).join('')
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

// PATCH — admin approves or rejects a candidate request
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action } = await request.json() // 'approve' | 'reject'
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
    // Notify candidate if they have a linked profile
    if (req.profile_id) {
      await service.from('notifications').insert({
        profile_id: req.profile_id,
        type: 'request_rejected',
        title: 'בקשתך לא אושרה',
        body: 'לצערנו בקשת ההצטרפות שלך לא אושרה. לפרטים נוספים ניתן לפנות למנהלת הרשת.',
      })
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

    // Create the candidates row with all rich data
    await service.from('candidates').insert({
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
    })

    await service.from('candidate_requests').update({ status: 'אושרה' }).eq('id', id)
    void logAction(user.id, 'approve_candidate_request', 'candidate_request', id)

    // In-app notification + SMS
    await service.from('notifications').insert({
      profile_id: req.profile_id,
      type: 'request_approved',
      title: 'בקשתך אושרה! 🎉',
      body: `שלום ${req.full_name}, ברוכה הבאה לפלטפורמת הגיוס של רשת חב"ד. תוכלי כעת להיכנס עם Google.`,
    })

    const smsSent = await sendSms(
      req.phone,
      `שלום ${req.full_name}, בקשתך אושרה!\nתוכלי כעת להיכנס למערכת עם Google:\n${APP_URL}/mumedet`
    )

    return NextResponse.json({ ok: true, directApproval: true, smsSent })
  }

  // ── Legacy flow: no profile_id → generate access code ──
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await service.from('access_codes').select('id').eq('code', code).single()
    if (!existing) break
    code = genCode()
  }

  await service.from('access_codes').insert({ code, label: req.full_name })
  await service.from('candidate_requests').update({ status: 'אושרה', access_code: code }).eq('id', id)

  // Send SMS to candidate
  const smsMessage = `שלום ${req.full_name}, בקשתך אושרה!\nקוד הגישה: ${code}\nלהרשמה: ${APP_URL}/register/candidate/activate`
  const smsSent = await sendSms(req.phone, smsMessage)

  // WA fallback link (shown to admin in case SMS fails)
  const digits = req.phone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')
  const phone = `972${digits}`
  const waText = encodeURIComponent(
    `שלום ${req.full_name},\nבקשתך למערכת גיוס והשמה אושרה!\n\nקוד הגישה האישי שלך: *${code}*\n\nלהרשמה: ${APP_URL}/register/candidate/activate\n\nבהצלחה!`
  )
  const waLink = `https://wa.me/${phone}?text=${waText}`

  return NextResponse.json({ ok: true, code, smsSent, waLink })
}
