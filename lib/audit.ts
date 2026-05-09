import { createServiceClient } from '@/lib/supabase/server'

export async function logAction(
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const service = createServiceClient()
  await service.from('audit_log').insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  })
}
