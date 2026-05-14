// Template engine for WA/SMS message templates
// Variables use {{variable_name}} syntax

export interface MessageTemplate {
  id: string
  key: string
  name: string
  channel: 'wa' | 'sms' | 'both'
  wa_text: string | null
  sms_text: string | null
  variables: string[]
  is_active: boolean
}

export type TemplateKey =
  | 'registration_confirmation'
  | 'interview_invitation'
  | 'rejection'
  | 'acceptance'
  | 'receipt_reminder'
  | 'registration_completed'
  | 'learning_day_reflection'

export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export function extractVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map(m => m[1]))]
}

// Build rendered WA + SMS texts from a template row + variable map
export function renderBoth(
  template: Pick<MessageTemplate, 'wa_text' | 'sms_text'>,
  vars: Record<string, string>
): { wa: string; sms: string } {
  return {
    wa:  template.wa_text  ? renderTemplate(template.wa_text,  vars) : '',
    sms: template.sms_text ? renderTemplate(template.sms_text, vars) : '',
  }
}
