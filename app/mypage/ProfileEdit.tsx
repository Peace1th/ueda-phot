'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const INPUT: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6,
  background: '#fff', color: 'var(--ink)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

type Props = {
  userId: string
  email: string
  initialName: string
  initialPhone: string
}

export default function ProfileEdit({ userId, email, initialName, initialPhone }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName]   = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState('')
  const supabase = createSupabaseBrowserClient()

  async function handleSave() {
    setSaving(true)
    await supabase.from('user_profiles').upsert({
      id: userId,
      name: name.trim() || null,
      phone: phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setEditing(false)
    setMsg('保存しました')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <section style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '24px 28px', marginBottom: 28,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>プロフィール</h2>
        {!editing && (
          <button onClick={() => { setEditing(true); setMsg('') }} style={{
            background: 'none', border: '1px solid var(--line)', borderRadius: 5,
            padding: '5px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--ink)',
          }}>編集</button>
        )}
      </div>

      {!editing ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { label: 'メールアドレス', value: email },
            { label: 'お名前',         value: name  || '—' },
            { label: '電話番号',       value: phone || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
              <span style={{ width: 120, fontSize: 12, color: 'var(--sub)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14 }}>{value}</span>
            </div>
          ))}
          {msg && <p style={{ fontSize: 13, color: '#2e7d4f', margin: 0 }}>{msg}</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>メールアドレス</span>
            <input value={email} readOnly style={{ ...INPUT, background: '#f5f3f0', color: 'var(--sub)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>お名前</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="山田 太郎" style={INPUT} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>電話番号</span>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="090-0000-0000" type="tel" style={INPUT} />
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '9px 24px',
              background: saving ? 'var(--accent-light)' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            }}>{saving ? '保存中…' : '保存する'}</button>
            <button onClick={() => { setEditing(false); setName(initialName); setPhone(initialPhone) }} style={{
              padding: '9px 18px', background: '#fff', color: 'var(--sub)',
              border: '1px solid var(--line)', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            }}>キャンセル</button>
          </div>
        </div>
      )}
    </section>
  )
}
