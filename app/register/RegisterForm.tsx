'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { DEFAULT_TERMS_REGISTER } from '@/lib/terms-defaults'

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6, boxSizing: 'border-box',
  outline: 'none', background: '#fff', color: 'var(--ink)',
}

type Props = { userId: string; email: string; terms: string | null }

export default function RegisterForm({ userId, email, terms }: Props) {
  const router = useRouter()
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const supabase = createSupabaseBrowserClient()

  const displayTerms = terms ?? DEFAULT_TERMS_REGISTER

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())  { setError('お名前を入力してください'); return }
    if (!phone.trim()) { setError('電話番号を入力してください'); return }
    if (!agreed)       { setError('利用規約に同意してください'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('user_profiles').upsert({
      id: userId,
      name: name.trim(),
      phone: phone.trim(),
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
        <input value={email} disabled
          style={{ ...INPUT, background: '#f5f3f0', color: 'var(--sub)', cursor: 'not-allowed' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          お名前 <span style={{ color: 'var(--accent)' }}>*</span>
        </span>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="山田 太郎" style={INPUT} autoFocus />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          電話番号 <span style={{ color: 'var(--accent)' }}>*</span>
        </span>
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="090-0000-0000" type="tel" style={INPUT} />
      </label>

      <div>
        <p style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 600, marginBottom: 8 }}>利用規約</p>
        <div style={{
          background: '#f8f6f2', borderRadius: 8, padding: '12px 14px',
          fontSize: 12, color: 'var(--sub)', lineHeight: 2,
          whiteSpace: 'pre-wrap', marginBottom: 12,
          maxHeight: 320, overflowY: 'auto',
        }}>
          {displayTerms}
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>上記の利用規約に同意します</span>
        </label>
      </div>

      {error && <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button type="submit" disabled={saving} style={{
        background: saving ? '#c5aa87' : 'var(--accent)', color: '#fff', border: 'none',
        padding: '13px', borderRadius: 6, fontSize: 14, fontWeight: 700,
        cursor: saving ? 'not-allowed' : 'pointer',
        marginTop: 8, letterSpacing: '0.05em',
      }}>
        {saving ? '登録中...' : '同意して登録する'}
      </button>
    </form>
  )
}
