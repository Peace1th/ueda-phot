import { NextRequest } from 'next/server'
import { getDriveFileBuffer } from '@/lib/drive'
import sharp from 'sharp'

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId')
  if (!fileId) return new Response('Bad request', { status: 400 })

  const buffer = await getDriveFileBuffer(fileId)
  const resized = await sharp(buffer)
    .resize(520, 360, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer()

  return new Response(new Uint8Array(resized), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
