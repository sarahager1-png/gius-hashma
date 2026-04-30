import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const service = createServiceClient()
  const { count } = await service
    .from('institutions')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)
  return NextResponse.json({ count: count ?? 0 })
}
