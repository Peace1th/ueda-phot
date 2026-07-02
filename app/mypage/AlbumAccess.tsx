import Link from 'next/link'

type AlbumInfo = { slug: string; name: string; end_date: string | null; is_active: boolean }
type AccessEntry = { album_slug: string; granted_at: string }

export default function AlbumAccess({
  accessList,
  albums,
}: {
  accessList: AccessEntry[]
  albums: AlbumInfo[]
}) {
  if (accessList.length === 0) return null

  const albumMap = Object.fromEntries(albums.map(a => [a.slug, a]))
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)

  return (
    <section style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '24px 28px', marginBottom: 28,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', letterSpacing: '0.05em' }}>アクセス済みアルバム</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accessList.map(({ album_slug, granted_at }) => {
          const album = albumMap[album_slug]
          const expired = !album?.is_active || (album?.end_date ? album.end_date < today : false)
          const date = new Date(granted_at).toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
          return (
            <div key={album_slug} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: '#fff', border: '1px solid var(--line)',
              borderRadius: 8, gap: 12, opacity: expired ? 0.5 : 1,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {album?.name ?? album_slug}
                  {expired && (
                    <span style={{ fontSize: 10, color: 'var(--sub)', marginLeft: 8, fontWeight: 400 }}>
                      公開終了
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 3 }}>
                  解錠日：{date}
                </div>
              </div>
              {!expired && (
                <Link href={`/albums/${album_slug}/gallery`} style={{
                  fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                  border: '1px solid var(--accent)', borderRadius: 4, padding: '5px 12px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  開く →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
