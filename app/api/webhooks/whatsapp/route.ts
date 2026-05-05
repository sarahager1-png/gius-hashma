import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseWebhookMessages, parseIntent, sendWA } from '@/lib/whatsapp'

// ── GET: Meta webhook verification ───────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// ── POST: Receive incoming messages ──────────────────────────────────
export async function POST(request: Request) {
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
  // Log inbound message
  void service.from('wa_log').insert({
    direction: 'inbound', phone, message: text,
  })

  // Look up active session for this phone
  const { data: session } = await service
    .from('wa_sessions')
    .select('*')
    .eq('phone', phone)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const intent = parseIntent(text)

  // ── 1. Active session: continue the flow ─────────────────────────
  if (session) {
    if (session.session_type === 'create_job') {
      await handleJobCreationFlow(service, session, phone, text)
      return
    }

    if (session.session_type === 'confirm_interview') {
      await handleInterviewConfirmation(service, session, phone, intent)
      return
    }

    if (session.session_type === 'confirm_invitation') {
      await handleInvitationConfirmation(service, session, phone, intent)
      return
    }
  }

  // ── 2. New intent ─────────────────────────────────────────────────
  if (intent === 'new_job') {
    // Only admins or institution owners can create jobs
    const { data: profile } = await service
      .from('profiles')
      .select('id, role, full_name')
      .eq('phone', phone.replace(/^972/, '0'))
      .maybeSingle()

    if (!profile || !['מנהלת מערכת', 'אדמין מערכת', 'מוסד'].includes(profile.role)) {
      await sendWA(phone, 'אין לך הרשאה ליצור משרות. לכניסה למערכת: giuus.vercel.app')
      return
    }

    // Start job creation session
    await service.from('wa_sessions').insert({
      phone,
      session_type: 'create_job',
      state: 'awaiting_title',
      data: { profile_id: profile.id, role: profile.role },
    })
    await sendWA(phone, `שלום ${profile.full_name?.split(' ')[0] ?? ''}! 👋\nניצור משרה חדשה יחד.\n\n*מה שם המשרה?*`)
    return
  }

  if (intent === 'help') {
    await sendWA(phone,
      '📋 *מה אפשר לעשות כאן:*\n\n' +
      '• כן / 1 — לאישור הזמנה או ראיון\n' +
      '• לא / 2 — לדחייה\n' +
      '• *משרה חדשה* — פרסום משרה (למנהלות)\n' +
      '• לכניסה למערכת: giuus.vercel.app'
    )
    return
  }

  // Unknown message — friendly reply
  await sendWA(phone,
    'קיבלנו את ההודעה שלך 🙏\n' +
    'לניהול ההגשות והמשרות היכנסי ל: giuus.vercel.app\n' +
    'לעזרה שלחי *עזרה*'
  )
}

// ── Job creation bot ──────────────────────────────────────────────────
async function handleJobCreationFlow(
  service: ReturnType<typeof createServiceClient>,
  session: Record<string, any>,
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
      // Find institution by profile_id
      const { data: inst } = await service
        .from('institutions')
        .select('id, institution_name')
        .eq('profile_id', data.profile_id)
        .eq('is_approved', true)
        .single()
      if (inst) {
        await updateSession('awaiting_city', { title: text, institution_id: inst.id, institution_name: inst.institution_name })
        await sendWA(phone, `✓ שם המשרה: *${text}*\nמוסד: *${inst.institution_name}*\n\n*באיזו עיר?*`)
        return
      }
    }
    await sendWA(phone, `✓ שם: *${text}*\n\n*שם המוסד?* (חלקי גם בסדר)`)
    return
  }

  if (state === 'awaiting_institution') {
    // Fuzzy search institution
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
      // Create the job
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
  session: Record<string, any>,
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
  session: Record<string, any>,
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
