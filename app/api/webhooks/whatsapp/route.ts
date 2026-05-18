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
  const secret = process.env.GREENAPI_WEBHOOK_SECRET
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
    }
  }

  // ── Look up profile by phone ──────────────────────────────────────
  const localPhone = phone.replace(/^972/, '0')
  const { data: profile } = await service
    .from('profiles')
    .select('id, role, full_name')
    .or(`phone.eq.${localPhone},phone.eq.${phone}`)
    .maybeSingle()

  // ── Unknown user → registration ───────────────────────────────────
  if (!profile) {
    if (intent === 'confirm' || intent === 'register' || intent === 'help' || intent === 'unknown') {
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
    } else {
      await sendWA(phone,
        `שלום! 👋\nאת לא רשומה במערכת עדיין.\n` +
        `שלחי *שלום* כדי להתחיל בתהליך הרשמה קצר, או כנסי ל: giuus.vercel.app`
      )
    }
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
            `👉 giuus.vercel.app/institution/profile`
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
    await updateSession('awaiting_type', { city: text })
    await sendWA(phone, `✓ עיר: *${text}*\n\n*סוג משרה:*\n1️⃣ סטאג׳\n2️⃣ חלקי\n3️⃣ מלא`)
    return
  }

  if (state === 'awaiting_type') {
    const types: Record<string, string> = { '1': "סטאג'", '2': 'חלקי', '3': 'מלא', "סטאג'": "סטאג'", 'חלקי': 'חלקי', 'מלא': 'מלא' }
    const jobType = types[text] ?? types[text.trim()]
    if (!jobType) {
      await sendWA(phone, 'נא לשלוח 1, 2 או 3:')
      return
    }
    await updateSession('awaiting_specialization', { job_type: jobType })
    await sendWA(phone, `✓ סוג: *${jobType}*\n\n*תחום:*\n1️⃣ יסודי\n2️⃣ חט"ב\n3️⃣ מתמטיקה\n4️⃣ אנגלית\n5️⃣ חינוך מיוחד\n6️⃣ אחר`)
    return
  }

  if (state === 'awaiting_specialization') {
    const specs: Record<string, string> = { '1': 'יסודי', '2': 'חט"ב', '3': 'מתמטיקה', '4': 'אנגלית', '5': 'חינוך מיוחד', '6': 'אחר' }
    const spec = specs[text.trim()] ?? specs[Object.keys(specs).find(k => specs[k] === text) ?? ''] ?? null
    if (!spec) {
      await sendWA(phone, 'נא לשלוח מספר בין 1 ל-6:')
      return
    }
    await updateSession('confirm', { specialization: spec })
    const d: Record<string, string> = { ...data, specialization: spec }
    await sendWA(phone,
      `📋 *סיכום המשרה:*\n` +
      `• שם: ${d.title}\n` +
      `• מוסד: ${d.institution_name}\n` +
      `• עיר: ${d.city}\n` +
      `• סוג: ${d.job_type}\n` +
      `• תחום: ${spec}\n\n` +
      `לאישור שלחי *כן*, לביטול שלחי *ביטול*`
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
          job_type: data.job_type,
          specialization: data.specialization,
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
