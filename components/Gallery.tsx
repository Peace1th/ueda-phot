'use client'

import { useState, useEffect, useRef } from 'react'
import DownloadModal from './DownloadModal'

type Photo = { id: string; url: string; thumbUrl: string; caption?: string }

type Props = {
  photos: Photo[]
  watermarkText: string
  slug: string
  downloadEnabled: boolean
}

function makeWatermarkBg(text: string): string {
  const t = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='180'>
    <text x='12' y='100' transform='rotate(-28 140 90)'
      font-family='sans-serif' font-size='22' font-weight='700'
      fill='rgba(255,255,255,0.52)' stroke='rgba(0,0,0,0.09)' stroke-width='0.6'>${t}</text>
  </svg>`
  return `url("data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}")`
}

const MAX_SELECT = 10

export default function Gallery({ photos, watermarkText, slug, downloadEnabled }: Props) {
  const [current, setCurrent]     = useState<number | null>(null)
  const [lbSrc, setLbSrc]         = useState<string | null>(null)
  const [lbLoading, setLbLoading] = useState(false)
  const [hovered, setHovered]     = useState<number | null>(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [dlFileIds, setDlFileIds] = useState<string[] | null>(null)

  // ピンチズーム
  const [lbScale, setLbScale]   = useState(1)
  const [lbOffset, setLbOffset] = useState({ x: 0, y: 0 })
  const pinchRef = useRef({ dist: 0, x: 0, y: 0, isPinching: false })

  const wmBg = makeWatermarkBg(watermarkText)

  function resetZoom() { setLbScale(1); setLbOffset({ x: 0, y: 0 }) }

  function getTouchDist(t: React.TouchList) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  }
  function onLbTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: getTouchDist(e.touches), x: 0, y: 0, isPinching: true }
    } else if (e.touches.length === 1) {
      pinchRef.current = { ...pinchRef.current, x: e.touches[0].clientX, y: e.touches[0].clientY, isPinching: false }
    }
  }
  function onLbTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const d = getTouchDist(e.touches)
      const ratio = d / (pinchRef.current.dist || d)
      pinchRef.current.dist = d
      setLbScale(s => {
        const next = Math.max(1, Math.min(5, s * ratio))
        if (next === 1) setLbOffset({ x: 0, y: 0 })
        return next
      })
    } else if (e.touches.length === 1 && !pinchRef.current.isPinching) {
      setLbScale(s => {
        if (s <= 1) return s
        const dx = e.touches[0].clientX - pinchRef.current.x
        const dy = e.touches[0].clientY - pinchRef.current.y
        setLbOffset(o => ({ x: o.x + dx, y: o.y + dy }))
        return s
      })
      pinchRef.current.x = e.touches[0].clientX
      pinchRef.current.y = e.touches[0].clientY
    }
  }
  function onLbTouchEnd(e: React.TouchEvent) {
    pinchRef.current.isPinching = e.touches.length >= 2
    if (e.touches.length === 1) {
      pinchRef.current.x = e.touches[0].clientX
      pinchRef.current.y = e.touches[0].clientY
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else if (next.size < MAX_SELECT) next.add(i)
      return next
    })
  }

  async function openLightbox(i: number) {
    resetZoom()
    setHovered(null)
    setCurrent(i)
    setLbSrc(photos[i].thumbUrl)
    setLbLoading(true)
    const img = new Image()
    img.onload  = () => { setLbSrc(img.src); setLbLoading(false) }
    img.onerror = () => setLbLoading(false)
    img.src = photos[i].url
  }

  function move(d: number) {
    const next = (current ?? 0) + d
    if (next < 0 || next >= photos.length) return
    openLightbox(next)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (current === null) return
      if (e.key === 'Escape')     { setCurrent(null); resetZoom() }
      if (e.key === 'ArrowLeft')  move(-1)
      if (e.key === 'ArrowRight') move(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  useEffect(() => {
    const block = (e: Event) => { if ((e.target as HTMLElement).closest('.protect')) e.preventDefault() }
    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart',   block)
    return () => { document.removeEventListener('contextmenu', block); document.removeEventListener('dragstart', block) }
  }, [])

  const previewW = 300, previewH = 300, margin = 16
  const px = mousePos.x + margin + previewW > window.innerWidth
    ? mousePos.x - previewW - margin : mousePos.x + margin
  const py = Math.min(mousePos.y - previewH / 2, window.innerHeight - previewH - margin)
  const atMax = selected.size >= MAX_SELECT

  return (
    <div className="protect">
      <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 16 }}>
        全 {photos.length} 枚 — ホバーでプレビュー、クリックで拡大
        {downloadEnabled && <span style={{ marginLeft: 8 }}>· チェックで複数選択DL（最大{MAX_SELECT}枚）</span>}
      </p>

      {/* グリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8 }}>
        {photos.map((p, i) => (
          <div key={p.id}
            onMouseEnter={e => { setHovered(i); setMousePos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={e  => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'relative', aspectRatio: '1/1', borderRadius: 6,
              overflow: 'hidden', background: '#e8e4de',
              outline: selected.has(i) ? '3px solid var(--accent)' : hovered === i ? '2px solid var(--accent)' : 'none',
              transition: 'outline .1s',
            }}
          >
            <div onClick={() => openLightbox(i)}
              style={{ position: 'absolute', inset: 0, cursor: 'zoom-in', zIndex: 0 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumbUrl} loading="lazy" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity .3s' }}
              onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }} />
            <div className="watermark-overlay" style={{ backgroundImage: wmBg }} />
            {selected.has(i) && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(157,124,92,0.22)', zIndex: 1, pointerEvents: 'none' }} />
            )}
            {downloadEnabled && (
              <div onClick={e => { e.stopPropagation(); toggleSelect(i) }}
                title={atMax && !selected.has(i) ? `最大${MAX_SELECT}枚まで` : undefined}
                style={{
                  position: 'absolute', top: 6, left: 6, zIndex: 3,
                  width: 22, height: 22, borderRadius: 4, boxSizing: 'border-box',
                  background: selected.has(i) ? 'var(--accent)' : 'rgba(0,0,0,0.35)',
                  border: `2px solid ${selected.has(i) ? 'var(--accent)' : 'rgba(255,255,255,0.9)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: atMax && !selected.has(i) ? 'not-allowed' : 'pointer',
                  opacity: hovered === i || selected.has(i) || selected.size > 0 ? 1 : 0,
                  transition: 'opacity .15s, background .15s',
                }}>
                {selected.has(i) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1, userSelect: 'none' }}>✓</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ホバープレビュー */}
      {hovered !== null && current === null && (
        <div style={{
          position: 'fixed', left: px, top: Math.max(margin, py),
          width: previewW, height: previewH, borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,.35)', pointerEvents: 'none', zIndex: 50, background: '#e8e4de',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[hovered].thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="watermark-overlay" style={{ backgroundImage: wmBg }} />
        </div>
      )}

      {/* ライトボックス */}
      {current !== null && (
        <div onClick={e => { if (e.target === e.currentTarget) { setCurrent(null); resetZoom() } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(10,8,5,.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <button onClick={() => move(-1)} style={{ ...navBtn, left: 12 }}>‹</button>

          <div style={{ position: 'relative', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setCurrent(null); resetZoom() }} style={closeBtn}>×</button>
            {downloadEnabled && (
              <button onClick={e => { e.stopPropagation(); setDlFileIds([photos[current].id]) }} style={dlBtn}>
                ↓ ダウンロード
              </button>
            )}
            {lbSrc && (
              <>
                {/* ピンチズーム対応コンテナ */}
                <div
                  onTouchStart={onLbTouchStart}
                  onTouchMove={onLbTouchMove}
                  onTouchEnd={onLbTouchEnd}
                  onDoubleClick={resetZoom}
                  style={{
                    position: 'relative', display: 'inline-block',
                    transform: `scale(${lbScale}) translate(${lbOffset.x / lbScale}px, ${lbOffset.y / lbScale}px)`,
                    transformOrigin: 'center',
                    touchAction: 'none',
                    cursor: lbScale > 1 ? 'grab' : 'default',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lbSrc} alt=""
                    style={{
                      maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain',
                      display: 'block', borderRadius: 4,
                      filter: lbLoading ? 'blur(8px)' : 'none', transition: 'filter .3s',
                      userSelect: 'none', WebkitUserSelect: 'none',
                    }}
                  />
                  <div className="watermark-overlay" style={{ backgroundImage: wmBg, borderRadius: 4 }} />
                </div>

                {/* キャプション */}
                {photos[current].caption && (
                  <p style={{
                    color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.7,
                    textAlign: 'center', maxWidth: 560, margin: 0,
                  }}>
                    {photos[current].caption}
                  </p>
                )}
              </>
            )}
          </div>

          <button onClick={() => move(1)} style={{ ...navBtn, right: 12 }}>›</button>
        </div>
      )}

      {/* フローティングカートバー */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 80, background: 'rgba(20,15,8,0.94)', backdropFilter: 'blur(8px)',
          color: '#fff', borderRadius: 40, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 14 }}>
            {selected.size} / {MAX_SELECT} 枚選択中
            {atMax && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>（上限）</span>}
          </span>
          {downloadEnabled && (
            <button onClick={() => setDlFileIds([...selected].map(i => photos[i].id))} style={{
              padding: '7px 20px', fontSize: 13, fontWeight: 700,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 20, cursor: 'pointer',
            }}>まとめてダウンロード</button>
          )}
          <button onClick={() => setSelected(new Set())} style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}

      {/* ダウンロードモーダル */}
      {dlFileIds !== null && (
        <DownloadModal fileIds={dlFileIds} slug={slug} onClose={() => setDlFileIds(null)} />
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  position: 'fixed', top: '50%', transform: 'translateY(-50%)',
  color: '#fff', fontSize: 36, cursor: 'pointer',
  padding: '12px 16px', opacity: 0.7, background: 'none', border: 'none', userSelect: 'none',
}
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: -44, right: 0,
  color: '#fff', fontSize: 28, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1,
}
const dlBtn: React.CSSProperties = {
  position: 'absolute', top: -44, left: 0,
  color: '#fff', fontSize: 13, cursor: 'pointer',
  padding: '7px 14px', background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, lineHeight: 1, whiteSpace: 'nowrap',
}
