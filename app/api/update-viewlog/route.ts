import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const { id, slug, latitude, longitude } = await req.json()
  if (!id || !slug) return new Response('Bad request', { status: 400 })

  // アルバムCookieで認証
  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  if (!token || !verifyToken(token, slug)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ログが本当にこのアルバムのものか確認して更新
  await supabaseAdmin
    .from('view_logs')
    .update({ latitude: String(latitude), longitude: String(longitude) })
    .eq('id', id)
    .eq('album_slug', slug)

  return new Response(null, { status: 204 })
}
