import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/server-utils'
import { sendInstitutionApprovedEmail } from '@/lib/email'
import { sendExternal } from '@/lib/notify-external'
import { logAction } from '@/lib/audit'
import { notify } from '@/lib/notify'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await assertAdmin(supabase, user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await service
    .from('institutions')
    .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAction(user.id, 'approve_institution', 'institution', id)

  const { data: inst } = await service
    .from('institutions')
    .select('institution_name, phone, whatsapp_preference, profile_id, profiles(full_name, phone)')
    .eq('id', id)
    .single()

  const name = inst?.institution_name ?? ''
  const profilePhone = (inst?.profiles as unknown as { phone: string | null } | null)?.phone ?? ''
  const phone = inst?.phone ?? profilePhone
  const profileId = inst?.profile_id ?? null
  const waPref = inst?.whatsapp_preference

  if (profileId) {
    void notify({
      profile_id: profileId,
      type: 'institution_approved',
      title: 'מוסדכם אושר! ✅',
      body: `"${name}" אושר במערכת. כעת ניתן לפרסם משרות.`,
      related_id: id,
      url: '/dashboard',
    })
    const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
    const approveWA =
      `✅ ברכות! המוסד "${name}" אושר במערכת 🎉\n\n` +
      `אנחנו כאן איתכם — בשבילכם 💜\n\n` +
      `*מה זה השביל?*\n` +
      `השביל היא מערכת הגיוס וההשמה של רשת חינוך חב"ד.\n` +
      `כאן תוכלו לפרסם משרות הוראה, לקבל מועמדויות ולנהל את תהליך הגיוס — הכל במקום אחד.\n\n` +
      `✨ *מה תמצאו כאן?*\n` +
      `📋 פרסום משרות הוראה בקלות\n` +
      `👩‍🏫 קבלת מועמדויות ממועמדות מתאימות\n` +
      `📩 שליחת הזמנות לראיון ישירות מהמערכת\n` +
      `📊 ניהול תהליך הגיוס בזמן אמת\n\n` +
      `🔗 להיכנס למערכת:\n${APP_URL}/institution/jobs\n\n` +
      `💡 תמיד ניתן לעדכן את פרופיל המוסד לאחר הכניסה.\n\n` +
      `בהצלחה! 🌟\n*רשת חינוך חב"ד*`
    const approveSms = `ברכות! "${name}" אושר במערכת גיוס חב"ד. לפרסום משרות: ${APP_URL}/institution/jobs`
    void sendInstitutionApprovedEmail({ institutionProfileId: profileId, institutionName: name })
    void sendExternal({ phone: phone || null, whatsapp_preference: waPref, waMessage: approveWA, smsMessage: approveSms })
  }

  return NextResponse.json({ ok: true, name, phone })
}
