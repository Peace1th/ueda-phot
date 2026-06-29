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

  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback?next=/albums/${slug}`
    : `/auth/callback?next=/albums/${slug}`

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/albums/${slug}` },
    })
  }

  async function sendMagicLink() {
    if (!email.trim()) { setErr('メールアドレスを入力してください'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
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
          <button onClick={signInWithGoogle} style={{
            width: '100%', padding: '13px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 600,
            background: '#fff', color: '#3c4043',
            border: '1px solid #dadce0', borderRadius: 6, cursor: 'pointer',
            marginBottom: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Googleでログイン
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>または</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

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
