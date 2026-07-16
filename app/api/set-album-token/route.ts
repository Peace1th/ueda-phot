import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { createToken } from '@/lib/auth'

// 永続アクセスを持つログイン済みユーザーにアルバムCookieをセットしてギャラリーへ戻す
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const slug = searchParams.get('slug')
  const next = searchParams.get('next') ?? '/'

  if (!slug) return NextResponse.redirect(`${origin}${next}`)

  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (user) {
    const { data: access } = await supabaseAdmin
      .from('user_album_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('album_slug', slug)
      .maybeSingle()

    if (access) {
      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.set(`album_token_${slug}`, createToken(slug), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 6 * 60 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
      return response
    }
  }

  return NextResponse.redirect(`${origin}/albums/${slug}`)
}
