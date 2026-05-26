import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError || !session) {
    return NextResponse.redirect(`${origin}/login?error=exchange`)
  }

  const userId = session.user.id
  const email  = session.user.email?.toLowerCase() ?? ''

  const service = createServiceClient()

  // Check pre_registered FIRST — even if profile exists, institution row may be missing
  const { data: preReg } = await service
    .from('pre_registered_institutions')
    .select('*')
    .eq('email', email)
    .single()

  if (preReg?.status === 'rejected') {
    return NextResponse.redirect(`${origin}/login?error=institution_rejected`)
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

    if (!existingInst) {
      const { error: instErr } = await service.from('institutions').insert({
        profile_id:       userId,
        institution_name: preReg.institution_name,
        city:             preReg.city,
        district:         preReg.district ?? null,
        school_type:      preReg.school_type ?? null,
        institution_type: preReg.institution_type,
        phone:            preReg.phone ?? null,
        principal_name:   preReg.full_name ?? null,
        is_approved:      true,
        approved_at:      new Date().toISOString(),
        whatsapp_preference: true,
      })

      if (instErr) {
        // Don't delete pre_registered so next login will retry
        console.error('[auth/callback] institution insert failed:', instErr.message, instErr.code)
        return NextResponse.redirect(`${origin}/login?error=institution_setup`)
      }
    }

    await service.from('pre_registered_institutions').delete().eq('email', email)
    return NextResponse.redirect(`${origin}/institution/jobs`)
  }

  const { data: profile } = await service.from('profiles').select('role').eq('id', userId).single()
  if (profile) {
    return NextResponse.redirect(`${origin}${roleHome(profile.role)}`)
  }

  // Check for approved candidate request with this email (non-Google registration flow)
  const { data: approvedReq } = await service
    .from('candidate_requests')
    .select('*')
    .eq('email', email)
    .eq('status', 'אושרה')
    .is('profile_id', null)
    .single()

  if (approvedReq) {
    await service.from('profiles').insert({
      id:        userId,
      role:      'מועמדת',
      full_name: approvedReq.full_name,
      phone:     approvedReq.phone ?? null,
    })
    await service.from('candidates').insert({
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
    })
    // Link the profile so this request isn't reused
    await service.from('candidate_requests').update({ profile_id: userId }).eq('id', approvedReq.id)
    return NextResponse.redirect(`${origin}/profile`)
  }

  // Unknown Google user — create a minimal 'מועמדת' profile + blank candidates row
  // so they can access the dashboard immediately after completing the form
  await service.from('profiles').insert({
    id:        userId,
    role:      'מועמדת',
    full_name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
  })
  await service.from('candidates').insert({ profile_id: userId })

  return NextResponse.redirect(`${origin}/register/candidate?google=1`)
}

function roleHome(role: string): string {
  if (role === 'מועמדת') return '/profile'
  if (role === 'מוסד')   return '/institution/jobs'
  return '/dashboard'
}
