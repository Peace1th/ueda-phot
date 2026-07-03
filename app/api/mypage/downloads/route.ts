import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const albumSlug = new URL(req.url).searchParams.get('slug')
  if (!albumSlug) return Response.json({ ok: false }, { status: 400 })

  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user?.email) return Response.json({ ok: false }, { status: 401 })

  await supabaseAdmin
    .from('download_logs')
    .delete()
    .eq('album_slug', albumSlug)
    .eq('requester_email', user.email)

  return Response.json({ ok: true })
}
