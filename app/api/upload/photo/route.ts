import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const service = createServiceClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await service.storage
    .from('candidate-photos')
    .upload(filename, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage
    .from('candidate-photos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
