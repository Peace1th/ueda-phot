'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = { slug: string; albumName: string }

export default function AlbumLoginGate({ slug, albumName }: Props) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const supabase = createSupabaseBrowserClient()

  async function sendMagicLink() {
    if (!email.trim()) { setErr('メールアドレスを入力してください'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/albums/${slug}` },
    })
    if (error) { setErr(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 360, margin: '10vh auto 0', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
        Private Album
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{albumName}</h1>
      <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.8, marginBottom: 32 }}>
        このアルバムを閲覧するには<br />ログインが必要です。
      </p>

      {sent ? (
        <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '24px 20px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.9, margin: 0 }}>
            <strong>{email}</strong><br />
            にログインリンクを送信しました。<br />
            メールのリンクをクリックしてください。
          </p>
        </div>
      ) : (
        <>
          <input
            type="email" placeholder="メールアドレス" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMagicLink() }}
            style={{
              width: '100%', padding: '13px 16px', fontSize: 14,
              border: '1px solid var(--line)', borderRadius: 6,
              outline: 'none', background: '#fff', color: 'var(--ink)',
              boxSizing: 'border-box', marginBottom: 10,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--line)' }}
          />
          <button onClick={sendMagicLink} disabled={loading} style={{
            width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
            background: loading ? 'var(--accent-light)' : 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 6, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading ? '送信中…' : 'メールでログインリンクを受け取る'}
          </button>

          {err && <p style={{ color: '#d23b3b', fontSize: 13, marginTop: 12 }}>{err}</p>}
        </>
      )}
    </div>
  )
}
