'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  role: string
  profileId: string
}

export default function RealtimeRefresh({ role, profileId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const isAdmin = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(role)
    const isInstitution = role === 'מוסד'
    const isCandidate = role === 'מועמדת'

    const channels: ReturnType<typeof supabase.channel>[] = []

    function refresh() {
      router.refresh()
    }

    // ── Admin: candidate requests + institutions + notifications ──────
    if (isAdmin) {
      channels.push(
        supabase.channel('admin-candidate-requests')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_requests' }, refresh)
          .subscribe(),

        supabase.channel('admin-institutions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'institutions' }, refresh)
          .subscribe(),

        supabase.channel('admin-pre-registered')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'pre_registered_institutions' }, refresh)
          .subscribe(),
      )
    }

    // ── Institution: applications + invitations ───────────────────────
    if (isInstitution) {
      channels.push(
        supabase.channel('inst-applications')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, refresh)
          .subscribe(),

        supabase.channel('inst-invitations')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, refresh)
          .subscribe(),
      )
    }

    // ── Candidate: applications + invitations ─────────────────────────
    if (isCandidate) {
      channels.push(
        supabase.channel('cand-applications-' + profileId)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, refresh)
          .subscribe(),

        supabase.channel('cand-invitations-' + profileId)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, refresh)
          .subscribe(),
      )
    }

    // ── Everyone: notifications ───────────────────────────────────────
    channels.push(
      supabase.channel('notifications-' + profileId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `profile_id=eq.${profileId}`,
        }, refresh)
        .subscribe()
    )

    return () => {
      channels.forEach(c => supabase.removeChannel(c))
    }
  }, [role, profileId, router, supabase])

  return null
}
