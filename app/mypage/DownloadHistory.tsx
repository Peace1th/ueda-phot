import Link from 'next/link'

type AlbumInfo = { slug: string; name: string }
type DlEntry = { count: number; lastAt: string }

export default function DownloadHistory({
  dlMap,
  albums,
}: {
  dlMap: Record<string, DlEntry>
  albums: AlbumInfo[]
}) {
  const entries = Object.entries(dlMap)
  const albumMap = Object.fromEntries(albums.map(a => [a.slug, a]))

  return (
    <section style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '24px 28px', marginBottom: 28,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', letterSpacing: '0.05em' }}>DL履歴</h2>
      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--sub)', margin: 0 }}>ダウンロード履歴はありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(([slug, { count, lastAt }]) => {
            const album = albumMap[slug]
            const date = new Date(lastAt).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric',
            })
            return (
              <div key={slug} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#fff', border: '1px solid var(--line)',
                borderRadius: 8, gap: 12,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {album?.name ?? slug}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 3 }}>
                    {date} · {count}枚
                  </div>
                </div>
                <Link href={`/albums/${slug}/gallery`} style={{
                  fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                  border: '1px solid var(--accent)', borderRadius: 4, padding: '5px 12px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  再DL →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
