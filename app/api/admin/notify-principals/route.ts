import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendToCandidate } from '@/lib/communication'

export const maxDuration = 300

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']
const APP_URL = 'https://giuus.vercel.app'

// U+200F (RLM) prefixes lines that end with an LTR URL / pointer, so the 👈
// points at the link correctly inside an RTL WhatsApp bubble.
function messageFor(name: string | null): string {
  const greet = name && name.trim() ? `שלום ${name.trim()} 🌷` : 'שלום 🌷'
  return [
    greet,
    '',
    'בקשה קטנה שתעשה לך סדר:',
    '',
    'כשמשרה אצלך מתאיישת — לחצי "המשרה התאיישה ✓" בעמוד המשרות (לחיצה אחת).',
    '‏כך תפסיקי לקבל פניות למשרה סגורה, והמועמדות לא יבזבזו זמן 🙏',
    '',
    `‏המשרות שלך כאן 👈 ${APP_URL}/institution/jobs`,
    '',
    'ופעם בשבוע, כשמגיעה "המשרה עדיין רלוונטית?" — מספיק להשיב כן/לא. תודה! ✨',
  ].join('\n')
}

interface Recipient {
  id: string
  institution_name: string
  principal_name: string | null
  profile_id: string
  phone: string
}

// Institutions with ≥1 open ('פעילה') job, approved, that have a login profile + phone
// (only registered principals can actually click the button we're telling them about).
async function getRecipients(service: ReturnType<typeof createServiceClient>): Promise<Recipient[]> {
  const instIds = new Set<string>()
  for (let from = 0; ; from += 1000) {
    const { data } = await service.from('jobs').select('institution_id').eq('status', 'פעילה').range(from, from + 999)
    const rows = data ?? []
    for (const r of rows) if (r.institution_id) instIds.add(r.institution_id)
    if (rows.length < 1000) break
  }
  if (!instIds.size) return []

  const { data: insts } = await service
    .from('institutions')
    .select('id, institution_name, principal_name, profile_id, phone, is_approved')
    .in('id', [...instIds])

  return (insts ?? [])
    .filter(i => i.is_approved && i.profile_id && i.phone)
    .map(i => ({
      id: i.id,
      institution_name: i.institution_name,
      principal_name: i.principal_name,
      profile_id: i.profile_id as string,
      phone: i.phone as string,
    }))
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !ADMIN_ROLES.includes(profile.role))
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, service }
}

// Preview — who would receive it + the message. No send.
export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const recipients = await getRecipients(gate.service)
  return NextResponse.json({
    count: recipients.length,
    sample: recipients.slice(0, 60).map(r => ({
      institution: r.institution_name,
      principal: r.principal_name,
      phone: r.phone,
    })),
    message: messageFor('[שם]'),
  })
}

// Send — personalized WhatsApp to each principal, throttled + logged.
export async function POST() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const { service, user } = gate

  const recipients = await getRecipients(service)
  let sent = 0
  let failed = 0
  for (const r of recipients) {
    const res = await sendToCandidate({
      profileId: r.profile_id,
      waText: messageFor(r.principal_name ?? r.institution_name),
      channel: 'wa',
      contextType: 'principal_closure_nudge',
      sentBy: user.id,
    })
    if (res === 'wa') sent++
    else failed++
    // gentle pacing to stay within Green API rate limits
    await new Promise(resolve => setTimeout(resolve, 700))
  }

  return NextResponse.json({ ok: true, total: recipients.length, sent, failed })
}
