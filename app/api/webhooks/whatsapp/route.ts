import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseWebhookMessages, parseIntent, sendWA } from '@/lib/whatsapp'

interface WaSession {
  id: string
  state: string
  data: Record<string, string>
  [key: string]: unknown
}

interface JobListing {
  id: string
  title: string
  city?: string | null
  job_type?: string | null
  specialization?: string | null
  description?: string | null
  institutions?: { institution_name?: string | null } | null
  status?: string
}

interface AppListing {
  status: string
  jobs?: { title?: string; city?: string | null; institutions?: { institution_name?: string | null } | null } | null
}

// ── POST: Receive incoming messages from Green API ───────────────────
export async function POST(request: Request) {
  const secret = process.env.GREENAPI_WEBHOOK_SECRET?.trim().replace(/^﻿/, '')
  if (secret) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') ?? request.headers.get('x-webhook-token')
    if (token !== secret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ ok: true }) }

  const messages = parseWebhookMessages(body)
  if (!messages.length) return NextResponse.json({ ok: true })

  const service = createServiceClient()

  for (const msg of messages) {
    await processMessage(service, msg.from, msg.text, msg.name)
  }

  return NextResponse.json({ ok: true })
}

// ── Message processor ─────────────────────────────────────────────────
async function processMessage(
  service: ReturnType<typeof createServiceClient>,
  phone: string,
  text: string,
  name: string,
) {
  void service.from('wa_log').insert({ direction: 'inbound', phone, message: text })

  // Look up active session
  const { data: session } = await service
    .from('wa_sessions')
    .select('*')
    .eq('phone', phone)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const intent = parseIntent(text)

  // ── Active session: continue flow ────────────────────────────────
  if (session) {
    switch (session.session_type) {
      case 'create_job':         return handleJobCreationFlow(service, session, phone, text)
      case 'confirm_interview':  return handleInterviewConfirmation(service, session, phone, intent)
      case 'confirm_invitation': return handleInvitationConfirmation(service, session, phone, intent)
      case 'register_candidate': return handleRegistrationFlow(service, session, phone, text, intent)
      case 'browse_jobs':        return handleBrowseJobsFlow(service, session, phone, text, intent)
      case 'apply_job':          return handleApplyFlow(service, session, phone, intent)
      case 'relevance_check':    return handleRelevanceCheck(service, session, phone, text, intent)
      case 'admin_approve':      return handleAdminApprove(service, session, phone, intent)
      case 'lead_info_request':  return handleLeadInfoRequest(service, session, phone, intent)
    }
  }

  // ── Look up profile by phone ──────────────────────────────────────
  const localPhone = phone.replace(/^972/, '0')
  const { data: profile } = await service
    .from('profiles')
    .select('id, role, full_name')
    .or(`phone.eq.${localPhone},phone.eq.${phone}`)
    .maybeSingle()

  // ── Unknown user → only respond to explicit registration/greeting ────
  if (!profile) {
    if (intent === 'register' || intent === 'help') {
      // Don't re-send if already sent recently (active session exists)
      const { data: existingSession } = await service
        .from('wa_sessions')
        .select('id')
        .eq('phone', phone)
        .eq('session_type', 'register_candidate')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      if (existingSession) return

      await service.from('wa_sessions').insert({
        phone,
        session_type: 'register_candidate',
        state: 'awaiting_name',
        data: { wa_name: name },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      await sendWA(phone,
        `שלום${name ? ` ${name.split(' ')[0]}` : ''}! 👋\n` +
        `ברוכה הבאה למערכת גיוס והשמה של רשת אהלי יוסף יצחק.\n\n` +
        `לא מצאתי אותך במערכת. בואי נרשום אותך תוך דקה 🙂\n\n` +
        `*מה שמך המלא?*`
      )
    }
    // כל שאר ההודעות מאנשים לא מוכרים — מתעלמים
    return
  }

  const firstName = profile.full_name?.split(' ')[0] ?? ''

  // ── Candidate flows ───────────────────────────────────────────────
  if (profile.role === 'מועמדת') {
    if (intent === 'jobs') {
      return startBrowseJobs(service, phone, profile.id)
    }
    if (intent === 'my_applications') {
      return showMyApplications(service, phone, profile.id, firstName)
    }
    if (intent === 'help' || intent === 'unknown') {
      await sendWA(phone,
        `שלום ${firstName}! 👋\n\n` +
        `📋 *מה אפשר לעשות:*\n\n` +
        `• *משרות* — צפייה במשרות פעילות\n` +
        `• *הגשות* — סטטוס ההגשות שלי\n` +
        `• *כן / לא* — אישור או דחיית הזמנה/ראיון\n` +
        `• *עזרה* — תפריט זה\n\n` +
        `לכניסה מלאה: giuus.vercel.app`
      )
      return
    }
  }

  // ── Institution / Admin flows ─────────────────────────────────────
  if (['מנהלת מערכת', 'אדמין מערכת', 'מוסד'].includes(profile.role)) {
    if (intent === 'new_job') {
      await service.from('wa_sessions').insert({
        phone,
        session_type: 'create_job',
        state: 'awaiting_title',
        data: { profile_id: profile.id, role: profile.role },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      await sendWA(phone, `שלום ${firstName}! 👋\nניצור משרה חדשה יחד.\n\n*מה שם המשרה?*`)
      return
    }
    if (intent === 'help' || intent === 'unknown') {
      await sendWA(phone,
        `שלום ${firstName}! 👋\n\n` +
        `📋 *מה אפשר לעשות:*\n\n` +
        `• *משרה חדשה* — פרסום משרה חדשה\n` +
        `• *כן / לא* — אישור או דחיית ראיון\n` +
        `• *עזרה* — תפריט זה\n\n` +
        `לכניסה מלאה: giuus.vercel.app`
      )
      return
    }
  }

  // Fallback
  await sendWA(phone,
    `קיבלתי 🙏\nשלחי *עזרה* לתפריט, או כנסי ל: giuus.vercel.app`
  )
}

// ── Registration flow (new candidate) ────────────────────────────────
async function handleRegistrationFlow(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  text: string,
  intent: ReturnType<typeof parseIntent>,
) {
  const data = session.data as Record<string, string>
  const state = session.state as string

  const updateSession = (newState: string, newData: Record<string, string>) =>
    service.from('wa_sessions').update({
      state: newState,
      data: { ...data, ...newData },
    }).eq('id', session.id)

  if (['ביטול', 'cancel'].includes(text.trim().toLowerCase())) {
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, 'ההרשמה בוטלה. כשתרצי להצטרף — שלחי *שלום*.')
    return
  }

  if (state === 'awaiting_name') {
    await updateSession('awaiting_city', { full_name: text })
    await sendWA(phone, `✓ שם: *${text}*\n\n*מאיזו עיר את?*`)
    return
  }

  if (state === 'awaiting_city') {
    await updateSession('awaiting_specialization', { city: text })
    await sendWA(phone,
      `✓ עיר: *${text}*\n\n*מה התחום שלך?*\n` +
      `1️⃣ יסודי\n2️⃣ חט"ב\n3️⃣ מתמטיקה\n4️⃣ אנגלית\n5️⃣ חינוך מיוחד\n6️⃣ אחר`
    )
    return
  }

  if (state === 'awaiting_specialization') {
    const specs: Record<string, string> = {
      '1': 'יסודי', '2': 'חט"ב', '3': 'מתמטיקה',
      '4': 'אנגלית', '5': 'חינוך מיוחד', '6': 'אחר',
    }
    const spec = specs[text.trim()] ?? (Object.values(specs).includes(text) ? text : null)
    if (!spec) {
      await sendWA(phone, 'נא לשלוח מספר בין 1 ל-6:')
      return
    }
    await updateSession('awaiting_academic_level', { specialization: spec })
    await sendWA(phone,
      `✓ תחום: *${spec}*\n\n*מה הרמה האקדמית שלך?*\n` +
      `1️⃣ שנה ב' — סטאג'\n2️⃣ שנה ג' — סטאג'\n3️⃣ תואר ראשון\n4️⃣ תואר שני`
    )
    return
  }

  if (state === 'awaiting_academic_level') {
    const levels: Record<string, string> = {
      "1": "שנה ב' - סטאג'", "2": "שנה ג' - סטאג'",
      "3": 'תואר ראשון', "4": 'תואר שני',
    }
    const level = levels[text.trim()] ?? (Object.values(levels).includes(text) ? text : null)
    if (!level) {
      await sendWA(phone, 'נא לשלוח מספר בין 1 ל-4:')
      return
    }
    await updateSession('confirm', { academic_level: level })
    await sendWA(phone,
      `📋 *סיכום פרטייך:*\n\n` +
      `• שם: ${data.full_name}\n` +
      `• עיר: ${data.city}\n` +
      `• תחום: ${data.specialization}\n` +
      `• רמה: ${level}\n\n` +
      `לאישור ורישום שלחי *כן*, לביטול שלחי *ביטול*`
    )
    return
  }

  if (state === 'confirm') {
    if (intent !== 'confirm') {
      await service.from('wa_sessions').delete().eq('id', session.id)
      await sendWA(phone, 'ההרשמה בוטלה. כשתרצי — שלחי *שלום*.')
      return
    }

    // Create auth user + profile + candidate
    const localPhone = phone.replace(/^972/, '0')
    const email = `${phone}@wa.giuus.app`

    // Create user in auth
    const { data: authUser, error: authErr } = await service.auth.admin.createUser({
      email,
      phone: localPhone,
      user_metadata: { full_name: data.full_name },
      email_confirm: true,
    })

    if (authErr || !authUser.user) {
      await sendWA(phone, '❌ אירעה שגיאה בהרשמה. נסי דרך האתר: giuus.vercel.app/register')
      return
    }

    const userId = authUser.user.id

    await service.from('profiles').insert({
      id: userId,
      role: 'מועמדת',
      full_name: data.full_name,
      phone: localPhone,
    })

    await service.from('candidates').insert({
      profile_id: userId,
      city: data.city,
      specialization: data.specialization,
      academic_level: data.academic_level,
      availability_status: "מחפשת סטאג'",
      has_cv: false,
    })

    await service.from('wa_sessions').delete().eq('id', session.id)

    await sendWA(phone,
      `✅ *נרשמת בהצלחה!* ברוכה הבאה ${data.full_name?.split(' ')[0]} 🎉\n\n` +
      `לצפייה במשרות שלחי *משרות*\n` +
      `להשלמת הפרופיל: giuus.vercel.app/profile`
    )
    return
  }
}

// ── Browse jobs flow ──────────────────────────────────────────────────
async function startBrowseJobs(
  service: ReturnType<typeof createServiceClient>,
  phone: string,
  profileId: string,
) {
  const { data: rawJobs } = await service
    .from('jobs')
    .select('id, title, city, job_type, specialization, institutions(institution_name)')
    .eq('status', 'פעילה')
    .order('created_at', { ascending: false })
    .limit(8)
  const jobs = (rawJobs ?? []) as unknown as JobListing[]

  if (!jobs.length) {
    await sendWA(phone, 'אין משרות פעילות כרגע 🙁\nנשלח לך התראה כשיתפרסמו חדשות!')
    return
  }

  const list = jobs.map((j, i) => {
    const inst = j.institutions?.institution_name ?? ''
    return `${i + 1}. *${j.title}* — ${j.city ?? ''} | ${j.job_type ?? ''}\n   ${inst}`
  }).join('\n\n')

  await service.from('wa_sessions').insert({
    phone,
    session_type: 'browse_jobs',
    state: 'awaiting_selection',
    data: { profile_id: profileId, jobs: JSON.stringify(jobs) },
    expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  })

  await sendWA(phone,
    `📋 *משרות פעילות:*\n\n${list}\n\n` +
    `שלחי מספר לפרטים נוספים, או *0* לביטול`
  )
}

async function handleBrowseJobsFlow(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  text: string,
  intent: ReturnType<typeof parseIntent>,
) {
  const data = session.data as Record<string, string>
  const jobs: JobListing[] = JSON.parse(data.jobs ?? '[]')

  if (text.trim() === '0' || intent === 'decline') {
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, 'בסדר 👍 כשתרצי לחפש שוב — שלחי *משרות*')
    return
  }

  if (session.state === 'awaiting_selection') {
    const pick = parseInt(text.trim()) - 1
    if (isNaN(pick) || pick < 0 || pick >= jobs.length) {
      await sendWA(phone, `נא לשלוח מספר בין 1 ל-${jobs.length}:`)
      return
    }
    const job = jobs[pick]
    const inst = job.institutions?.institution_name ?? ''
    await service.from('wa_sessions').update({
      state: 'awaiting_apply',
      data: { ...data, selected_job_id: job.id, selected_job_title: job.title, selected_institution: inst },
    }).eq('id', session.id)

    await sendWA(phone,
      `📌 *${job.title}*\n` +
      `🏫 ${inst}\n` +
      `📍 ${job.city ?? ''}\n` +
      `💼 ${job.job_type ?? ''} | ${job.specialization ?? ''}\n` +
      (job.description ? `\n${job.description}\n` : '') +
      `\nלהגשת מועמדות שלחי *הגש*\nלחזרה לרשימה שלחי *משרות*\nלביטול שלחי *0*`
    )
    return
  }

  if (session.state === 'awaiting_apply') {
    if (intent === 'apply' || intent === 'confirm') {
      return handleApplyFlow(service, session, phone, 'confirm')
    }
    if (intent === 'jobs') {
      await service.from('wa_sessions').delete().eq('id', session.id)
      return startBrowseJobs(service, phone, data.profile_id)
    }
  }
}

// ── Apply to job ──────────────────────────────────────────────────────
async function handleApplyFlow(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  intent: ReturnType<typeof parseIntent>,
) {
  const data = session.data as Record<string, string>

  if (intent !== 'confirm' && intent !== 'apply') {
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, 'בסדר, לא הוגשה מועמדות. כשתרצי — שלחי *משרות*')
    return
  }

  // Get candidate record
  const { data: candidate } = await service
    .from('candidates')
    .select('id')
    .eq('profile_id', data.profile_id)
    .single()

  if (!candidate) {
    await sendWA(phone, '❌ לא נמצא פרופיל. כנסי להשלים פרטים: giuus.vercel.app/profile')
    await service.from('wa_sessions').delete().eq('id', session.id)
    return
  }

  // Check if already applied
  const { data: existing } = await service
    .from('applications')
    .select('id, status')
    .eq('job_id', data.selected_job_id)
    .eq('candidate_id', candidate.id)
    .single()

  if (existing) {
    await sendWA(phone, `כבר הגשת מועמדות למשרה זו (סטטוס: ${existing.status}) 👍`)
    await service.from('wa_sessions').delete().eq('id', session.id)
    return
  }

  const { error } = await service.from('applications').insert({
    job_id: data.selected_job_id,
    candidate_id: candidate.id,
    status: 'ממתינה',
  })

  await service.from('wa_sessions').delete().eq('id', session.id)

  if (error) {
    await sendWA(phone, '❌ אירעה שגיאה. נסי דרך האתר: giuus.vercel.app/jobs')
    return
  }

  await sendWA(phone,
    `✅ *ההגשה נשלחה בהצלחה!*\n` +
    `משרה: *${data.selected_job_title}*\n` +
    `מוסד: ${data.selected_institution}\n\n` +
    `נעדכן אותך כשיהיה מענה 🙏\n` +
    `לצפייה בכל ההגשות שלחי *הגשות*`
  )
}

// ── My applications ───────────────────────────────────────────────────
async function showMyApplications(
  service: ReturnType<typeof createServiceClient>,
  phone: string,
  profileId: string,
  firstName: string,
) {
  const { data: candidate } = await service
    .from('candidates')
    .select('id')
    .eq('profile_id', profileId)
    .single()

  if (!candidate) {
    await sendWA(phone, 'לא נמצא פרופיל מועמדת. כנסי: giuus.vercel.app/profile')
    return
  }

  const { data: apps } = await service
    .from('applications')
    .select('id, status, applied_at, jobs(title, city, institutions(institution_name))')
    .eq('candidate_id', candidate.id)
    .order('applied_at', { ascending: false })
    .limit(6)

  if (!apps?.length) {
    await sendWA(phone,
      `עדיין לא הגשת מועמדות ${firstName} 🙂\n` +
      `שלחי *משרות* לצפייה בהזדמנויות`
    )
    return
  }

  const statusEmoji: Record<string, string> = {
    'ממתינה': '⏳', 'נצפתה': '👁', 'התקבלה': '✅', 'נדחתה': '❌', 'בוטלה': '🚫',
  }

  const list = (apps as AppListing[]).map((a, i) => {
    const job = a.jobs
    const inst = job?.institutions?.institution_name ?? ''
    const emoji = statusEmoji[a.status] ?? '•'
    return `${i + 1}. ${emoji} *${job?.title ?? ''}*\n   ${inst} — ${job?.city ?? ''}\n   סטטוס: ${a.status}`
  }).join('\n\n')

  await sendWA(phone,
    `📋 *ההגשות שלך, ${firstName}:*\n\n${list}\n\n` +
    `לפרטים נוספים: giuus.vercel.app/my-applications`
  )
}

// ── Job creation bot ──────────────────────────────────────────────────
async function handleJobCreationFlow(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  text: string,
) {
  const data = session.data as Record<string, string>
  const state = session.state as string

  const updateSession = (newState: string, newData: Record<string, string>) =>
    service.from('wa_sessions').update({ state: newState, data: { ...data, ...newData } }).eq('id', session.id)

  if (text.toLowerCase().includes('ביטול') || text.toLowerCase().includes('cancel')) {
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, '✓ הוספת המשרה בוטלה.')
    return
  }

  if (state === 'awaiting_title') {
    await updateSession('awaiting_institution', { title: text })
    if (data.role === 'מוסד') {
      const { data: inst } = await service
        .from('institutions')
        .select('id, institution_name, district')
        .eq('profile_id', data.profile_id)
        .single()
      if (inst) {
        if (!inst.district) {
          await service.from('wa_sessions').delete().eq('id', session.id)
          await sendWA(phone,
            `לפני פרסום משרות יש להשלים את פרטי המוסד (מחוז וסוג).\n` +
            `👉 ${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()}/institution/profile`
          )
          return
        }
        await updateSession('awaiting_city', { title: text, institution_id: inst.id, institution_name: inst.institution_name })
        await sendWA(phone, `✓ שם המשרה: *${text}*\nמוסד: *${inst.institution_name}*\n\n*באיזו עיר?*`)
        return
      }
    }
    await sendWA(phone, `✓ שם: *${text}*\n\n*שם המוסד?* (חלקי גם בסדר)`)
    return
  }

  if (state === 'awaiting_institution') {
    const { data: insts } = await service
      .from('institutions')
      .select('id, institution_name, city')
      .ilike('institution_name', `%${text}%`)
      .eq('is_approved', true)
      .limit(3)

    if (!insts?.length) {
      await sendWA(phone, `לא מצאתי מוסד בשם "${text}". נסי שוב עם שם חלקי אחר:`)
      return
    }
    if (insts.length === 1) {
      await updateSession('awaiting_city', { institution_id: insts[0].id, institution_name: insts[0].institution_name })
      await sendWA(phone, `✓ מוסד: *${insts[0].institution_name}*\n\n*באיזו עיר?*`)
      return
    }
    const list = insts.map((i, idx) => `${idx + 1}. ${i.institution_name} (${i.city})`).join('\n')
    await updateSession('awaiting_institution_pick', { inst_options: JSON.stringify(insts) })
    await sendWA(phone, `נמצאו כמה מוסדות:\n${list}\n\nשלחי מספר (1-${insts.length}):`)
    return
  }

  if (state === 'awaiting_institution_pick') {
    const options = JSON.parse(data.inst_options ?? '[]')
    const pick = parseInt(text) - 1
    if (isNaN(pick) || pick < 0 || pick >= options.length) {
      await sendWA(phone, `נא לשלוח מספר בין 1 ל-${options.length}:`)
      return
    }
    const inst = options[pick]
    await updateSession('awaiting_city', { institution_id: inst.id, institution_name: inst.institution_name })
    await sendWA(phone, `✓ מוסד: *${inst.institution_name}*\n\n*באיזו עיר?*`)
    return
  }

  if (state === 'awaiting_city') {
    await updateSession('awaiting_hours', { city: text })
    await sendWA(phone, `✓ עיר: *${text}*\n\n*כמה שעות פרונטליות?* (לדוגמה: 20)`)
    return
  }

  if (state === 'awaiting_hours') {
    const hours = text.trim()
    const num = parseInt(hours)
    if (isNaN(num) || num <= 0 || num > 40) {
      await sendWA(phone, 'נא לשלוח מספר שעות בין 1 ל-40:')
      return
    }
    await updateSession('awaiting_classes', { hours })
    await sendWA(phone, `✓ שעות פרונטליות: *${hours}*\n\n*אילו כיתות?* (לדוגמה: א׳-ג׳)`)
    return
  }

  if (state === 'awaiting_classes') {
    const classes = text.trim()
    await updateSession('awaiting_specialization', { classes })
    await sendWA(phone, `✓ כיתות: *${classes}*\n\n*תחום:*\n1️⃣ יסודי\n2️⃣ חט"ב\n3️⃣ מתמטיקה\n4️⃣ אנגלית\n5️⃣ חינוך מיוחד\n6️⃣ אחר`)
    return
  }

  if (state === 'awaiting_specialization') {
    const specs: Record<string, string> = { '1': 'יסודי', '2': 'חט"ב', '3': 'מתמטיקה', '4': 'אנגלית', '5': 'חינוך מיוחד', '6': 'אחר' }
    const spec = specs[text.trim()] ?? specs[Object.keys(specs).find(k => specs[k] === text) ?? ''] ?? null
    if (!spec) {
      await sendWA(phone, 'נא לשלוח מספר בין 1 ל-6:')
      return
    }
    await updateSession('awaiting_constraints', { specialization: spec })
    await sendWA(phone,
      `✓ תחום: *${spec}*\n\n` +
      `*אילוצים / דרישות מיוחדות?*\n` +
      `(לדוגמה: ימי לימודים א׳-ה׳, נוכחות מלאה)\n\n` +
      `לדילוג שלחי *דלג*`
    )
    return
  }

  if (state === 'awaiting_constraints') {
    const skip = ['דלג', 'skip', '-'].includes(text.trim().toLowerCase())
    const description = skip ? null : text.trim()
    await updateSession('confirm', { description: description ?? '' })
    const d: Record<string, string> = { ...data, description: description ?? '' }
    await sendWA(phone,
      `📋 *סיכום המשרה:*\n` +
      `• שם: ${d.title}\n` +
      `• מוסד: ${d.institution_name}\n` +
      `• עיר: ${d.city}\n` +
      `• שעות פרונטליות: ${d.hours}\n` +
      `• כיתות: ${d.classes}\n` +
      `• תחום: ${d.specialization}\n` +
      (description ? `• אילוצים: ${description}\n` : '') +
      `\nלאישור שלחי *כן*, לביטול שלחי *ביטול*`
    )
    return
  }

  if (state === 'confirm') {
    if (parseIntent(text) === 'confirm') {
      const { data: job, error } = await service
        .from('jobs')
        .insert({
          institution_id: data.institution_id,
          title: data.title,
          city: data.city,
          hours: data.hours,
          classes: data.classes,
          specialization: data.specialization,
          description: data.description || null,
          status: 'פעילה',
        })
        .select('id')
        .single()

      await service.from('wa_sessions').delete().eq('id', session.id)

      if (error || !job) {
        await sendWA(phone, '❌ אירעה שגיאה ביצירת המשרה. נסי שוב דרך האתר: giuus.vercel.app')
        return
      }
      await sendWA(phone,
        `✅ המשרה *"${data.title}"* ב${data.institution_name} נוצרה ופורסמה!\n` +
        `לעריכה מלאה: giuus.vercel.app/jobs/${job.id}`
      )
      return
    }
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, '✓ הוספת המשרה בוטלה.')
    return
  }
}

