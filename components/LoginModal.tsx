'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'

type Props = { onClose: () => void }
type Mode = 'login' | 'signup'

const INPUT_STYLE: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6,
  outline: 'none', background: '#fff', color: 'var(--ink)',
  width: '100%', boxSizing: 'border-box',
}

export default function LoginModal({ onClose }: Props) {
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')
  const [info, setInfo]         = useState('')
  const supabase = createSupabaseBrowserClient()
  const { refreshProfile } = useAuth()

  function switchMode(m: Mode) { setMode(m); setErr(''); setInfo('') }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setErr('メールアドレスとパスワードを入力してください')
      return
    }
    setLoading(true); setErr(''); setInfo('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setErr('メールアドレスまたはパスワードが違います'); setLoading(false); return }

      // 名前未登録なら登録画面へ
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles').select('name').eq('id', user.id).maybeSingle()
        if (!profile?.name) { window.location.href = '/register'; return }
      }
      await refreshProfile()
      onClose()
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setErr(error.message.includes('already registered')
          ? 'このメールアドレスは登録済みです。ログインしてください。'
          : error.message)
        setLoading(false)
        return
      }
      if (data.session) {
        // メール確認不要の場合はそのまま情報登録へ
        window.location.href = '/register'
      } else {
        setInfo('確認メールを送信しました。メールのリンクをクリックして登録を完了してください。')
        setLoading(false)
      }
    }
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
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>アカウント</h2>

        {/* モード切替 */}
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
          <input type="email" placeholder="メールアドレス" value={email}
            onChange={e => setEmail(e.target.value)} style={INPUT_STYLE} />
          <input type="password" placeholder="パスワード" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            style={INPUT_STYLE} />
          {mode === 'signup' && (
            <p style={{ fontSize: 12, color: 'var(--sub)', margin: 0, lineHeight: 1.8 }}>
              アカウント作成後、お名前・電話番号・利用規約の同意をお願いします。
            </p>
          )}
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '10px', fontSize: 14, fontWeight: 600,
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
          width: '100%', padding: '11px 16px',
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
          Googleでログイン / 新規登録
        </button>

        {err  && <p style={{ color: '#d23b3b', fontSize: 13, marginTop: 12 }}>{err}</p>}
        {info && <p style={{ color: '#2e7d4f', fontSize: 13, marginTop: 12 }}>{info}</p>}

        <button onClick={onClose} style={{
          display: 'block', width: '100%', marginTop: 16,
          padding: '8px', fontSize: 13, color: 'var(--sub)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>キャンセル</button>
      </div>
    </div>
  )
}
