import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { streamDriveFile } from '@/lib/drive'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const fileId = searchParams.get('fileId')
  const slug   = searchParams.get('slug')

  if (!fileId || !slug) return new Response('Bad request', { status: 400 })

  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  if (!token || !verifyToken(token, slug)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const range = req.headers.get('range')
  const { stream, contentType, contentLength, contentRange, status } =
    await streamDriveFile(fileId, range)

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  }
  if (contentLength) headers['Content-Length'] = contentLength
  if (contentRange)  headers['Content-Range']  = contentRange

  return new Response(stream, { status, headers })
}