// ── Interview confirmation ────────────────────────────────────────────
async function handleInterviewConfirmation(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  intent: ReturnType<typeof parseIntent>,
) {
  if (intent === 'confirm') {
    await service.from('interviews').update({ candidate_confirmed: true }).eq('id', session.related_id)
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, '✅ הראיון אושר! נתראה שם 🌟')
  } else if (intent === 'decline') {
    await service.from('interviews').update({ candidate_confirmed: false }).eq('id', session.related_id)
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, 'הבנתי, הראיון בוטל. ניתן לפנות למוסד לתיאום מחדש: giuus.vercel.app/my-applications')
  } else {
    await sendWA(phone, 'שלחי *1* או *כן* לאישור הראיון, *2* או *לא* לדחייה:')
  }
}

// ── Invitation confirmation ───────────────────────────────────────────
async function handleInvitationConfirmation(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  intent: ReturnType<typeof parseIntent>,
) {
  if (intent === 'confirm') {
    await service.from('invitations').update({ status: 'התקבלה' }).eq('id', session.related_id)
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, '✅ ההזמנה אושרה! נציג מהמוסד יצור איתך קשר. giuus.vercel.app/my-invitations')
  } else if (intent === 'decline') {
    await service.from('invitations').update({ status: 'נדחתה' }).eq('id', session.related_id)
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, 'הבנתי, ההזמנה נדחתה. אנחנו כאן כשתצטרכי: giuus.vercel.app/jobs')
  } else {
    await sendWA(phone, 'שלחי *1* או *כן* לאישור ההזמנה, *2* או *לא* לדחייה:')
  }
}

