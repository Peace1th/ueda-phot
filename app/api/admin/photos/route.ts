import { NextRequest } from 'next/server'
import { listDrivePhotos } from '@/lib/drive'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  if (!folderId) return Response.json({ error: 'folderId required' }, { status: 400 })
  try {
    const files = await listDrivePhotos(folderId)
    return Response.json(files)
  } catch {
    return Response.json({ error: 'Drive fetch failed' }, { status: 500 })
  }
}
