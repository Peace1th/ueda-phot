import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getDriveFileBuffer } from '@/lib/drive'
import sharp from 'sharp'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const fileId = searchParams.get('fileId')
  const slug   = searchParams.get('slug')
  const size   = searchParams.get('size') ?? 'medium'

  if (!fileId || !slug) return new Response('Bad request', { status: 400 })

  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  if (!token || !verifyToken(token, slug)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const buffer = await getDriveFileBuffer(fileId)

  const resized = size === 'thumb'
    ? await sharp(buffer).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()
    : await sharp(buffer).resize(1100, null, { withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()

  return new Response(new Uint8Array(resized), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
