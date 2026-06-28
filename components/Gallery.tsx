'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Photo = { id: string; url: string; thumbUrl: string }

function makeWatermarkBg(text: string): string {
  const t = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='180'>
    <text x='12' y='100' transform='rotate(-28 140 90)'
      font-family='sans-serif' font-size='22' font-weight='700'
      fill='rgba(255,255,255,0.52)' stroke='rgba(0,0,0,0.09)' stroke-width='0.6'>${t}</text>
  </svg>`
  return `url("data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}")`
}

export default function Gallery({ photos, watermarkText }: { photos: Photo[]; watermarkText: string }) {
  const [current, setCurrent]     = useState<number | null>(null)
  const [lbSrc, setLbSrc]         = useState<string | null>(null)
  const [lbLoading, setLbLoading] = useState(false)
  const [hovered, setHovered]     = useState<number | null>(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const observerRef = useRef<IntersectionObserver | null>(null)
  const wmBg = makeWatermarkBg(watermarkText)

  /* 遅延読み込み */
  const observeCell = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    observerRef.current?.observe(el)
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return
        const cell = en.target as HTMLDivElement
        const img  = cell.querySelector('img') as HTMLImageElement | null
        if (!img || img.src) return
        img.src = cell.dataset.src!
        img.onload = () => img.classList.add('loaded')
        observerRef.current?.unobserve(cell)
      })
    }, { rootMargin: '400px' })
    return () => observerRef.current?.disconnect()
  }, [])

  /* ライトボックス */
  async function openLightbox(i: number) {
    setHovered(null)
    setCurrent(i)
    setLbSrc(photos[i].thumbUrl) // サムネを即表示
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
      if (e.key === 'Escape')     setCurrent(null)
      if (e.key === 'ArrowLeft')  move(-1)
      if (e.key === 'ArrowRight') move(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  /* 右クリック・ドラッグ抑止 */
  useEffect(() => {
    const block = (e: Event) => { if ((e.target as HTMLElement).closest('.protect')) e.preventDefault() }
    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart',   block)
    return () => { document.removeEventListener('contextmenu', block); document.removeEventListener('dragstart', block) }
  }, [])

  /* ホバープレビューの位置計算 */
  const previewW = 300
  const previewH = 300
  const margin   = 16
  const px = mousePos.x + margin + previewW > window.innerWidth
    ? mousePos.x - previewW - margin
    : mousePos.x + margin
  const py = Math.min(mousePos.y - previewH / 2, window.innerHeight - previewH - margin)

  return (
    <div className="protect">
      <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 16 }}>
        全 {photos.length} 枚 — ホバーでプレビュー、クリックで拡大
      </p>

      {/* グリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8 }}>
        {photos.map((p, i) => (
          <div
            key={p.id}
            ref={observeCell}
            data-src={p.thumbUrl}
            onClick={() => openLightbox(i)}
            onMouseEnter={e => { setHovered(i); setMousePos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={e  => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'relative', aspectRatio: '1/1',
              borderRadius: 6, overflow: 'hidden',
              background: '#e8e4de', cursor: 'zoom-in',
              outline: hovered === i ? '2px solid var(--accent)' : 'none',
              transition: 'outline .1s',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity .3s' }}
              onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
            />
            <div className="watermark-overlay" style={{ backgroundImage: wmBg }} />
          </div>
        ))}
      </div>

      {/* ホバープレビュー */}
      {hovered !== null && current === null && (
        <div
          style={{
            position: 'fixed',
            left: px,
            top: Math.max(margin, py),
            width: previewW,
            height: previewH,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,.35)',
            pointerEvents: 'none',
            zIndex: 50,
            background: '#e8e4de',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[hovered].thumbUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div className="watermark-overlay" style={{ backgroundImage: wmBg }} />
        </div>
      )}

      {/* ライトボックス */}
      {current !== null && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setCurrent(null) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(10,8,5,.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <button onClick={() => move(-1)} style={{ ...navBtn, left: 12 }}>‹</button>

          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <button onClick={() => setCurrent(null)} style={closeBtn}>×</button>
            {lbSrc && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lbSrc} alt=""
                  style={{
                    maxWidth: '100%', maxHeight: '86vh', objectFit: 'contain',
                    display: 'block', borderRadius: 4,
                    filter: lbLoading ? 'blur(8px)' : 'none',
                    transition: 'filter .3s',
                  }}
                />
                <div className="watermark-overlay" style={{ backgroundImage: wmBg, borderRadius: 4 }} />
              </>
            )}
          </div>

          <button onClick={() => move(1)} style={{ ...navBtn, right: 12 }}>›</button>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  position: 'fixed', top: '50%', transform: 'translateY(-50%)',
  color: '#fff', fontSize: 36, cursor: 'pointer',
  padding: '12px 16px', opacity: 0.7, background: 'none', border: 'none',
  userSelect: 'none',
}

const closeBtn: React.CSSProperties = {
  position: 'absolute', top: -44, right: 0,
  color: '#fff', fontSize: 28, cursor: 'pointer',
  background: 'none', border: 'none', lineHeight: 1,
}
