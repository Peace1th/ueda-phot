'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6, boxSizing: 'border-box',
  outline: 'none', background: '#fff', color: 'var(--ink)',
}

export default function RegisterForm({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const supabase = createSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('お名前を入力してください'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('user_profiles').upsert({
      id: userId,
      name: name.trim(),
      phone: phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    if (err) { setError('保存できませんでした。もう一度お試しください。'); setSaving(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>メールアドレス</span>
        <input value={email} disabled style={{ ...INPUT, background: '#f5f3f0', color: 'var(--sub)', cursor: 'not-allowed' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          お名前 <span style={{ color: 'var(--accent)' }}>*</span>
        </span>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="山田 太郎" style={INPUT} autoFocus
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>電話番号（任意）</span>
        <input
          value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="090-0000-0000" type="tel" style={INPUT}
        />
      </label>
      {error && <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{error}</p>}
      <button
        type="submit" disabled={saving}
        style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '13px', borderRadius: 6, fontSize: 14, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          marginTop: 8, letterSpacing: '0.05em',
        }}
      >
        {saving ? '登録中...' : '登録して始める'}
      </button>
    </form>
  )
}
