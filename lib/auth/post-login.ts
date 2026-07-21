import type { SupabaseClient } from '@supabase/supabase-js'
import { notify } from '@/lib/notify'

export function roleHome(role: string): string {
  if (role === 'מועמדת') return '/profile'
  if (role === 'מוסד')   return '/institution/jobs'
  return '/dashboard'
}

/**
 * Shared post-login provisioning: given a freshly-authenticated user, make sure
 * profile/institution/candidate rows exist and return the path to land on.
 * Used by both /auth/callback (Google OAuth) and /auth/confirm (magic link / access code).
 * Returns a redirect path, or an error path like '/login?error=...'.
 */
export async function resolvePostLogin(
  service: SupabaseClient,
  userId: string,
  email: string,
  fullNameFromProvider?: string | null,
): Promise<string> {
  // Check pre_registered FIRST — even if profile exists, institution row may be missing
  const { data: preReg } = await service
    .from('pre_registered_institutions')
    .select('*')
    .eq('email', email)
    .single()

  if (preReg?.status === 'rejected') {
    return '/login?error=institution_rejected'
  }

  if (preReg) {
    // Upsert profile (handles both new and existing profile)
    await service.from('profiles').upsert({
      id:        userId,
      role:      'מוסד',
      full_name: preReg.full_name ?? preReg.institution_name,
      phone:     preReg.phone ?? null,
    }, { onConflict: 'id', ignoreDuplicates: false })

    // Only insert institution if it doesn't exist yet
    const { data: existingInst } = await service
      .from('institutions')
      .select('id')
      .eq('profile_id', userId)
      .single()

    // auto_approve is set only for institutions the admin pre-registered herself
    // (or approved via WhatsApp); self-registered institutions wait for admin approval
    const autoApprove = preReg.auto_approve === true

    if (!existingInst) {
      const { data: newInst, error: instErr } = await service.from('institutions').insert({
        profile_id:       userId,
        institution_name: preReg.institution_name,
        city:             preReg.city,
        district:         preReg.district ?? null,
        school_type:      preReg.school_type ?? null,
        institution_type: preReg.institution_type,
        phone:            preReg.phone ?? null,
        principal_name:   preReg.full_name ?? null,
        is_approved:      autoApprove,
        approved_at:      autoApprove ? new Date().toISOString() : null,
        whatsapp_preference: true,
      }).select('id').single()

      if (instErr) {
        // Don't delete pre_registered so next login will retry
        console.error('[post-login] institution insert failed:', instErr.message, instErr.code)
        return '/login?error=institution_setup'
      }

      if (!autoApprove) {
        const { data: admins } = await service
          .from('profiles')
          .select('id')
          .in('role', ['מנהלת מערכת', 'אדמין מערכת'])
        for (const admin of admins ?? []) {
          await notify({
            profile_id: admin.id,
            type:       'institution_registered',
            title:      `מוסד חדש ממתין לאישור — ${preReg.institution_name}`,
            body:       `${preReg.full_name ?? ''} · ${email}. אישור במסך ניהול המוסדות.`,
            related_id: newInst?.id ?? null,
            url:        '/admin/institutions',
          })
        }
      }

      // משרה שהוכנה מראש (ע"י אדמין) לפני הכניסה הראשונה — נפתחת אוטומטית עכשיו
      if (newInst?.id && preReg.pending_job) {
        const { error: jobErr } = await service
          .from('jobs')
          .insert({ institution_id: newInst.id, ...preReg.pending_job })
        if (jobErr) console.error('[post-login] pending_job insert failed:', jobErr.message)
      }
    }

    await service.from('pre_registered_institutions').delete().eq('email', email)
    return autoApprove ? '/institution/jobs' : '/institution/profile'
  }

  const { data: profile } = await service.from('profiles').select('role').eq('id', userId).single()
  if (profile) {
    return roleHome(profile.role)
  }

  // Check for approved candidate request with this email (non-Google registration flow)
  const { data: approvedReq } = await service
    .from('candidate_requests')
    .select('*')
    .eq('email', email)
    .eq('status', 'אושרה')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (approvedReq) {
    // Always upsert profile + candidates for the current userId,
    // regardless of whether a different auth user was created during approval.
    await service.from('profiles').upsert({
      id:        userId,
      role:      'מועמדת',
      full_name: approvedReq.full_name,
      phone:     approvedReq.phone ?? null,
    }, { onConflict: 'id', ignoreDuplicates: false })

    await service.from('candidates').upsert({
      profile_id:           userId,
      city:                 approvedReq.city || null,
      district:             approvedReq.district || null,
      address:              approvedReq.address || null,
      birth_year:           approvedReq.birth_year || null,
      marital_status:       approvedReq.marital_status || null,
      maiden_name:          approvedReq.maiden_name || null,
      college:              approvedReq.college || null,
      specialization:       approvedReq.specialization || null,
      academic_level:       approvedReq.academic_level || null,
      seniority_years:      approvedReq.seniority_years || null,
      handwriting_font:     approvedReq.handwriting_font || null,
      technical_skills:     approvedReq.technical_skills || null,
      interpersonal_skills: approvedReq.interpersonal_skills || null,
      experiences:          approvedReq.experiences || null,
      practical_work:       approvedReq.practical_work || null,
      shlichut_location:    approvedReq.shlichut_location || null,
      shlichut_years:       approvedReq.shlichut_years || null,
      past_projects:        approvedReq.past_projects || null,
      personal_note:        approvedReq.personal_note || null,
      availability_from:    approvedReq.availability_from || null,
      availability_to:      approvedReq.availability_to || null,
      study_day:            approvedReq.study_day || null,
      work_cities:          approvedReq.work_cities || null,
    }, { onConflict: 'profile_id' })

    await service.from('candidate_requests').update({ profile_id: userId }).eq('id', approvedReq.id)

    // Clean up the email-auth user that was pre-created during approval
    // (its profile_id differs from the userId that just signed in)
    if (approvedReq.profile_id && approvedReq.profile_id !== userId) {
      await service.from('candidates').delete().eq('profile_id', approvedReq.profile_id)
      await service.from('profiles').delete().eq('id', approvedReq.profile_id)
      await service.auth.admin.deleteUser(approvedReq.profile_id)
    }

    return '/profile'
  }

  // Pre-approved admin emails — assigned admin role on first login
  const ADMIN_EMAILS = ['ca@reshetch.org.il', 'ch@reshetch.org.il']
  if (ADMIN_EMAILS.includes(email)) {
    await service.from('profiles').insert({
      id:        userId,
      role:      'מנהלת מערכת',
      full_name: fullNameFromProvider ?? email,
    })
    return '/dashboard'
  }

  // Unknown user — create a minimal 'מועמדת' profile + blank candidates row
  // so they can access the dashboard immediately after completing the form
  await service.from('profiles').insert({
    id:        userId,
    role:      'מועמדת',
    full_name: fullNameFromProvider ?? email,
  })
  await service.from('candidates').insert({ profile_id: userId })

  return '/register/candidate?google=1'
}
