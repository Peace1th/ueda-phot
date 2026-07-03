'use client'

import { useState } from 'react'
import Link from 'next/link'

type AlbumInfo = { slug: string; name: string }
type DlEntry = { count: number; lastAt: string }

export default function DownloadHistory({
  dlMap: initialDlMap,
  albums,
}: {
  dlMap: Record<string, DlEntry>
  albums: AlbumInfo[]
}) {
  const [dlMap, setDlMap] = useState(initialDlMap)
  const [deleting, setDeleting] = useState<string | null>(null)

  const entries = Object.entries(dlMap)
  const albumMap = Object.fromEntries(albums.map(a => [a.slug, a]))

  async function handleDelete(slug: string) {
    setDeleting(slug)
    await fetch(`/api/mypage/downloads?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
    setDlMap(prev => {
      const next = { ...prev }
      delete next[slug]
      return next
    })
    setDeleting(null)
  }

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
            const isDeleting = deleting === slug
            return (
              <div key={slug} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#fff', border: '1px solid var(--line)',
                borderRadius: 8, gap: 12, opacity: isDeleting ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {album?.name ?? slug}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 3 }}>
                    {date} · {count}枚
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/albums/${slug}/gallery`} style={{
                    fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                    border: '1px solid var(--accent)', borderRadius: 4, padding: '5px 12px',
                  }}>
                    再DL →
                  </Link>
                  <button
                    onClick={() => handleDelete(slug)}
                    disabled={isDeleting}
                    style={{
                      fontSize: 12, color: 'var(--sub)', background: 'none',
                      border: '1px solid var(--line)', borderRadius: 4, padding: '5px 10px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
