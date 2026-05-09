import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'הקובץ חייב להיות עד 5MB' }, { status: 400 })

  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: 'קובץ PDF או Word בלבד' }, { status: 400 })

  const ext  = file.name.split('.').pop() ?? 'pdf'
  const path = `cv/${user.id}.${ext}`
  const bytes = await file.arrayBuffer()

  const service = createServiceClient()
  const { error: uploadError } = await service.storage
    .from('candidate-cvs')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage
    .from('candidate-cvs')
    .getPublicUrl(path)

  // save url to candidate row
  await service
    .from('candidates')
    .update({ cv_url: publicUrl })
    .eq('profile_id', user.id)

  return NextResponse.json({ ok: true, url: publicUrl })
}
