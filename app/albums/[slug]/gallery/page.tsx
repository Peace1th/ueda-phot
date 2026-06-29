import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { listDrivePhotos } from '@/lib/drive'
import Gallery from '@/components/Gallery'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params

  // 認証チェック
  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  if (!token || !verifyToken(token, slug)) {
    redirect(`/albums/${slug}`)
  }

  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)
  const { data: album } = await supabaseAdmin
    .from('albums')
    .select('id, slug, name, drive_folder_id, watermark_text, download_enabled')
    .eq('slug', slug)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .single()

  if (!album) notFound()

  // 閲覧ログ記録
  await supabaseAdmin.from('view_logs').insert({ album_slug: slug })

  // Google Drive からフォルダ内の写真一覧を取得
  let photos: { id: string; url: string; thumbUrl: string; caption?: string }[] = []
  try {
    const files = await listDrivePhotos(album.drive_folder_id)

    // キャプション取得
    const fileIds = files.map(f => f.id)
    const { data: captionRows } = fileIds.length
      ? await supabaseAdmin.from('photo_captions').select('file_id, caption').in('file_id', fileIds)
      : { data: [] }
    const captionMap: Record<string, string> = {}
    ;(captionRows ?? []).forEach(r => { captionMap[r.file_id] = r.caption })

    photos = files.map(f => ({
      id: f.id,
      thumbUrl: `/api/photo?fileId=${f.id}&slug=${slug}&size=thumb`,
      url:      `/api/photo?fileId=${f.id}&slug=${slug}&size=medium`,
      caption:  captionMap[f.id] || undefined,
    }))
  } catch (e) {
    console.error('Drive fetch error:', e)
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', margin: 0 }}>{album.name}</h1>
        <a href="/albums" style={{ fontSize: 12, color: 'var(--sub)', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>
          ← アルバム一覧に戻る
        </a>
      </div>
      <Gallery
        photos={photos}
        watermarkText={album.watermark_text ?? '上田写真館'}
        slug={slug}
        downloadEnabled={album.download_enabled ?? true}
      />
    </main>
  )
}
