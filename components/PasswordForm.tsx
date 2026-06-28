'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function PasswordForm({ slug, albumName }: { slug: string; albumName: string }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit() {
    if (!pw.trim()) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password: pw }),
      })
      const data = await res.json()
      if (data.ok) {
        router.push(`/albums/${slug}/gallery`)
        router.refresh()
      } else {
        setErr(data.msg ?? '合言葉が違います')
        setPw('')
        inputRef.current?.focus()
      }
    } catch {
      setErr('通信に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '10vh auto 0', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
        Private Album
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{albumName}</h1>
      <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.8, marginBottom: 28 }}>
        このアルバムはお客様専用です。<br />担当者からお伝えした合言葉を入力してください。
      </p>

      <input
        ref={inputRef}
        type="password"
        inputMode="text"
        autoComplete="off"
        placeholder="合言葉"
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        style={{
          width: '100%', padding: '13px 16px', fontSize: 16,
          border: '1px solid var(--line)', borderRadius: 6,
          outline: 'none', textAlign: 'center',
          background: '#fff', color: 'var(--ink)',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,115,85,.12)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.boxShadow = 'none' }}
      />

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: '100%', marginTop: 12, padding: '13px',
          fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
          border: 'none', borderRadius: 6,
          background: loading ? 'var(--accent-light)' : 'var(--accent)',
          color: '#fff', cursor: loading ? 'default' : 'pointer',
          transition: 'background .15s',
        }}
      >
        {loading ? '確認中…' : '写真を見る'}
      </button>

      <div style={{ marginTop: 12, fontSize: 12, color: '#d23b3b', minHeight: 18 }}>{err}</div>
    </div>
  )
}
