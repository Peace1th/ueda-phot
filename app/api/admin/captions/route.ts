import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

// GET /api/admin/captions?fileIds=id1,id2,id3
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const ids = (new URL(req.url).searchParams.get('fileIds') ?? '').split(',').filter(Boolean)
  if (!ids.length) return Response.json([])
  const { data } = await supabaseAdmin
    .from('photo_captions').select('file_id, caption').in('file_id', ids)
  return Response.json(data ?? [])
}

// PATCH /api/admin/captions  body: [{ file_id, caption }]
export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const updates: { file_id: string; caption: string }[] = await req.json()
  if (!updates.length) return Response.json({ ok: true })
  const { error } = await supabaseAdmin.from('photo_captions').upsert(
    updates.map(u => ({ file_id: u.file_id, caption: u.caption, updated_at: new Date().toISOString() }))
  )
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
