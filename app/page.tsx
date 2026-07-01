import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import ProfileSection from '@/components/ProfileSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data } = await supabaseAdmin
    .from('site_settings').select('value').eq('key', 'home_intro').single()
  const homeIntro = data?.value ?? ''

  return (
    <main>
      {/* Hero */}
      <section style={{
        minHeight: '68vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '64px 24px',
        background: 'linear-gradient(160deg, #f8f6f2 0%, #ede8df 100%)',
      }}>
        <p style={{ fontSize: 11, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 18, textTransform: 'uppercase' }}>
          Ueda Photo Studio
        </p>
        <h1 style={{
          fontSize: 'clamp(38px, 9vw, 68px)',
          fontWeight: 700, letterSpacing: '0.14em',
          lineHeight: 1.15, margin: '0 0 22px',
        }}>
          上田写真館
        </h1>
        <p style={{ fontSize: 14, color: 'var(--sub)', maxWidth: 360, lineHeight: 2, marginBottom: 44 }}>
          大切な瞬間を、丁寧に。<br />
          お客様だけがご覧いただける<br />
          プライベートギャラリーです。
        </p>
        <Link href="/albums" style={{
          background: 'var(--accent)', color: '#fff',
          padding: '13px 38px', borderRadius: 3,
          textDecoration: 'none', fontSize: 13,
          letterSpacing: '0.1em', fontWeight: 700,
          display: 'inline-block',
        }}>
          アルバムを見る
        </Link>
      </section>

      {/* 管理者設定の紹介文 */}
      {homeIntro && (
        <section style={{ maxWidth: 680, margin: '64px auto 0', padding: '0 24px', textAlign: 'center' }}>
          <p style={{
            fontSize: 14, color: 'var(--ink)', lineHeight: 2.2,
            whiteSpace: 'pre-wrap', borderBottom: '1px solid var(--line)', paddingBottom: 48,
          }}>
            {homeIntro}
          </p>
        </section>
      )}

      {/* How it works */}
      <section style={{ maxWidth: 860, margin: homeIntro ? '48px auto 0' : '80px auto 0', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 40 }}>
          ご利用の流れ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {[
            { n: '01', t: 'アルバムを選ぶ', b: '撮影日やイベント名のアルバムを一覧からお選びください。' },
            { n: '02', t: '合言葉を入力',   b: '担当者からお伝えした合言葉を入力するとご覧いただけます。' },
            { n: '03', t: '写真を閲覧',     b: 'タップ・クリックで拡大表示。思い出をゆっくりとご覧ください。' },
          ].map(s => (
            <div key={s.n} style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 8, padding: '28px 22px',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 14 }}>{s.n}</div>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{s.t}</div>
              <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.8 }}>{s.b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* プロフィール編集（ログイン済みユーザーのみ表示） */}
      <ProfileSection />

      {/* Notice */}
      <section style={{ maxWidth: 600, margin: '64px auto 0', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 2, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
          掲載写真には著作権があります。無断転載・印刷・SNSへの投稿はご遠慮ください。<br />
          合言葉のご不明な点はお気軽にお問い合わせください。
        </p>
      </section>
    </main>
  )
}
