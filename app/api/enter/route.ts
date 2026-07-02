import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createToken } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json()

  if (!slug || !password) {
    return Response.json({ ok: false, msg: '入力内容が不正です' }, { status: 400 })
  }

  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)
  const { data: album } = await supabaseAdmin
    .from('albums')
    .select('slug, password_hash')
    .eq('slug', slug)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .single()

  if (!album) {
    return Response.json({ ok: false, msg: 'アルバムが見つかりません' })
  }

  const ok = await bcrypt.compare(password, album.password_hash)
  if (!ok) {
    return Response.json({ ok: false, msg: '合言葉が違います' })
  }

  const token = createToken(slug)
  const cookieStore = await cookies()
  cookieStore.set(`album_token_${slug}`, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 6 * 60 * 60,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  // ログイン済みの場合は永続アクセスを保存
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser()
  if (authUser) {
    const { error: upsertError } = await supabaseAdmin.from('user_album_access').upsert({
      user_id: authUser.id,
      album_slug: slug,
    }, { onConflict: 'user_id,album_slug' })
    if (upsertError) console.error('user_album_access upsert failed:', upsertError)
  }

  return Response.json({ ok: true })
}
