import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import CandidatesClient from './candidates-client'
import type { Candidate } from '@/lib/types'

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { q } = await searchParams

  const { data: candidates } = await service
    .from('candidates')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false })

  return <CandidatesClient candidates={(candidates ?? []) as Candidate[]} initialSearch={q ?? ''} />
}
