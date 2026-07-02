import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { verifyToken } from '@/lib/auth'
import { listDrivePhotos } from '@/lib/drive'
import Gallery from '@/components/Gallery'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params

  // Supabase Auth チェック（ログイン必須）
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser()
  if (!authUser) {
    redirect(`/albums/${slug}`)
  }

  // アルバムトークン OR 永続アクセスチェック
  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  const hasTokenAccess = !!(token && verifyToken(token, slug))

  let hasPersistentAccess = false
  if (!hasTokenAccess) {
    const { data: access } = await supabaseAdmin
      .from('user_album_access')
      .select('id')
      .eq('user_id', authUser!.id)
      .eq('album_slug', slug)
      .maybeSingle()
    hasPersistentAccess = !!access
  }

  if (!hasTokenAccess && !hasPersistentAccess) {
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

  // 閲覧ログ記録（IP・UA・地域）
  const hdrs = await headers()
  const forwarded = hdrs.get('x-forwarded-for')
  const ip        = forwarded ? forwarded.split(',')[0].trim() : (hdrs.get('x-real-ip') ?? null)
  const ua        = hdrs.get('user-agent') ?? null
  const rawCity   = hdrs.get('x-vercel-ip-city')
  const city      = rawCity ? decodeURIComponent(rawCity) : null
  const country   = hdrs.get('x-vercel-ip-country') ?? null
  const region    = hdrs.get('x-vercel-ip-country-region') ?? null
  const latitude  = hdrs.get('x-vercel-ip-latitude') ?? null
  const longitude = hdrs.get('x-vercel-ip-longitude') ?? null
  const timezone  = hdrs.get('x-vercel-ip-timezone') ?? null

  // ログイン済みユーザー情報を取得（上でチェック済みなので authUser は必ず存在）
  let viewerUserId: string | null = null
  let viewerName: string | null   = null
  let viewerEmail: string | null  = null
  if (authUser) {
    viewerUserId = authUser.id
    viewerEmail  = authUser.email ?? null
    const { data: prof } = await supabaseAdmin
      .from('user_profiles').select('name').eq('id', authUser.id).single()
    viewerName = prof?.name ?? null
  }

  await supabaseAdmin.from('view_logs').insert({
    album_slug: slug, ip_address: ip, user_agent: ua,
    city, country, region, latitude, longitude, timezone,
    viewer_user_id: viewerUserId, viewer_name: viewerName, viewer_email: viewerEmail,
  })

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
