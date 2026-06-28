import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
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

  return (
    <main>
      <PasswordForm slug={album.slug} albumName={album.name} />
    </main>
  )
}
