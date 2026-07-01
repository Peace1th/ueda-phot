'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const INPUT: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6,
  background: '#fff', color: 'var(--ink)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
      <span style={{ width: 110, fontSize: 12, color: 'var(--sub)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  )
}

export default function ProfileSection() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState('')
  const supabase = createSupabaseBrowserClient()

  if (loading || !user) return null

  function startEdit() {
    setName(profile?.name ?? '')
    setPhone(profile?.phone ?? '')
    setEditing(true)
    setMsg('')
  }

  async function save() {
    setSaving(true)
    await supabase.from('user_profiles').upsert({
      id: user!.id,
      name: name.trim() || null,
      phone: phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    await refreshProfile()
    setSaving(false)
    setEditing(false)
    setMsg('保存しました')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <section style={{ maxWidth: 560, margin: '48px auto 0', padding: '0 24px' }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 10, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>マイアカウント</h2>
          <button onClick={signOut} style={{
            fontSize: 12, color: 'var(--sub)', background: 'none',
            border: 'none', cursor: 'pointer', padding: '4px 8px',
          }}>ログアウト</button>
        </div>

        {!editing ? (
          <div>
            <div style={{ display: 'grid', gap: 14 }}>
              <Row label="メールアドレス" value={user.email ?? '—'} />
              <Row label="お名前"         value={profile?.name  ?? '—'} />
              <Row label="電話番号"       value={profile?.phone ?? '—'} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20 }}>
              <button onClick={startEdit} style={{
                padding: '9px 24px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>編集する</button>
              {msg && <span style={{ fontSize: 13, color: '#2e7d4f' }}>{msg}</span>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>メールアドレス</span>
              <input type="email" value={user.email ?? ''} readOnly style={{
                ...INPUT, background: '#f5f3f0', color: 'var(--sub)',
              }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>お名前</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="田中 花子" style={INPUT} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>電話番号</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="090-0000-0000" style={INPUT} />
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={save} disabled={saving} style={{
                padding: '9px 24px',
                background: saving ? 'var(--accent-light)' : 'var(--accent)',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              }}>{saving ? '保存中…' : '保存する'}</button>
              <button onClick={() => setEditing(false)} style={{
                padding: '9px 18px', background: '#fff', color: 'var(--sub)',
                border: '1px solid var(--line)', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              }}>キャンセル</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
