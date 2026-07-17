'use client'

import { useState } from 'react'

type Album = {
  id: string; slug: string; name: string; description: string
  drive_folder_id: string; cover_file_id: string | null; watermark_text: string
  is_active: boolean; start_date: string | null; end_date: string | null
  download_enabled: boolean; dl_watermark_enabled: boolean
  dl_watermark_text: string; dl_watermark_opacity: number; dl_watermark_position: string
}
type DownloadLog = {
  id: string; album_slug: string; file_id: string
  requester_name: string; requester_email: string; requester_phone: string | null; created_at: string
}
type ViewLog = {
  id: string; album_slug: string; accessed_at: string
  ip_address: string | null; user_agent: string | null
  city: string | null; country: string | null
  region: string | null; latitude: string | null; longitude: string | null; timezone: string | null
  viewer_name: string | null; viewer_email: string | null
}
type DriveFile = { id: string; name: string }
type AlbumStats = {
  slug: string; name: string
  view_count: number; unique_visitors: number; download_count: number
  last_viewed: string | null
}
type AccessUser = {
  id: string; user_id: string
  name: string | null; email: string | null; created_at: string
}

type FormState = {
  name: string; slug: string; description: string; password: string
  drive_folder_id: string; cover_file_id: string; watermark_text: string
  start_date: string; end_date: string
  download_enabled: boolean; dl_watermark_enabled: boolean
  dl_watermark_text: string; dl_watermark_opacity: string; dl_watermark_position: string
}

const BLANK: FormState = {
  name: '', slug: '', description: '', password: '',
  drive_folder_id: '', cover_file_id: '', watermark_text: 'Peacephoto',
  start_date: '', end_date: '',
  download_enabled: true, dl_watermark_enabled: true,
  dl_watermark_text: '@ueda_photo', dl_watermark_opacity: '15', dl_watermark_position: 'southwest',
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
  { label: '透かし文字（表示用）',   key: 'watermark_text',  ph: 'Peacephoto' },
  { label: '公開開始日',            key: 'start_date',      ph: '' },
  { label: '公開終了日',            key: 'end_date',        ph: '' },
]
const CREATE_FIELDS = FIELDS.map(f =>
  f.key === 'password' ? { ...f, label: '合言葉 *', ph: '閲覧者に伝えるパスワード' } : f
)
const DL_POSITIONS = [
  { value: 'southwest', label: '左下' }, { value: 'southeast', label: '右下' },
  { value: 'northwest', label: '左上' }, { value: 'northeast', label: '右上' },
  { value: 'center', label: '中央' },
]

function parseUA(ua: string | null): string {
  if (!ua) return '不明'
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android.*Mobile/i.test(ua)) return 'Android スマホ'
  if (/Android/i.test(ua)) return 'Android タブレット'
  if (/Mac/i.test(ua)) return 'Mac'
  if (/Windows/i.test(ua)) return 'Windows'
  return 'その他'
}

