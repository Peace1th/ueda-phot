import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 })

  const { data: accessRows } = await supabaseAdmin
    .from('user_album_access')
    .select('id, user_id, created_at')
    .eq('album_slug', slug)
    .order('created_at', { ascending: false })

  if (!accessRows?.length) return Response.json([])

  const userIds = accessRows.map(r => r.user_id)

  const [profilesRes, usersRes] = await Promise.all([
    supabaseAdmin.from('user_profiles').select('id, name').in('id', userIds),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap: Record<string, string> = {}
  for (const u of usersRes.data?.users ?? []) {
    if (u.email) emailMap[u.id] = u.email
  }
  const profileMap: Record<string, string> = {}
  for (const p of profilesRes.data ?? []) {
    if (p.name) profileMap[p.id] = p.name
  }

  return Response.json(accessRows.map(r => ({
    id:         r.id,
    user_id:    r.user_id,
    name:       profileMap[r.user_id] ?? null,
    email:      emailMap[r.user_id] ?? null,
    created_at: r.created_at,
  })))
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, slug } = await req.json()
  if (!email || !slug) return Response.json({ error: 'email と slug が必要です' }, { status: 400 })

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
  if (!user) {
    return Response.json(
      { error: 'ユーザーが見つかりません（先にGoogleでログインが必要です）' },
      { status: 404 },
    )
  }

  const { data: existing } = await supabaseAdmin
    .from('user_album_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('album_slug', slug)
    .maybeSingle()

  if (existing) return Response.json({ ok: true, message: 'already_exists' })

  const { error } = await supabaseAdmin
    .from('user_album_access')
    .insert({ user_id: user.id, album_slug: slug })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  await supabaseAdmin.from('user_album_access').delete().eq('id', id)
  return Response.json({ ok: true })
}
