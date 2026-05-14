import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { LearningDay, LearningDayReflection, LearningDayAttendee } from '@/lib/types'
import ReflectionsClient from './reflections-client'

export default async function LearningDayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? '')) redirect('/dashboard')

  const [{ data: day }, { data: attendees }, { data: reflections }, { data: allCandidates }] = await Promise.all([
    service.from('learning_days').select('*').eq('id', id).single(),
    service.from('learning_day_attendees').select('*, candidates(id, profiles(id, full_name, phone))').eq('learning_day_id', id),
    service.from('learning_day_reflections').select('*, candidates(id, profiles(id, full_name, phone))').eq('learning_day_id', id),
    service.from('candidates').select('id, profiles(id, full_name)').order('id'),
  ])

  if (!day) redirect('/admin/learning-days')

  return (
    <ReflectionsClient
      day={day as LearningDay}
      attendees={(attendees ?? []) as LearningDayAttendee[]}
      reflections={(reflections ?? []) as LearningDayReflection[]}
      allCandidates={(allCandidates ?? []) as unknown as { id: string; profiles: { id: string; full_name: string | null } | null }[]}
    />
  )
}
