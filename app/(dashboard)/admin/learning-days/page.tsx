import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { LearningDay } from '@/lib/types'
import LearningDaysClient from './learning-days-client'

export default async function LearningDaysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? '')) redirect('/dashboard')

  // Load learning days with attendee + reflection counts
  const { data: days } = await service
    .from('learning_days')
    .select('*')
    .order('day_date', { ascending: false })

  const dayIds = (days ?? []).map((d: LearningDay) => d.id)

  const [{ data: attendeeCounts }, { data: reflectionCounts }] = await Promise.all([
    dayIds.length
      ? service.from('learning_day_attendees').select('learning_day_id').in('learning_day_id', dayIds)
      : Promise.resolve({ data: [] as { learning_day_id: string }[] }),
    dayIds.length
      ? service.from('learning_day_reflections').select('learning_day_id, status').in('learning_day_id', dayIds)
      : Promise.resolve({ data: [] as { learning_day_id: string; status: string }[] }),
  ])

  const attendeeMap = (attendeeCounts ?? []).reduce((acc: Record<string, number>, r) => {
    acc[r.learning_day_id] = (acc[r.learning_day_id] ?? 0) + 1; return acc
  }, {})

  const reflectionMap = (reflectionCounts ?? []).reduce((acc: Record<string, Record<string, number>>, r) => {
    if (!acc[r.learning_day_id]) acc[r.learning_day_id] = {}
    acc[r.learning_day_id][r.status] = (acc[r.learning_day_id][r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <LearningDaysClient
      days={(days ?? []) as LearningDay[]}
      attendeeMap={attendeeMap}
      reflectionMap={reflectionMap}
    />
  )
}
