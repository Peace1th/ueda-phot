import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import PasswordForm from '@/components/PasswordForm'

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

  // 認証済みなら直接ギャラリーへリダイレクト
  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  if (token && verifyToken(token, slug)) {
    const { redirect } = await import('next/navigation')
    redirect(`/albums/${slug}/gallery`)
  }

  return (
    <main>
      <PasswordForm slug={album.slug} albumName={album.name} />
    </main>
  )
}
