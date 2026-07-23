import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

// Verify actual file bytes instead of trusting the client-declared Content-Type,
// which an attacker can set to anything regardless of the file's real content.
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp'
  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'image/heic'
  return null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit('upload-photo:' + user.id, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי העלאות. נסי שוב מאוחר יותר.' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const detectedType = sniffImageType(new Uint8Array(arrayBuffer))
  if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
    return NextResponse.json({ error: 'הקובץ אינו תמונה תקינה' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const service = createServiceClient()
  const { error } = await service.storage
    .from('candidate-photos')
    .upload(filename, arrayBuffer, { contentType: detectedType, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage
    .from('candidate-photos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
