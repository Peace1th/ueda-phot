import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AlbumsPage() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)

  const { data: albums } = await supabaseAdmin
    .from('albums')
    .select('id, slug, name, description, cover_file_id, start_date, end_date')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('created_at', { ascending: false })

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      <style>{`
        .album-card { transition: transform .15s, box-shadow .15s; }
        .album-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(20,15,5,.10); }
      `}</style>

      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
        アルバム一覧
      </h1>
      <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 40 }}>
        各アルバムは合言葉でお守りしています。担当者からお伝えした合言葉をご用意ください。
      </p>

      {(!albums || albums.length === 0) && (
        <p style={{ color: 'var(--sub)', textAlign: 'center', padding: '80px 0', fontSize: 14 }}>
          現在公開中のアルバムはありません。
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
        {albums?.map(album => {
          const thumb = album.cover_file_id
            ? `/api/cover?fileId=${album.cover_file_id}`
            : null

          return (
            <Link key={album.id} href={`/albums/${album.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="album-card" style={{
                background: 'var(--card)', border: '1px solid var(--line)',
                borderRadius: 10, overflow: 'hidden',
              }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', background: '#e8e4de', overflow: 'hidden' }}>
                  {thumb
                    ? <img src={thumb} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--sub)', fontSize: 32 }}>📷</div>
                  }
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    background: 'rgba(0,0,0,.55)', color: '#fff',
                    fontSize: 10, padding: '3px 8px', borderRadius: 20,
                    letterSpacing: '0.05em',
                  }}>🔒 合言葉必要</div>
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{album.name}</div>
                  {album.description && (
                    <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.6 }}>{album.description}</div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
