import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import PasswordForm from '@/components/PasswordForm'
import AlbumLoginGate from '@/components/AlbumLoginGate'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)

  const { data: album } = await supabaseAdmin
    .from('albums')
    .select('id, slug, name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .single()

  if (!album) notFound()

  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser()

  // ログイン済みで永続アクセスがある場合はギャラリーへ
  if (authUser) {
    const { data: access } = await supabaseAdmin
      .from('user_album_access')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('album_slug', slug)
      .maybeSingle()
    if (access) redirect(`/albums/${slug}/gallery`)
  }

  return (
    <main>
      {authUser
        ? <PasswordForm slug={album.slug} albumName={album.name} />
        : <AlbumLoginGate slug={album.slug} albumName={album.name} />
      }
    </main>
  )
}
