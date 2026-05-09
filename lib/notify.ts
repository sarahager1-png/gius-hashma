import { createServiceClient } from '@/lib/supabase/server'
import { sendPushToSubscription } from '@/lib/webpush'

interface NotifyInput {
  profile_id: string
  type: string
  title: string
  body?: string | null
  related_id?: string | null
  url?: string
}

export async function notify(input: NotifyInput) {
  const service = createServiceClient()

  // Insert in-app notification
  await service.from('notifications').insert({
    profile_id:  input.profile_id,
    type:        input.type,
    title:       input.title,
    body:        input.body ?? null,
    related_id:  input.related_id ?? null,
  })

  // Fire web push to all active subscriptions for this user
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', input.profile_id)

  if (!subs?.length) return

  const staleEndpoints: string[] = []

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await sendPushToSubscription(sub, {
          title: input.title,
          body:  input.body ?? '',
          url:   input.url ?? '/notifications',
        })
      } catch (err: unknown) {
        // 410 Gone = subscription expired; clean it up
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          staleEndpoints.push(sub.endpoint)
        }
      }
    })
  )

  if (staleEndpoints.length > 0) {
    await service
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
  }
}

// Bulk notify multiple profiles
export async function notifyMany(profiles: string[], common: Omit<NotifyInput, 'profile_id'>) {
  await Promise.allSettled(profiles.map(id => notify({ ...common, profile_id: id })))
}
