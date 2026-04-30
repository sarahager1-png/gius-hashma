import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from './types'
import { createServiceClient } from './supabase/server'

const ADMIN_ROLES: UserRole[] = ['מנהל רשת', 'אדמין מערכת']

export async function getProfile(_supabase: SupabaseClient, userId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function assertRole(
  supabase: SupabaseClient,
  userId: string,
  allowedRoles: UserRole[]
) {
  const profile = await getProfile(supabase, userId)
  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error('Forbidden')
  }
  return profile
}

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  return assertRole(supabase, userId, ADMIN_ROLES)
}
