'use client'

import { useState } from 'react'

type Album = {
  id: string; slug: string; name: string; description: string
  drive_folder_id: string; cover_file_id: string | null; watermark_text: string
  is_active: boolean; start_date: string | null; end_date: string | null
}

type FormState = {
  name: string; slug: string; description: string; password: string
  drive_folder_id: string; cover_file_id: string; watermark_text: string
  start_date: string; end_date: string
}

const BLANK: FormState = {
  name: '', slug: '', description: '', password: '',
  drive_folder_id: '', cover_file_id: '', watermark_text: '上田写真館',
  start_date: '', end_date: '',
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6,
  background: '#fff', color: 'var(--ink)', outline: 'none',
}

const FIELDS = [
  { label: 'アルバム名 *',          key: 'name',            ph: '2025 春 撮影会' },
  { label: 'スラッグ (URL用) *',    key: 'slug',            ph: 'spring-2025' },
  { label: '説明文',                key: 'description',     ph: '任意' },
  { label: '合言葉（変更する場合）', key: 'password',        ph: '空白のままなら変更しない' },
  { label: 'DriveフォルダID *',     key: 'drive_folder_id', ph: '1BxiMVs0XRA5nFMdKvBdBZjg...' },
  { label: 'カバー写真のファイルID', key: 'cover_file_id',   ph: '任意' },
  { label: '透かし文字',            key: 'watermark_text',  ph: '上田写真館' },
  { label: '公開開始日',            key: 'start_date',      ph: '' },
  { label: '公開終了日',            key: 'end_date',        ph: '' },
]

const CREATE_FIELDS = FIELDS.map(f =>
  f.key === 'password' ? { ...f, label: '合言葉 *', ph: '閲覧者に伝えるパスワード' } : f
)