// ── Relevance check (weekly) ──────────────────────────────────────────
async function handleRelevanceCheck(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  text: string,
  intent: ReturnType<typeof parseIntent>,
) {
  const data = session.data as { profile_id: string; user_type: 'candidate' | 'institution'; jobs?: string }
  const state = session.state as string

  // ── State: awaiting which jobs to close (institution with multiple jobs) ──
  if (state === 'awaiting_job_selection') {
    const jobs: { id: string; title: string }[] = JSON.parse(data.jobs ?? '[]')
    const trimmed = text.trim()

    let toClose: string[] = []
    if (['הכל', 'כולם', 'כל', 'all'].includes(trimmed.toLowerCase())) {
      toClose = jobs.map(j => j.id)
    } else {
      const nums = trimmed.split(/[,، ]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      toClose = nums.filter(n => n >= 1 && n <= jobs.length).map(n => jobs[n - 1].id)
    }

    if (!toClose.length) {
      await sendWA(phone, `ענו עם מספרי המשרות לסגירה (למשל *1* או *1,2*) או *הכל* לסגירת כולן.`)
      return
    }

    await service.from('jobs').update({ status: 'מושהית' }).in('id', toClose)
    await service.from('wa_sessions').delete().eq('id', session.id)
    const closedTitles = toClose.map(id => jobs.find(j => j.id === id)?.title).filter(Boolean).join(', ')
    await sendWA(phone, `✅ המשרות הבאות הושהו: ${closedTitles}.\nכשתרצו לחזור — כנסו לפנל המוסד: giuus.vercel.app/institution/jobs`)
    return
  }

  // ── State: awaiting initial yes/no reply ──
  if (intent === 'confirm') {
    await service.from('wa_sessions').delete().eq('id', session.id)
    await sendWA(phone, '✅ מעולה! נמשיך לעדכן אותך במשרות ומועמדות מתאימות.')
    return
  }

  if (intent === 'decline') {
    if (data.user_type === 'candidate') {
      await service.from('wa_sessions').delete().eq('id', session.id)
      await service.from('candidates').update({ availability_status: 'לא פעילה' }).eq('profile_id', data.profile_id)
      await sendWA(phone, 'הבנו! הסרנו אותך זמנית מהרשימה הפעילה. כשתרצי לחזור — כנסי לפרופיל ועדכני את הסטטוס: giuus.vercel.app/profile')
      return
    }

    // Institution — fetch active jobs
    const { data: inst } = await service.from('institutions').select('id').eq('profile_id', data.profile_id).single()
    if (!inst) { await service.from('wa_sessions').delete().eq('id', session.id); return }

    const { data: activeJobs } = await service
      .from('jobs').select('id, title').eq('institution_id', inst.id).eq('status', 'פעילה')

    if (!activeJobs?.length) {
      await service.from('wa_sessions').delete().eq('id', session.id)
      await sendWA(phone, 'לא נמצאו משרות פעילות לסגירה.')
      return
    }

    if (activeJobs.length === 1) {
      await service.from('jobs').update({ status: 'מושהית' }).eq('id', activeJobs[0].id)
      await service.from('wa_sessions').delete().eq('id', session.id)
      await sendWA(phone, `✅ המשרה "${activeJobs[0].title}" הושהתה. כשתרצו לחזור: giuus.vercel.app/institution/jobs`)
      return
    }

    // Multiple jobs — ask which to close
    const list = activeJobs.map((j, i) => `${i + 1}. ${j.title}`).join('\n')
    await service.from('wa_sessions').update({
      state: 'awaiting_job_selection',
      data: { ...data, jobs: JSON.stringify(activeJobs.map(j => ({ id: j.id, title: j.title }))) },
    }).eq('id', session.id)
    await sendWA(phone, `אילו משרות לסגור?\n\n${list}\n\nענו עם המספרים (למשל *1* או *1,2*) או *הכל* לסגירת כולן.`)
    return
  }

  await sendWA(phone, 'ענו *כן* להמשך קבלת עדכונים, או *לא* להשהיה זמנית.')
}

// ── Lead info request (institution lead replied "כן" to reminder) ────
async function handleLeadInfoRequest(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  intent: ReturnType<typeof parseIntent>,
) {
  const data = session.data as { lead_id: string; institution_name: string; registration_link: string }

  await service.from('wa_sessions').delete().eq('id', session.id)

  if (intent !== 'confirm') {
    // Any non-"כן" reply — just acknowledge and let normal flow handle it
    return
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  const msg =
    `שלום *${data.institution_name}*! 👋\n\n` +
    `אנחנו כאן בשבילכם 💜\n\n` +
    `*מה זה השביל?*\n` +
    `השביל היא מערכת הגיוס וההשמה של רשת חינוך חב"ד.\n` +
    `כאן תוכלו למצוא מורות ומחנכות מוסמכות, לפרסם משרות, ולנהל את כל התהליך — הכל במקום אחד.\n\n` +
    `✨ *מה תמצאו כאן?*\n` +
    `👩‍🏫 מאגר מאומת של מורות ברחבי הארץ\n` +
    `📋 פרסום משרות בקלות ובמהירות\n` +
    `🔔 התאמות אוטומטיות — המועמדות המתאימות מגיעות אליכם\n` +
    `📩 ניהול הגשות וראיונות ישירות מהמערכת\n` +
    `📊 מעקב בזמן אמת אחרי כל התהליך\n\n` +
    `הכל בחינם לחלוטין לבתי ספר ברשת 🎁\n\n` +
    `להשלמת ההרשמה (5 דקות בלבד):\n${data.registration_link}\n\n` +
    `לאחר ההרשמה: ${appUrl}/institution/jobs\n\n` +
    `בהצלחה! 🌟\n*רשת חינוך חב"ד*`

  await sendWA(phone, msg)
}

// ── Admin approval via WhatsApp ───────────────────────────────────────
async function handleAdminApprove(
  service: ReturnType<typeof createServiceClient>,
  session: WaSession,
  phone: string,
  intent: ReturnType<typeof parseIntent>,
) {
  const data = session.data as { entity_type: string; entity_id: string; entity_name: string }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

  if (intent !== 'confirm' && intent !== 'decline') {
    await sendWA(phone, `*${data.entity_name}* — ענו *כן* לאישור, *לא* לדחייה:`)
    return
  }

  await service.from('wa_sessions').delete().eq('id', session.id)

  if (data.entity_type === 'candidate_request') {
    const { data: req } = await service.from('candidate_requests').select('phone, full_name, email, whatsapp_preference, status').eq('id', data.entity_id).single()

    if (intent === 'confirm') {
      if (req?.status === 'אושרה') {
        await sendWA(phone, `ℹ️ ${data.entity_name} כבר אושרה קודם.`)
        return
      }
      await service.from('candidate_requests').update({ status: 'אושרה' }).eq('id', data.entity_id)

      if (req?.phone) {
        if (req.email?.trim()) {
          const firstName = req.full_name.split(' ')[0]
          const waMsg =
            `✅ ברוכה הבאה ${firstName}! בקשתך אושרה 🎉\n\n` +
            `אנחנו כאן איתך — בשבילך 💜\n\n` +
            `*מה זה השביל?*\n` +
            `השביל היא מערכת הגיוס וההשמה של רשת חינוך חב"ד.\n` +
            `כאן תוכלי למצוא משרות הוראה מתאימות, להגיש מועמדות, ולעקוב אחרי התהליך — הכל במקום אחד.\n\n` +
            `✨ *מה תמצאי כאן?*\n` +
            `📋 משרות הוראה פתוחות ברחבי הארץ\n` +
            `🔔 התראות אוטומטיות על משרות מתאימות לפרופיל שלך\n` +
            `📩 הגשת מועמדות בקלות ישירות מהטלפון\n` +
            `📊 מעקב בזמן אמת אחרי הגשות וראיונות\n\n` +
            `כל פרטי הרישום שלך כבר שמורים — אפשר להתחיל מיד!\n\n` +
            `🔗 להיכנס עם Google:\n${appUrl}/profile\n\n` +
            `⚠️ יש להיכנס עם המייל: ${req.email.trim()}\n\n` +
            `💡 תמיד ניתן לעדכן את הפרופיל לאחר הכניסה.\n\n` +
            `בהצלחה! 🌟\n*רשת חינוך חב"ד*`
          await sendWA(req.phone, waMsg)
        } else {
          const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
          const arr = new Uint8Array(6)
          crypto.getRandomValues(arr)
          const code = Array.from(arr, b => CHARS[b % CHARS.length]).join('')
          await service.from('candidate_requests').update({ access_code: code }).eq('id', data.entity_id)
          const firstName = req.full_name.split(' ')[0]
          const waMsg =
            `✅ ברוכה הבאה ${firstName}! בקשתך אושרה 🎉\n\n` +
            `אנחנו כאן איתך — בשבילך 💜\n\n` +
            `🔑 קוד הגישה שלך: *${code}*\n` +
            `🔗 כניסה: ${appUrl}/register/candidate/activate\n\n` +
            `💡 תמיד ניתן לעדכן את הפרופיל לאחר הכניסה.\n\nבהצלחה! 🌟\n*רשת חינוך חב"ד*`
          await sendWA(req.phone, waMsg)
        }
      }
      await sendWA(phone, `✅ אושר — ${data.entity_name}`)
    } else {
      await service.from('candidate_requests').update({ status: 'נדחתה' }).eq('id', data.entity_id)
      if (req?.phone) {
        await sendWA(req.phone, `שלום ${req.full_name}, תודה על פנייתך. לצערנו הבקשה לא אושרה הפעם. לפרטים נוספים ניתן לפנות למנהלת הרשת.`)
      }
      await sendWA(phone, `❌ נדחה — ${data.entity_name}`)
    }
    return
  }

  // institution pending in pre_registered_institutions (not yet logged in)
  if (data.entity_type === 'institution_preregistered') {
    if (intent === 'confirm') {
      const mosadLink = `${appUrl}/mosad`
      const instPhone = (data as Record<string, string>).institution_phone || null
      if (instPhone) {
        void sendWA(instPhone, `✅ שלום! המוסד "${data.entity_name}" אושר ברשת השביל! 🎉\n\nכעת ניתן להיכנס למערכת:\n${mosadLink}`)
      }
      await sendWA(phone, `✅ אושר — ${data.entity_name}`)
    } else {
      await service.from('pre_registered_institutions').update({ status: 'rejected' }).eq('email', data.entity_id)
      const instPhone = (data as Record<string, string>).institution_phone || null
      if (instPhone) {
        void sendWA(instPhone, `שלום, תודה על פנייתך. לצערנו הבקשה לרישום המוסד "${data.entity_name}" לא אושרה הפעם. לפרטים ניתן לפנות למנהלת הרשת.`)
      }
      await sendWA(phone, `❌ נדחה — ${data.entity_name}`)
    }
    return
  }

  // institution already in DB (approved via admin panel)
  if (data.entity_type === 'institution') {
    if (intent === 'confirm') {
      const { data: inst } = await service.from('institutions').select('institution_name, phone, whatsapp_preference, profile_id').eq('id', data.entity_id).single()
      await service.from('institutions').update({ is_approved: true, approved_at: new Date().toISOString() }).eq('id', data.entity_id)
      const instPhone = inst?.phone ?? null
      if (instPhone) {
        const approveMsg = `✅ ברכות! המוסד "${inst?.institution_name ?? data.entity_name}" אושר במערכת. כעת ניתן לפרסם משרות: ${appUrl}/institution/jobs`
        void sendWA(instPhone, approveMsg)
      }
      await sendWA(phone, `✅ אושר — ${data.entity_name}`)
    } else {
      await service.from('institutions').update({ is_approved: false }).eq('id', data.entity_id)
      await sendWA(phone, `❌ נדחה — ${data.entity_name}`)
    }
    return
  }

  await sendWA(phone, 'הפעולה בוצעה.')
}