export default function AdminPage() {
  const [adminPw, setAdminPw] = useState('')
  const [authed, setAuthed]   = useState(false)
  const [albums, setAlbums]   = useState<Album[]>([])
  const [msg, setMsg]         = useState('')
  const [form, setForm]       = useState<FormState>(BLANK)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(BLANK)
  const [editMsg, setEditMsg] = useState('')

  // DLログ
  const [logs, setLogs]               = useState<DownloadLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsLoaded, setLogsLoaded]   = useState(false)

  // 閲覧ログ
  const [viewLogs, setViewLogs]             = useState<ViewLog[]>([])
  const [viewLogsLoading, setViewLogsLoading] = useState(false)
  const [viewLogsLoaded, setViewLogsLoaded]   = useState(false)

  // サイト設定
  const [homeIntro, setHomeIntro] = useState('')
  const [introMsg, setIntroMsg]   = useState('')

  // QRコード
  const [qrSlug, setQrSlug] = useState<string | null>(null)

  // キャプション管理
  const [captionAlbumId, setCaptionAlbumId]   = useState<string | null>(null)
  const [captionFiles, setCaptionFiles]       = useState<DriveFile[]>([])
  const [captionMap, setCaptionMap]           = useState<Record<string, string>>({})
  const [captionLoading, setCaptionLoading]   = useState(false)
  const [captionMsg, setCaptionMsg]           = useState('')

  // 統計
  const [stats, setStats]           = useState<AlbumStats[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsLoaded, setStatsLoaded]   = useState(false)

  // アクセス管理
  const [accessAlbumSlug, setAccessAlbumSlug] = useState<string | null>(null)
  const [accessList, setAccessList]           = useState<AccessUser[]>([])
  const [accessLoading, setAccessLoading]     = useState(false)
  const [accessEmail, setAccessEmail]         = useState('')
  const [accessMsg, setAccessMsg]             = useState('')

  /* ── ローダー群 ── */
  async function load(pw: string) {
    const res = await fetch('/api/admin/albums', { headers: { 'x-admin-password': pw } })
    if (res.status === 401) { setMsg('パスワードが違います'); return false }
    setAlbums(await res.json())
    return true
  }
  async function loadSettings(pw: string) {
    const res = await fetch('/api/admin/settings', { headers: { 'x-admin-password': pw } })
    const data = await res.json()
    setHomeIntro(data.home_intro ?? '')
  }
  async function login() {
    const ok = await load(adminPw)
    if (ok) { setAuthed(true); loadSettings(adminPw) }
  }
  async function loadLogs() {
    setLogsLoading(true)
    const res = await fetch('/api/admin/downloads', { headers: { 'x-admin-password': adminPw } })
    setLogs(await res.json()); setLogsLoaded(true); setLogsLoading(false)
  }
  async function loadViewLogs() {
    setViewLogsLoading(true)
    const res = await fetch('/api/admin/viewlogs', { headers: { 'x-admin-password': adminPw } })
    setViewLogs(await res.json()); setViewLogsLoaded(true); setViewLogsLoading(false)
  }
  async function saveIntro() {
    setIntroMsg('')
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ key: 'home_intro', value: homeIntro }),
    })
    setIntroMsg('保存しました')
    setTimeout(() => setIntroMsg(''), 3000)
  }

  /* ── アルバム操作 ── */
  async function createAlbum(e: React.FormEvent) {
    e.preventDefault(); setMsg('')
    const res = await fetch('/api/admin/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setMsg('エラー: ' + data.error); return }
    setMsg('アルバムを作成しました'); setForm(BLANK); load(adminPw)
  }
  function startEdit(a: Album) {
    setEditId(a.id); setEditMsg('')
    setEditForm({
      name: a.name, slug: a.slug, description: a.description ?? '', password: '',
      drive_folder_id: a.drive_folder_id, cover_file_id: a.cover_file_id ?? '',
      watermark_text: a.watermark_text ?? 'Peacephoto',
      start_date: a.start_date ?? '', end_date: a.end_date ?? '',
      download_enabled: a.download_enabled ?? true,
      dl_watermark_enabled: a.dl_watermark_enabled ?? true,
      dl_watermark_text: a.dl_watermark_text ?? '@ueda_photo',
      dl_watermark_opacity: String(a.dl_watermark_opacity ?? 15),
      dl_watermark_position: a.dl_watermark_position ?? 'southwest',
    })
  }
  async function saveEdit(id: string) {
    setEditMsg('')
    const payload: Record<string, string | number | boolean | null> = {
      id, name: editForm.name, slug: editForm.slug, description: editForm.description,
      drive_folder_id: editForm.drive_folder_id, cover_file_id: editForm.cover_file_id || null,
      watermark_text: editForm.watermark_text,
      start_date: editForm.start_date || null, end_date: editForm.end_date || null,
      download_enabled: editForm.download_enabled, dl_watermark_enabled: editForm.dl_watermark_enabled,
      dl_watermark_text: editForm.dl_watermark_text,
      dl_watermark_opacity: parseInt(editForm.dl_watermark_opacity) || 15,
      dl_watermark_position: editForm.dl_watermark_position,
    }
    if (editForm.password) payload.password = editForm.password
    const res = await fetch('/api/admin/albums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.error) { setEditMsg('エラー: ' + data.error); return }
    setEditId(null); load(adminPw)
  }
  async function toggleActive(album: Album) {
    await fetch('/api/admin/albums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ id: album.id, is_active: !album.is_active }),
    }); load(adminPw)
  }
  async function deleteAlbum(album: Album) {
    if (!confirm(`「${album.name}」を削除しますか？`)) return
    await fetch('/api/admin/albums', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ id: album.id }),
    })
    if (editId === album.id) setEditId(null)
    if (captionAlbumId === album.id) setCaptionAlbumId(null)
    load(adminPw)
  }

  /* ── キャプション管理 ── */
  async function toggleCaptions(album: Album) {
    if (captionAlbumId === album.id) { setCaptionAlbumId(null); return }
    setCaptionAlbumId(album.id); setCaptionMsg(''); setCaptionLoading(true)
    const photosRes = await fetch(`/api/admin/photos?folderId=${album.drive_folder_id}`, {
      headers: { 'x-admin-password': adminPw },
    })
    const files: DriveFile[] = await photosRes.json()
    setCaptionFiles(files)
    if (files.length > 0) {
      const ids = files.map(f => f.id).join(',')
      const capRes = await fetch(`/api/admin/captions?fileIds=${ids}`, {
        headers: { 'x-admin-password': adminPw },
      })
      const rows: { file_id: string; caption: string }[] = await capRes.json()
      const map: Record<string, string> = {}
      rows.forEach(r => { map[r.file_id] = r.caption })
      setCaptionMap(map)
    } else {
      setCaptionMap({})
    }
    setCaptionLoading(false)
  }
  async function saveCaptions() {
    setCaptionMsg('')
    const updates = captionFiles.map(f => ({ file_id: f.id, caption: captionMap[f.id] ?? '' }))
    await fetch('/api/admin/captions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify(updates),
    })
    setCaptionMsg('保存しました')
    setTimeout(() => setCaptionMsg(''), 3000)
  }

  /* ── 統計 ── */
  async function loadStats() {
    setStatsLoading(true)
    const res = await fetch('/api/admin/stats', { headers: { 'x-admin-password': adminPw } })
    setStats(await res.json()); setStatsLoaded(true); setStatsLoading(false)
  }

  /* ── アクセス管理 ── */
  async function reloadAccess(slug: string) {
    setAccessLoading(true)
    const res = await fetch(`/api/admin/access?slug=${encodeURIComponent(slug)}`, {
      headers: { 'x-admin-password': adminPw },
    })
    setAccessList(await res.json()); setAccessLoading(false)
  }
  async function toggleAccess(slug: string) {
    if (accessAlbumSlug === slug) { setAccessAlbumSlug(null); return }
    setAccessAlbumSlug(slug); setAccessMsg(''); setAccessEmail('')
    await reloadAccess(slug)
  }
  async function addAccess() {
    if (!accessAlbumSlug || !accessEmail.trim()) return
    setAccessMsg('')
    const res = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ email: accessEmail.trim(), slug: accessAlbumSlug }),
    })
    const data = await res.json()
    if (data.error) { setAccessMsg('エラー: ' + data.error); return }
    setAccessEmail('')
    setAccessMsg(data.message === 'already_exists' ? 'すでに登録済みです' : '追加しました')
    setTimeout(() => setAccessMsg(''), 3000)
    await reloadAccess(accessAlbumSlug)
  }
  async function removeAccess(id: string) {
    await fetch('/api/admin/access', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ id }),
    })
    if (accessAlbumSlug) await reloadAccess(accessAlbumSlug)
  }

  /* ── QRダウンロード ── */
  async function downloadQR(slug: string) {
    const albumUrl = `${window.location.origin}/albums/${slug}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(albumUrl)}`
    const res = await fetch(qrUrl)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `qr-${slug}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  /* ── ログイン画面 ── */
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
      {/* ── サイト設定 ── */}
      <section style={{ marginBottom: 48, padding: 24, background: '#f8f6f2', borderRadius: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>ホーム画面の紹介文</h2>
        <textarea
          value={homeIntro}
          onChange={e => setHomeIntro(e.target.value)}
          rows={4} placeholder={'ここに入力した文章がトップページに表示されます。\n空白の場合は表示されません。'}
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.8 }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={saveIntro} style={{
            padding: '8px 22px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>保存</button>
          {introMsg && <span style={{ fontSize: 13, color: '#2a7a2a' }}>{introMsg}</span>}
        </div>
      </section>

      {/* ── 新規作成 ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>新規アルバム作成</h2>
        <form onSubmit={createAlbum} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {CREATE_FIELDS.map(f => (
            <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>{f.label}</span>
              <input
                type={f.key.includes('date') ? 'date' : f.key === 'password' ? 'password' : 'text'}
                placeholder={f.ph}
                value={((form as unknown) as Record<string, string>)[f.key]}
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

      {/* ── DriveフォルダID説明 ── */}
      <section style={{ marginBottom: 48, padding: 24, background: '#f0ede8', borderRadius: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>DriveフォルダIDの確認方法</h3>
        <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.9, margin: 0 }}>
          1. Google Drive でアルバム用フォルダを作成<br />
          2. そのフォルダを開くと URL が<br />
          　<code style={{ background: '#e8e4de', padding: '1px 6px', borderRadius: 3 }}>
            https://drive.google.com/drive/folders/<strong>ここがフォルダID</strong>
          </code><br />
          3. フォルダIDをコピーして「DriveフォルダID」に貼り付け<br />
          4. フォルダをサービスアカウントのメールと共有（閲覧者権限）<br />
          　<code style={{ background: '#e8e4de', padding: '1px 6px', borderRadius: 3 }}>ueda-photo@ueda-photo.iam.gserviceaccount.com</code>
        </p>
      </section>

      {/* ── アルバム一覧 ── */}
      <section style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>アルバム一覧 ({albums.length}件)</h2>
        {albums.length === 0 && <p style={{ color: 'var(--sub)', fontSize: 13 }}>アルバムがありません。</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {albums.map(a => (
            <div key={a.id} style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', opacity: a.is_active ? 1 : 0.65 }}>
              {/* アルバム行 */}
              <div style={{ background: 'var(--card)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                    /{a.slug}{a.start_date && ` | ${a.start_date}`}{a.end_date && ` 〜 ${a.end_date}`}
                    {' · '}{a.download_enabled ? 'DL許可' : 'DL不可'}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                  background: a.is_active ? '#e8f4e8' : '#f4e8e8',
                  color: a.is_active ? '#2a7a2a' : '#8b2a2a',
                }}>{a.is_active ? '公開中' : '非公開'}</span>

                {/* QRボタン */}
                <button onClick={() => setQrSlug(a.slug)} style={{
                  padding: '5px 12px', fontSize: 12, border: '1px solid var(--line)',
                  borderRadius: 4, background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>QR</button>

                <button onClick={() => startEdit(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid var(--accent)',
                  borderRadius: 4, background: editId === a.id ? 'var(--accent)' : '#fff',
                  color: editId === a.id ? '#fff' : 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>編集</button>
                <button onClick={() => toggleCaptions(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid var(--line)',
                  borderRadius: 4, background: captionAlbumId === a.id ? '#e8e4de' : '#fff',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>キャプション</button>
                <button onClick={() => toggleAccess(a.slug)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid var(--line)',
                  borderRadius: 4, background: accessAlbumSlug === a.slug ? '#e8edf4' : '#fff',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>アクセス管理</button>
                <button onClick={() => toggleActive(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid var(--line)',
                  borderRadius: 4, background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{a.is_active ? '非公開にする' : '公開する'}</button>
                <button onClick={() => deleteAlbum(a)} style={{
                  padding: '6px 14px', fontSize: 12, border: '1px solid #f0c0c0',
                  borderRadius: 4, background: '#fff9f9', cursor: 'pointer', color: '#a03030', whiteSpace: 'nowrap',
                }}>削除</button>
              </div>

              {/* 編集フォーム */}
              {editId === a.id && (
                <div style={{ background: '#faf8f5', borderTop: '1px solid var(--line)', padding: '24px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {FIELDS.map(f => (
                      <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--sub)' }}>{f.label}</span>
                        <input
                          type={f.key.includes('date') ? 'date' : f.key === 'password' ? 'password' : 'text'}
                          placeholder={f.ph}
                          value={((editForm as unknown) as Record<string, string>)[f.key]}
                          onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                          style={INPUT}
                        />
                      </label>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)', marginBottom: 12 }}>ダウンロード設定</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ gridColumn: '1/-1', display: 'flex', gap: 24 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={editForm.download_enabled}
                            onChange={e => setEditForm(p => ({ ...p, download_enabled: e.target.checked }))}
                            style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                          DLを許可する
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={editForm.dl_watermark_enabled}
                            onChange={e => setEditForm(p => ({ ...p, dl_watermark_enabled: e.target.checked }))}
                            style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                          署名を入れる
                        </label>
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--sub)' }}>署名テキスト</span>
                        <input type="text" value={editForm.dl_watermark_text}
                          onChange={e => setEditForm(p => ({ ...p, dl_watermark_text: e.target.value }))}
                          placeholder="@ueda_photo" style={INPUT} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--sub)' }}>署名の濃さ（%）</span>
                        <input type="number" min={1} max={100} value={editForm.dl_watermark_opacity}
                          onChange={e => setEditForm(p => ({ ...p, dl_watermark_opacity: e.target.value }))}
                          style={INPUT} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--sub)' }}>署名の位置</span>
                        <select value={editForm.dl_watermark_position}
                          onChange={e => setEditForm(p => ({ ...p, dl_watermark_position: e.target.value }))}
                          style={{ ...INPUT, cursor: 'pointer' }}>
                          {DL_POSITIONS.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
              )}

              {/* アクセス管理 */}
              {accessAlbumSlug === a.slug && (
                <div style={{ background: '#f0f4f8', borderTop: '1px solid var(--line)', padding: '20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>アクセス権限管理</p>
                  {/* ユーザー追加 */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      placeholder="追加するユーザーのメールアドレス"
                      value={accessEmail}
                      onChange={e => setAccessEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addAccess()}
                      style={{ ...INPUT, flex: 1, minWidth: 200 }}
                    />
                    <button onClick={addAccess} style={{
                      padding: '9px 18px', fontSize: 13, fontWeight: 700,
                      background: 'var(--accent)', color: '#fff',
                      border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>追加</button>
                    {accessMsg && (
                      <span style={{
                        fontSize: 13,
                        color: accessMsg.includes('エラー') ? '#d23b3b' : '#2a7a2a',
                      }}>{accessMsg}</span>
                    )}
                  </div>
                  {/* ユーザー一覧 */}
                  {accessLoading ? (
                    <p style={{ fontSize: 13, color: 'var(--sub)' }}>読み込み中…</p>
                  ) : accessList.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--sub)' }}>アクセス権限を持つユーザーはいません。</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {accessList.map(u => (
                        <div key={u.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 12px', background: '#fff',
                          borderRadius: 6, border: '1px solid var(--line)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name ?? '(名前未登録)'}</div>
                            <div style={{ fontSize: 12, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.email ?? '—'}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--sub)', whiteSpace: 'nowrap' }}>
                            {new Date(u.created_at).toLocaleDateString('ja-JP')}
                          </div>
                          <button onClick={() => removeAccess(u.id)} style={{
                            padding: '4px 10px', fontSize: 12,
                            border: '1px solid #f0c0c0', borderRadius: 4,
                            background: '#fff9f9', color: '#a03030', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>削除</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* キャプション管理 */}
              {captionAlbumId === a.id && (
                <div style={{ background: '#f5f3f0', borderTop: '1px solid var(--line)', padding: '20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>写真キャプション編集</p>
                  {captionLoading ? (
                    <p style={{ fontSize: 13, color: 'var(--sub)' }}>読み込み中…</p>
                  ) : captionFiles.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--sub)' }}>このフォルダに写真が見つかりません。</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {captionFiles.map(f => (
                        <label key={f.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--sub)', width: 200, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={f.name}>{f.name}</span>
                          <input type="text" placeholder="キャプション（空白で非表示）"
                            value={captionMap[f.id] ?? ''}
                            onChange={e => setCaptionMap(p => ({ ...p, [f.id]: e.target.value }))}
                            style={{ ...INPUT, flex: 1 }} />
                        </label>
                      ))}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                        <button onClick={saveCaptions} style={{
                          padding: '8px 22px', background: 'var(--accent)', color: '#fff',
                          border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>保存</button>
                        {captionMsg && <span style={{ fontSize: 13, color: '#2a7a2a' }}>{captionMsg}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── DLログ ── */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>ダウンロードログ</h2>
          <button onClick={loadLogs} disabled={logsLoading} style={{
            padding: '6px 16px', fontSize: 12, cursor: logsLoading ? 'default' : 'pointer',
            background: '#fff', border: '1px solid var(--line)', borderRadius: 4,
          }}>{logsLoading ? '読み込み中…' : logsLoaded ? '更新' : 'ログを表示'}</button>
          {logsLoaded && <span style={{ fontSize: 12, color: 'var(--sub)' }}>{logs.length}件</span>}
        </div>
        {logsLoaded && (logs.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--sub)' }}>ダウンロード履歴はありません。</p>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                  {['日時','アルバム','名前','メール','電話'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--sub)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--sub)' }}>
                      {new Date(log.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{log.album_slug}</td>
                    <td style={{ padding: '8px 12px' }}>{log.requester_name}</td>
                    <td style={{ padding: '8px 12px' }}>{log.requester_email}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--sub)' }}>{log.requester_phone ?? '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
        )}
      </section>

      {/* ── 閲覧ログ ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>閲覧ログ</h2>
          <button onClick={loadViewLogs} disabled={viewLogsLoading} style={{
            padding: '6px 16px', fontSize: 12, cursor: viewLogsLoading ? 'default' : 'pointer',
            background: '#fff', border: '1px solid var(--line)', borderRadius: 4,
          }}>{viewLogsLoading ? '読み込み中…' : viewLogsLoaded ? '更新' : 'ログを表示'}</button>
          {viewLogsLoaded && <span style={{ fontSize: 12, color: 'var(--sub)' }}>{viewLogs.length}件</span>}
        </div>
        {viewLogsLoaded && (viewLogs.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--sub)' }}>閲覧履歴はありません。</p>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                  {['日時','アルバム','名前','メール','IP','都市・地域','国','座標（地図）','TZ','端末'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--sub)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{viewLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--sub)' }}>
                      {new Date(log.accessed_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{log.album_slug}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{log.viewer_name ?? '—'}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{log.viewer_email ?? '—'}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12, color: 'var(--sub)' }}>
                      {log.ip_address ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {[log.city, log.region].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {log.country ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {log.latitude && log.longitude
                        ? <a href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                            target="_blank" rel="noreferrer"
                            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            {parseFloat(log.latitude).toFixed(3)}, {parseFloat(log.longitude).toFixed(3)} 🗺
                          </a>
                        : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--sub)', fontSize: 12 }}>
                      {log.timezone ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--sub)' }}>
                      {parseUA(log.user_agent)}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
        )}
      </section>

      {/* ── 統計ダッシュボード ── */}
      <section style={{ marginBottom: 48, marginTop: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>アルバム統計</h2>
          <button onClick={loadStats} disabled={statsLoading} style={{
            padding: '6px 16px', fontSize: 12, cursor: statsLoading ? 'default' : 'pointer',
            background: '#fff', border: '1px solid var(--line)', borderRadius: 4,
          }}>{statsLoading ? '集計中…' : statsLoaded ? '更新' : '統計を表示'}</button>
        </div>
        {statsLoaded && (
          stats.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--sub)' }}>アルバムがありません。</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                    {['アルバム','閲覧数','ユニーク訪問者','DL数','最終閲覧'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--sub)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...stats].sort((a, b) => b.view_count - a.view_count).map(s => (
                    <tr key={s.slug} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--sub)' }}>/{s.slug}</div>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', minWidth: 36,
                          padding: '2px 10px', borderRadius: 20,
                          background: s.view_count > 0 ? '#e8f0e8' : '#f5f5f5',
                          color: s.view_count > 0 ? '#2a6a2a' : 'var(--sub)',
                          fontWeight: 700, fontSize: 13,
                        }}>{s.view_count}</span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--sub)' }}>
                        {s.unique_visitors > 0 ? s.unique_visitors : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', minWidth: 36,
                          padding: '2px 10px', borderRadius: 20,
                          background: s.download_count > 0 ? '#e8edf8' : '#f5f5f5',
                          color: s.download_count > 0 ? '#2a4a8a' : 'var(--sub)',
                          fontWeight: 700, fontSize: 13,
                        }}>{s.download_count}</span>
                      </td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--sub)', fontSize: 12 }}>
                        {s.last_viewed
                          ? new Date(s.last_viewed).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>

      {/* ── QRモーダル ── */}
      {qrSlug !== null && (() => {
        const albumUrl = typeof window !== 'undefined' ? `${window.location.origin}/albums/${qrSlug}` : ''
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(albumUrl)}`
        return (
          <div onClick={e => { if (e.target === e.currentTarget) setQrSlug(null) }} style={{
            position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,8,5,.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: '32px 28px', textAlign: 'center',
              maxWidth: 340, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.3)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>QRコード</h3>
              <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 20, wordBreak: 'break-all' }}>{albumUrl}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="QR" width={240} height={240}
                style={{ display: 'block', margin: '0 auto 20px', borderRadius: 4 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => downloadQR(qrSlug)} style={{
                  flex: 1, padding: '10px', fontSize: 13, fontWeight: 700,
                  background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
                }}>ダウンロード</button>
                <button onClick={() => setQrSlug(null)} style={{
                  padding: '10px 18px', fontSize: 13, background: '#fff', color: 'var(--sub)',
                  border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer',
                }}>閉じる</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
