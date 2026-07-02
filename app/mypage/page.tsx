import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import ProfileEdit from './ProfileEdit'
import DownloadHistory from './DownloadHistory'
import AlbumAccess from './AlbumAccess'

export const dynamic = 'force-dynamic'

export default async function MyPage() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/')

  const [profileRes, downloadsRes, accessRes] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('name, phone')
      .eq('id', user.id)
      .maybeSingle(),
    user.email
      ? supabaseAdmin
          .from('download_logs')
          .select('album_slug, file_id, created_at')
          .eq('requester_email', user.email)
          .order('created_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as { album_slug: string; file_id: string; created_at: string }[], error: null }),
    supabaseAdmin
      .from('user_album_access')
      .select('album_slug, granted_at')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false }),
  ])

  // アクセス済みアルバムの詳細を取得
  const accessSlugs = (accessRes.data ?? []).map(a => a.album_slug)
  const dlSlugs = [...new Set((downloadsRes.data ?? []).map(d => d.album_slug))]
  const allSlugs = [...new Set([...accessSlugs, ...dlSlugs])]

  const albumsRes = allSlugs.length
    ? await supabaseAdmin
        .from('albums')
        .select('slug, name, end_date, is_active')
        .in('slug', allSlugs)
    : { data: [] as { slug: string; name: string; end_date: string | null; is_active: boolean }[] }

  // DLログをアルバムごとにグループ化（最新日時・枚数）
  const dlMap: Record<string, { count: number; lastAt: string }> = {}
  for (const row of (downloadsRes.data ?? [])) {
    if (!dlMap[row.album_slug]) {
      dlMap[row.album_slug] = { count: 0, lastAt: row.created_at }
    }
    dlMap[row.album_slug].count++
  }

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 32 }}>
        マイページ
      </h1>

      <ProfileEdit
        userId={user.id}
        email={user.email ?? ''}
        initialName={profileRes.data?.name ?? ''}
        initialPhone={profileRes.data?.phone ?? ''}
      />

      <DownloadHistory
        dlMap={dlMap}
        albums={albumsRes.data ?? []}
      />

      <AlbumAccess
        accessList={accessRes.data ?? []}
        albums={albumsRes.data ?? []}
      />
    </main>
  )
}
