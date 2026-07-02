import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') as 'email' | 'recovery' | 'magiclink' | null
  const next      = searchParams.get('next') ?? '/'

  // セッションCookieの書き込み先として一時レスポンスを作成
  const tempResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            tempResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  if (tokenHash && type) {
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  } else if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 名前未登録のユーザーは登録画面へ
  let redirectTo = next
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.name) redirectTo = '/register'
  }

  const finalResponse = NextResponse.redirect(`${origin}${redirectTo}`)
  tempResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    finalResponse.cookies.set(name, value, rest)
  })
  return finalResponse
}
