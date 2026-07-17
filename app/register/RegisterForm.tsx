'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  border: '1px solid var(--line)', borderRadius: 6, boxSizing: 'border-box',
  outline: 'none', background: '#fff', color: 'var(--ink)',
}

const TERMS = `Peacephoto 利用規約

第1条（著作権）
提供される写真・動画（以下「コンテンツ」）の著作権はすべてPeacephoto（以下「当社」）に帰属します。ご利用者はコンテンツの利用について、以下の条件のもと非独占的・譲渡不可のライセンスを受けるものとします。

第2条（利用許諾）
コンテンツは以下の目的に限り利用できます。
・個人的な記念・思い出としての保存および閲覧
・本人または関係者のSNS・ブログ・ウェブサイトへの掲載
・名刺・パンフレット・ポスター等、自己のブランドや商業目的への利用
・印刷物（アルバム・フォトブック等）への使用

第3条（商標・ブランド利用）
コンテンツは自己の商標・ロゴ・ブランドに関連する用途に使用することができます。ただし、以下の場合は事前に当社へご連絡ください。
・全国規模の商業広告（テレビCM・屋外大型看板等）への使用
・自己以外の第三者の製品・サービスの宣伝・販売促進への使用

第4条（禁止事項）
以下の行為を禁止します。
・コンテンツを第三者へ販売・譲渡・貸与すること
・コンテンツを他者に再配布・二次配布すること
・コンテンツを素材として第三者へ提供・販売すること
・コンテンツを加工・編集した作品を第三者へ配布・販売すること
・コンテンツをAI・機械学習の訓練データとして使用すること
・コンテンツに付与された署名・クレジット・透かしを除去・改変すること
・当社の許可なく、コンテンツを用いて名誉棄損・プライバシー侵害となる表現をすること
・その他、法令または公序良俗に反する目的での使用

第5条（個人情報の取り扱い）
ご登録いただいたお名前・メールアドレス・電話番号（以下「個人情報」）は、以下の目的のみに使用します。
・アルバムの提供およびダウンロードサービスの運営
・サービスに関する重要なご連絡（配送・料金・トラブル対応等）
・当社からの必要なお知らせ
個人情報は本人の同意なく第三者に提供することはありません（法令に基づく場合を除く）。

第6条（免責事項）
・当社は、コンテンツの利用により生じた損害について、当社の故意または重大な過失による場合を除き、責任を負いません。
・天災・システム障害・不正アクセス等、当社の合理的な管理範囲を超えた原因によるデータ損失について責任を負いません。
・コンテンツは提供時の状態のまま提供され、特定目的への適合性を保証するものではありません。

第7条（サービスの変更・停止）
当社は、事前の通知をもってサービス内容の変更またはサービスの提供停止を行うことができます。サービス終了に際しては合理的な期間を設けてご案内します。

第8条（規約違反）
本規約に違反した場合、当社は事前通知なくアカウントの停止・コンテンツへのアクセス制限を行うことができます。また、著作権法その他の法令に基づき法的措置を講じる場合があります。

第9条（規約の変更）
本規約は必要に応じて変更することがあります。変更後の規約はサービス上に掲示した時点から効力を生じます。

第10条（準拠法・管轄）
本規約は日本法に準拠し、紛争が生じた場合は当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。`

export default function RegisterForm({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const supabase = createSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())  { setError('お名前を入力してください'); return }
    if (!phone.trim()) { setError('電話番号を入力してください'); return }
    if (!agreed)      { setError('利用規約に同意してください'); return }
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
      {/* メールアドレス（読み取り専用） */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>メールアドレス</span>
        <input value={email} disabled
          style={{ ...INPUT, background: '#f5f3f0', color: 'var(--sub)', cursor: 'not-allowed' }} />
      </label>

      {/* お名前 */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          お名前 <span style={{ color: 'var(--accent)' }}>*</span>
        </span>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="山田 太郎" style={INPUT} autoFocus
        />
      </label>

      {/* 電話番号 */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          電話番号 <span style={{ color: 'var(--accent)' }}>*</span>
        </span>
        <input
          value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="090-0000-0000" type="tel" style={INPUT}
        />
      </label>

      {/* 利用規約 */}
      <div>
        <p style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 600, marginBottom: 8 }}>利用規約</p>
        <div style={{
          background: '#f8f6f2', borderRadius: 8, padding: '12px 14px',
          fontSize: 12, color: 'var(--sub)', lineHeight: 2,
          whiteSpace: 'pre-wrap', marginBottom: 12,
        }}>
          {TERMS}
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13 }}>上記の利用規約に同意します</span>
        </label>
      </div>

      {error && <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button
        type="submit" disabled={saving}
        style={{
          background: saving ? '#c5aa87' : 'var(--accent)', color: '#fff', border: 'none',
          padding: '13px', borderRadius: 6, fontSize: 14, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          marginTop: 8, letterSpacing: '0.05em',
        }}
      >
        {saving ? '登録中...' : '同意して登録する'}
      </button>
    </form>
  )
}
