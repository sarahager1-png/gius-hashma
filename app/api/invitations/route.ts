import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email'
import { sendExternal } from '@/lib/notify-external'

// POST — institution invites a candidate to a job
export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { institution_id, candidate_id, job_id, message, scheduled_at } = await request.json()
  if (!institution_id || !candidate_id || !job_id)
    return NextResponse.json({ error: 'institution_id, candidate_id, job_id required' }, { status: 400 })

  const { data: callerProfile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = callerProfile?.role && ['מנהלת מערכת', 'אדמין מערכת'].includes(callerProfile.role)

  // verify institution belongs to caller (or caller is admin)
  const { data: inst } = await service
    .from('institutions').select('id, institution_name').eq('id', institution_id).single()
  if (!inst) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isAdmin) {
    // Use service client (bypasses RLS) but explicitly check profile_id = caller — safe ownership check
    const { data: ownedInst } = await service
      .from('institutions').select('id').eq('id', institution_id).eq('profile_id', user.id).single()
    if (!ownedInst) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // verify job belongs to this institution (also fetch title for notification)
  const { data: jobRow } = await service
    .from('jobs').select('id, title').eq('id', job_id).eq('institution_id', institution_id).single()
  if (!jobRow) return NextResponse.json({ error: 'המשרה אינה שייכת למוסד זה' }, { status: 403 })

  const { data: inv, error } = await service
    .from('invitations')
    .insert({ institution_id, candidate_id, job_id, message: message || null, scheduled_at: scheduled_at || null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already invited' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // notify candidate (in-app + email + SMS)
  const jobTitle = jobRow.title
  const { data: cand } = await service
    .from('candidates').select('profile_id, whatsapp_preference, profiles(full_name, phone)').eq('id', candidate_id).single()
  if (cand?.profile_id) {
    const dt = scheduled_at ? new Date(scheduled_at).toLocaleString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : null
    await service.from('notifications').insert({
      profile_id: cand.profile_id,
      type: 'interview_scheduled',
      title: `הוזמנת לראיון — ${inst.institution_name}`,
      body: `${jobTitle}${dt ? ' · ' + dt : ''}. ניתן לאשר או לסרב ישירות מדף ההתראות.`,
      related_id: inv.id,
    })
    const candidateName = (cand.profiles as unknown as { full_name: string | null } | null)?.full_name ?? 'מועמדת'
    const candidateWaPref = (cand as unknown as { whatsapp_preference: boolean | null }).whatsapp_preference
    void sendInvitationEmail({
      candidateProfileId: cand.profile_id,
      candidateName,
      jobTitle,
      institutionName: inst.institution_name,
      scheduledAt: scheduled_at,
      message,
    })
    const candidatePhone = (cand.profiles as unknown as { phone: string | null } | null)?.phone
    if (candidatePhone) {
      const dtStr = scheduled_at ? new Date(scheduled_at).toLocaleString('he-IL', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      }) : ''
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
      const inviteMsg = `שלום ${candidateName}! 😊 ${inst.institution_name} מזמינה אותך לראיון למשרת "${jobTitle}"${dtStr ? ' · ' + dtStr : ''}. לאישור, ולדחייה אם המשרה לא רלוונטית: ${appUrl}/my-invitations`
      void sendExternal({ phone: candidatePhone, whatsapp_preference: candidateWaPref, waMessage: inviteMsg, smsMessage: inviteMsg })
    }
  }

  return NextResponse.json(inv, { status: 201 })
}
