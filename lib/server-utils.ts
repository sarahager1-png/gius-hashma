import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from './types'

const ADMIN_ROLES: UserRole[] = ['מנהל רשת', 'אדמין מערכת']

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
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
