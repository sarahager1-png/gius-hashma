import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendCandidateWelcomeEmail, sendInstitutionPendingEmail } from '@/lib/email'

// PATCH — update phone number only (used by OTP no-phone flow)
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone } = await request.json()
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'phone required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ phone: phone.trim() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { role, full_name, phone, access_code, candidate, institution } = body

  if (!role) {
    return NextResponse.json({ error: 'role required' }, { status: 400 })
  }

  // admin registration requires a secret code
  if (role === 'מנהלת מערכת' || role === 'אדמין מערכת') {
    const expected = process.env.ADMIN_REGISTRATION_CODE
    if (!expected || body.admin_code !== expected) {
      return NextResponse.json({ error: 'קוד מנהל שגוי — פנה למנהל המערכת' }, { status: 403 })
    }
  }

  // upsert profile (handles duplicate if user tried registering before)
  const { error: profileError } = await service
    .from('profiles')
    .upsert({ id: user.id, role, full_name: full_name || null, phone: phone || null })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // insert role-specific row
  if (role === 'מועמדת' && candidate) {
    // re-validate access code server-side before committing registration
    if (!access_code) {
      return NextResponse.json({ error: 'access_code required' }, { status: 400 })
    }
    const { data: codeRow } = await service
      .from('access_codes')
      .select('id, used_by')
      .eq('code', String(access_code).toUpperCase().trim())
      .single()
    if (!codeRow || codeRow.used_by) {
      return NextResponse.json({ error: 'קוד גישה לא תקין או כבר בשימוש' }, { status: 403 })
    }

    // pull rich profile data from the original candidate_request
    const { data: reqData } = await service
      .from('candidate_requests')
      .select('*')
      .eq('access_code', String(access_code).toUpperCase().trim())
      .maybeSingle()

    // whitelist candidate fields to prevent injection
    const { city, college, graduation_year, specialization, academic_level, bio, cv_url } = candidate

    const { error } = await service
      .from('candidates')
      .insert({
        profile_id: user.id,
        // basic fields from activate form
        city: city || reqData?.city || null,
        college: college || reqData?.college || null,
        graduation_year: graduation_year ?? null,
        specialization: specialization || reqData?.specialization || null,
        academic_level: academic_level || reqData?.academic_level || null,
        bio: bio || null,
        cv_url: cv_url || null,
        // rich fields from the original request
        district: reqData?.district || null,
        address: reqData?.address || null,
        birth_year: reqData?.birth_year || null,
        marital_status: reqData?.marital_status || null,
        maiden_name: reqData?.maiden_name || null,
        seniority_years: reqData?.seniority_years || null,
        handwriting_font: reqData?.handwriting_font || null,
        technical_skills: reqData?.technical_skills || null,
        interpersonal_skills: reqData?.interpersonal_skills || null,
        experiences: reqData?.experiences || null,
        shlichut_location: reqData?.shlichut_location || null,
        shlichut_years: reqData?.shlichut_years || null,
        past_projects: reqData?.past_projects || null,
        personal_note: reqData?.personal_note || null,
        availability_from: reqData?.availability_from || null,
        availability_to: reqData?.availability_to || null,
        study_day: reqData?.study_day || null,
        whatsapp_preference: typeof reqData?.whatsapp_preference === 'boolean' ? reqData.whatsapp_preference : true,
      })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // mark code as used atomically
    await service
      .from('access_codes')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('code', String(access_code).toUpperCase().trim())
      .is('used_by', null)

    // link the request to the new profile
    if (reqData) {
      await service.from('candidate_requests').update({ profile_id: user.id }).eq('id', reqData.id)
    }

    sendCandidateWelcomeEmail({
      candidateProfileId: user.id,
      candidateName: full_name || 'מועמדת',
    }).catch(e => console.error('[PROFILE] candidate-welcome email failed:', e))
  }

  if (role === 'מוסד' && institution) {
    const { institution_name, city, address, phone, institution_type, district, whatsapp_preference } = institution
    const { error } = await service
      .from('institutions')
      .insert({
        profile_id: user.id,
        institution_name: institution_name || null,
        city: city || null,
        address: address || null,
        phone: phone || null,
        institution_type: institution_type || null,
        district: district || null,
        whatsapp_preference: typeof whatsapp_preference === 'boolean' ? whatsapp_preference : true,
        // is_approved deliberately omitted — must go through admin approval flow
      })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    sendInstitutionPendingEmail({
      institutionProfileId: user.id,
      institutionName: institution_name || 'המוסד שלכם',
    }).catch(e => console.error('[PROFILE] institution-pending email failed:', e))
  }

  return NextResponse.json({ ok: true })
}
