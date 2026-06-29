import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin.from('site_settings').select('key, value')
  const result: Record<string, string> = {}
  ;(data ?? []).forEach(r => { result[r.key] = r.value })
  return Response.json(result)
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, value } = await req.json()
  const { error } = await supabaseAdmin.from('site_settings').upsert({ key, value })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
