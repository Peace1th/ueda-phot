'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = {
  fileIds: string[]
  slug: string
  onClose: () => void
}

const TERMS = `本写真の著作権は上田写真館に帰属します。以下の条件にご同意の上ご利用ください。

・個人利用（思い出の保存・SNS 投稿等）に限り使用できます
・商用利用・再販・第三者への配布は禁止します
・写真の加工・編集物の再配布は禁止します
・写真に付与されたクレジットを削除しないでください
・本規約に違反した場合は著作権法に基づき対応します`

const INPUT_STYLE: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6,
  outline: 'none', background: '#fff', color: 'var(--ink)',
  width: '100%', boxSizing: 'border-box',
}

export default function DownloadModal({ fileIds, slug, onClose }: Props) {
  const { user, profile } = useAuth()
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [saveProfile, setSaveProfile] = useState(false)
  const [agreed, setAgreed]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? '')
      if (profile) {
        setName(profile.name ?? '')
        setPhone(profile.phone ?? '')
      }
    }
  }, [user, profile])

  const isBulk = fileIds.length > 1
  const isLoggedIn = !!user

  async function handleDownload() {
    if (!name.trim() || !email.trim()) { setErr('名前とメールアドレスは必須です'); return }
    if (!agreed) { setErr('利用規約に同意してください'); return }
    setLoading(true); setErr('')

    try {
      if (isLoggedIn && saveProfile) {
        const supabase = createSupabaseBrowserClient()
        await supabase.from('user_profiles').upsert({
          id: user.id, name: name.trim(), phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
      }

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, slug, name, email, phone }),
      })
      if (!res.ok) { setErr('ダウンロードに失敗しました'); setLoading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = isBulk ? 'photos.zip' : 'photo.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onClose()
    } catch {
      setErr('エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,8,5,.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: '32px 28px',
        maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,.3)',
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
          {isBulk ? `${fileIds.length}枚まとめてダウンロード` : '写真ダウンロード'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 24, lineHeight: 1.7 }}>
          {isBulk
            ? `選択した${fileIds.length}枚をZIPファイルでダウンロードします。`
            : 'ダウンロードには情報の入力と利用規約への同意が必要です。'}
          {isLoggedIn && <span style={{ color: 'var(--accent)' }}> 情報を自動入力しました。</span>}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>名前 *</span>
            <input type="text" placeholder="山田 太郎" value={name}
              onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>メールアドレス *</span>
            <input type="email" placeholder="example@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ ...INPUT_STYLE, background: isLoggedIn ? '#f8f6f2' : '#fff' }}
              readOnly={isLoggedIn} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>電話番号</span>
            <input type="tel" placeholder="090-0000-0000" value={phone}
              onChange={e => setPhone(e.target.value)} style={INPUT_STYLE} />
          </label>
        </div>

        {isLoggedIn && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={saveProfile} onChange={e => setSaveProfile(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
            <span style={{ fontSize: 13, color: 'var(--sub)' }}>この情報を次回のために保存する</span>
          </label>
        )}

        <div style={{
          background: '#f8f6f2', borderRadius: 8, padding: 16,
          fontSize: 12, color: 'var(--sub)', lineHeight: 1.9,
          marginBottom: 16, whiteSpace: 'pre-wrap',
        }}>
          {TERMS}
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>上記の利用規約に同意します</span>
        </label>

        {err && <p style={{ color: '#d23b3b', fontSize: 13, marginBottom: 12 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownload} disabled={loading} style={{
            flex: 1, padding: 11, fontSize: 14, fontWeight: 700,
            background: loading ? '#c5aa87' : 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 6, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading
              ? (isBulk ? 'ZIP作成中…' : 'ダウンロード中…')
              : (isBulk ? `${fileIds.length}枚をダウンロード` : 'ダウンロード')}
          </button>
          <button onClick={onClose} style={{
            padding: '11px 18px', fontSize: 14,
            background: '#fff', color: 'var(--sub)',
            border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer',
          }}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
