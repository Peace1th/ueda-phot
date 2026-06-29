'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = { onClose: () => void }

export default function LoginModal({ onClose }: Props) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const supabase = createSupabaseBrowserClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function sendMagicLink() {
    if (!email.trim()) { setErr('メールアドレスを入力してください'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setErr(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(10,8,5,.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '32px 28px',
        maxWidth: 380, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,.3)',
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>ログイン</h2>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 24, lineHeight: 1.7 }}>
          ログインするとダウンロード時の情報入力を省略できます
        </p>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 14, lineHeight: 1.9 }}>
              <strong>{email}</strong><br />
              にログインリンクを送信しました。<br />
              メールのリンクをクリックしてください。
            </p>
            <button onClick={onClose} style={{
              marginTop: 20, padding: '10px 24px', fontSize: 14,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>閉じる</button>
          </div>
        ) : (
          <>
            <button onClick={signInWithGoogle} style={{
              width: '100%', padding: '11px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 14, fontWeight: 600,
              background: '#fff', color: '#3c4043',
              border: '1px solid #dadce0', borderRadius: 6, cursor: 'pointer',
              marginBottom: 20,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Googleでログイン
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>または</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email" placeholder="メールアドレス" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMagicLink() }}
                style={{
                  padding: '9px 12px', fontSize: 14,
                  border: '1px solid var(--line)', borderRadius: 6,
                  outline: 'none', background: '#fff', color: 'var(--ink)',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
              <button onClick={sendMagicLink} disabled={loading} style={{
                padding: '10px', fontSize: 14, fontWeight: 600,
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 6,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '送信中…' : 'メールでログインリンクを受け取る'}
              </button>
            </div>

            {err && <p style={{ color: '#d23b3b', fontSize: 13, marginTop: 12 }}>{err}</p>}

            <button onClick={onClose} style={{
              display: 'block', width: '100%', marginTop: 16,
              padding: '8px', fontSize: 13, color: 'var(--sub)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>キャンセル</button>
          </>
        )}
      </div>
    </div>
  )
}
