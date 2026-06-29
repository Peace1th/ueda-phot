'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = { slug: string; albumName: string }
type Mode = 'login' | 'signup'

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '13px 16px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6,
  outline: 'none', background: '#fff', color: 'var(--ink)',
  boxSizing: 'border-box',
}

export default function AlbumLoginGate({ slug, albumName }: Props) {
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')
  const [info, setInfo]         = useState('')
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  function switchMode(m: Mode) { setMode(m); setErr(''); setInfo('') }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/albums/${slug}` },
    })
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { setErr('メールアドレスとパスワードを入力してください'); return }
    if (mode === 'signup' && !name.trim()) { setErr('お名前を入力してください'); return }
    setLoading(true); setErr(''); setInfo('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErr('メールアドレスまたはパスワードが違います')
        setLoading(false)
        return
      }
      router.refresh()
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message.includes('already registered')) {
          setErr('このメールアドレスは登録済みです。ログインしてください。')
        } else {
          setErr(error.message)
        }
        setLoading(false)
        return
      }
      if (data.user && name.trim()) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id, name: name.trim(), updated_at: new Date().toISOString(),
        })
      }
      if (data.session) {
        router.refresh()
      } else {
        setInfo('確認メールを送信しました。メールのリンクをクリックしてからログインしてください。')
        setLoading(false)
      }
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '10vh auto 0', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
        Private Album
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{albumName}</h1>
      <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.8, marginBottom: 28 }}>
        このアルバムを閲覧するにはログインが必要です。
      </p>

      {/* モード切替タブ */}
      <div style={{ display: 'flex', borderRadius: 8, background: '#f0ece6', padding: 4, marginBottom: 20 }}>
        {(['login', 'signup'] as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)} style={{
            flex: 1, padding: '8px', fontSize: 13, fontWeight: m === mode ? 700 : 400,
            background: m === mode ? '#fff' : 'transparent',
            color: m === mode ? 'var(--ink)' : 'var(--sub)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            boxShadow: m === mode ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            transition: 'all .15s',
          }}>
            {m === 'login' ? 'ログイン' : '新規登録'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mode === 'signup' && (
          <input type="text" placeholder="お名前" value={name}
            onChange={e => setName(e.target.value)} style={INPUT_STYLE}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--line)' }} />
        )}
        <input type="email" placeholder="メールアドレス" value={email}
          onChange={e => setEmail(e.target.value)} style={INPUT_STYLE}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--line)' }} />
        <input type="password" placeholder="パスワード" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          style={INPUT_STYLE}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--line)' }} />

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
          background: loading ? 'var(--accent-light)' : 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 6, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? '処理中…' : (mode === 'login' ? 'ログイン' : 'アカウントを作成')}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>または</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>

      <button onClick={signInWithGoogle} style={{
        width: '100%', padding: '13px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontSize: 14, fontWeight: 600,
        background: '#fff', color: '#3c4043',
        border: '1px solid #dadce0', borderRadius: 6, cursor: 'pointer',
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
        </svg>
        Googleでログイン
      </button>

      {err && <p style={{ color: '#d23b3b', fontSize: 13, marginTop: 12 }}>{err}</p>}
      {info && <p style={{ color: '#2e7d4f', fontSize: 13, marginTop: 12 }}>{info}</p>}
    </div>
  )
}
