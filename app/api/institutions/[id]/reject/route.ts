import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/server-utils'
import { sendInstitutionRejectedEmail } from '@/lib/email'

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
    .update({ is_approved: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: inst } = await service
    .from('institutions')
    .select('institution_name, profile_id')
    .eq('id', id)
    .single()

  const name = inst?.institution_name ?? ''
  const profileId = inst?.profile_id ?? null

  if (profileId) {
    await service.from('notifications').insert({
      profile_id: profileId,
      type: 'institution_rejected',
      title: 'עדכון על בקשת ההצטרפות',
      body: 'לצערנו לא ניתן לאשר את המוסד בשלב זה. לפרטים נוספים צרו קשר עם מנהל המערכת.',
      related_id: id,
    })
    void sendInstitutionRejectedEmail({ institutionProfileId: profileId, institutionName: name })
  }

  return NextResponse.json({ ok: true, name })
}