export default function AdminPage() {
  const [adminPw, setAdminPw] = useState('')
  const [authed, setAuthed]   = useState(false)
  const [albums, setAlbums]   = useState<Album[]>([])
  const [msg, setMsg]         = useState('')
  const [form, setForm]       = useState<FormState>(BLANK)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(BLANK)
  const [editMsg, setEditMsg] = useState('')

  async function load(pw: string) {
    const res = await fetch('/api/admin/albums', { headers: { 'x-admin-password': pw } })
    if (res.status === 401) { setMsg('パスワードが違います'); return false }
    setAlbums(await res.json())
    return true
  }

  async function login() {
    const ok = await load(adminPw)
    if (ok) setAuthed(true)
  }

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/admin/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setMsg('エラー: ' + data.error); return }
    setMsg('アルバムを作成しました')
    setForm(BLANK)
    load(adminPw)
  }

  function startEdit(a: Album) {
    setEditId(a.id)
    setEditMsg('')
    setEditForm({
      name: a.name,
      slug: a.slug,
      description: a.description ?? '',
      password: '',
      drive_folder_id: a.drive_folder_id,
      cover_file_id: a.cover_file_id ?? '',
      watermark_text: a.watermark_text ?? '上田写真館',
      start_date: a.start_date ?? '',
      end_date: a.end_date ?? '',
    })
  }

  async function saveEdit(id: string) {
    setEditMsg('')
    const payload: Record<string, string | null> = {
      id,
      name: editForm.name,
      slug: editForm.slug,
      description: editForm.description,
      drive_folder_id: editForm.drive_folder_id,
      cover_file_id: editForm.cover_file_id || null,
      watermark_text: editForm.watermark_text,
      start_date: editForm.start_date || null,
      end_date: editForm.end_date || null,
    }
    if (editForm.password) payload.password = editForm.password

    const res = await fetch('/api/admin/albums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.error) { setEditMsg('エラー: ' + data.error); return }
    setEditId(null)
    load(adminPw)
  }

  async function toggleActive(album: Album) {
    await fetch('/api/admin/albums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ id: album.id, is_active: !album.is_active }),
    })
    load(adminPw)
  }

  async function deleteAlbum(album: Album) {
    if (!confirm(`「${album.name}」を削除しますか？`)) return
    await fetch('/api/admin/albums', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ id: album.id }),
    })
    if (editId === album.id) setEditId(null)
    load(adminPw)
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 340 }}>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 16 }}>管理者パスワードを入力してください</p>
        <input type="password" placeholder="管理者パスワード" value={adminPw}
          onChange={e => setAdminPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ ...INPUT, marginBottom: 12 }} />
        <button onClick={login} style={{
          width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>ログイン</button>
        {msg && <p style={{ color: '#d23b3b', marginTop: 10, fontSize: 13 }}>{msg}</p>}
      </div>
    )
  }

  return (
    <div>
      {/* 新規作成フォーム */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>新規アルバム作成</h2>
        <form onSubmit={createAlbum} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {CREATE_FIELDS.map(f => (
            <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>{f.label}</span>
              <input
                type={f.key.includes('date') ? 'date' : f.key === 'password' ? 'password' : 'text'}
                placeholder={f.ph}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={INPUT}
              />
            </label>
          ))}
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" style={{
              padding: '10px 28px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>作成</button>
            {msg && <span style={{ fontSize: 13, color: msg.includes('エラー') ? '#d23b3b' : '#2a7a2a' }}>{msg}</span>}
          </div>
        </form>
      </section>

      {/* DriveフォルダIDの確認方法 */}
      <section style={{ marginBottom: 48, padding: 24, background: '#f0ede8', borderRadius: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>DriveフォルダIDの確認方法</h3>
        <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.9, margin: 0 }}>
          1. Google Drive でアルバム用フォルダを作成<br />
          2. そのフォルダを開くと URL が<br />
          　<code style={{ background: '#e8e4de', padding: '1px 6px', borderRadius: 3 }}>
            https://drive.google.com/drive/folders/<strong>ここがフォルダID</strong>
          </code><br />
          3. フォルダIDをコピーして上の「DriveフォルダID」に貼り付け<br />
          4. フォルダをサービスアカウントのメールアドレスと共有（閲覧者権限）<br />
          　<code style={{ background: '#e8e4de', padding: '1px 6px', borderRadius: 3 }}>ueda-photo@ueda-photo.iam.gserviceaccount.com</code>
        </p>
      </section>

      {/* アルバム一覧 */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>アルバム一覧 ({albums.length}件)</h2>
        {albums.length === 0 && <p style={{ color: 'var(--sub)', fontSize: 13 }}>アルバムがありません。</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {albums.map(a => (
            <div key={a.id} style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', opacity: a.is_active ? 1 : 0.65 }}>
              {/* アルバム行 */}
              <div style={{
                background: 'var(--card)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                    /{a.slug}
                    {a.start_date && ` | ${a.start_date}`}
                    {a.end_date && ` 〜 ${a.end_date}`}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                  background: a.is_active ? '#e8f4e8' : '#f4e8e8',
                  color: a.is_active ? '#2a7a2a' : '#8b2a2a',
                }}>
                  {a.is_active ? '公開中' : '非公開'}
                </span>
                <button onClick={() => startEdit(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid var(--accent)',
                  borderRadius: 4, background: editId === a.id ? 'var(--accent)' : '#fff',
                  color: editId === a.id ? '#fff' : 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>編集</button>
                <button onClick={() => toggleActive(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid var(--line)',
                  borderRadius: 4, background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {a.is_active ? '非公開にする' : '公開する'}
                </button>
                <button onClick={() => deleteAlbum(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid #f0c0c0',
                  borderRadius: 4, background: '#fff9f9', cursor: 'pointer', color: '#a03030', whiteSpace: 'nowrap',
                }}>削除</button>
              </div>

              {/* インライン編集フォーム */}
              {editId === a.id && (
                <div style={{ background: '#faf8f5', borderTop: '1px solid var(--line)', padding: '24px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {FIELDS.map(f => (
                      <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--sub)' }}>{f.label}</span>
                        <input
                          type={f.key.includes('date') ? 'date' : f.key === 'password' ? 'password' : 'text'}
                          placeholder={f.ph}
                          value={(editForm as Record<string, string>)[f.key]}
                          onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                          style={INPUT}
                        />
                      </label>
                    ))}
                    <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                      <button onClick={() => saveEdit(a.id)} style={{
                        padding: '9px 24px', background: 'var(--accent)', color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      }}>保存</button>
                      <button onClick={() => setEditId(null)} style={{
                        padding: '9px 18px', background: '#fff', color: 'var(--sub)',
                        border: '1px solid var(--line)', borderRadius: 6, fontSize: 14, cursor: 'pointer',
                      }}>キャンセル</button>
                      {editMsg && <span style={{ fontSize: 13, color: editMsg.includes('エラー') ? '#d23b3b' : '#2a7a2a' }}>{editMsg}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
