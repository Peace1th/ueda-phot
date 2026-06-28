import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  const { data } = await (slug
    ? supabaseAdmin.from('download_logs').select('*').eq('album_slug', slug).order('created_at', { ascending: false }).limit(500)
    : supabaseAdmin.from('download_logs').select('*').order('created_at', { ascending: false }).limit(500))

  return Response.json(data ?? [])
}
