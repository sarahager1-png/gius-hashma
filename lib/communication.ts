// Central communication dispatcher: renders template → sends → logs
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA, normalizePhone } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'
import { notify } from '@/lib/notify'
import { renderTemplate } from '@/lib/templates'

export type SendChannel = 'wa' | 'sms' | 'in_app' | 'auto'

export interface SendOptions {
  profileId: string
  templateKey?: string
  // pre-rendered texts (override template)
  waText?: string
  smsText?: string
  inAppTitle?: string
  inAppBody?: string
  vars?: Record<string, string>
  channel?: SendChannel         // 'auto' = honour candidate's whatsapp_preference
  contextType?: string
  contextId?: string
  sentBy?: string | null
}

interface Profile {
  full_name: string | null
  phone: string | null
}
interface Candidate {
  whatsapp_preference: boolean | null
}

export async function sendToCandidate(opts: SendOptions): Promise<'wa' | 'sms' | 'in_app' | 'failed'> {
  const service = createServiceClient()

  // Resolve profile + candidate preference
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, phone')
    .eq('id', opts.profileId)
    .single() as { data: Profile | null }

  const { data: candidate } = await service
    .from('candidates')
    .select('whatsapp_preference')
    .eq('profile_id', opts.profileId)
    .single() as { data: Candidate | null }

  // Resolve template texts
  let waBody  = opts.waText  ?? ''
  let smsBody = opts.smsText ?? ''

  if (opts.templateKey && opts.vars) {
    const { data: tmpl } = await service
      .from('message_templates')
      .select('wa_text, sms_text')
      .eq('key', opts.templateKey)
      .eq('is_active', true)
      .single()

    if (tmpl) {
      if (tmpl.wa_text)  waBody  = renderTemplate(tmpl.wa_text,  opts.vars)
      if (tmpl.sms_text) smsBody = renderTemplate(tmpl.sms_text, opts.vars)
    }
  }

  const phone = profile?.phone ?? null
  const prefersWa = candidate?.whatsapp_preference !== false

  let channel: 'wa' | 'sms' | 'in_app' = 'in_app'
  let success = false

  if (opts.channel === 'in_app' || (!phone && opts.channel !== 'wa' && opts.channel !== 'sms')) {
    // in-app only
    channel = 'in_app'
    if (opts.inAppTitle) {
      await notify({ profile_id: opts.profileId, type: opts.templateKey ?? 'message', title: opts.inAppTitle, body: opts.inAppBody })
      success = true
    }
  } else if (opts.channel === 'wa' || (opts.channel === 'auto' && prefersWa && phone && waBody)) {
    channel = 'wa'
    success = await sendWA(phone!, waBody)
  } else if (opts.channel === 'sms' || (phone && smsBody)) {
    channel = 'sms'
    success = await sendSms(phone!, smsBody)
  }

  // Always log
  const body = channel === 'wa' ? waBody : channel === 'sms' ? smsBody : (opts.inAppTitle ?? '')
  await service.from('communication_logs').insert({
    recipient_profile_id: opts.profileId,
    recipient_phone: phone ? normalizePhone(phone) : null,
    recipient_name: profile?.full_name ?? null,
    template_key: opts.templateKey ?? null,
    channel,
    message_body: body,
    status: success ? 'sent' : 'failed',
    context_type: opts.contextType ?? null,
    context_id: opts.contextId ?? null,
    sent_by: opts.sentBy ?? null,
  })

  return success ? channel : 'failed'
}

// Send to multiple candidates, respecting each one's preference
export async function sendToMany(
  profileIds: string[],
  opts: Omit<SendOptions, 'profileId'>
): Promise<void> {
  await Promise.allSettled(
    profileIds.map(id => sendToCandidate({ ...opts, profileId: id }))
  )
}
