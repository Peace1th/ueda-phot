import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import Link from 'next/link'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: '上田写真館',
  description: '上田写真館 — 思い出をきれいに残す、あなたのプライベートギャラリー',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={noto.className} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(248,246,242,0.93)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--line)',
          padding: '0 24px', height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.1em' }}>上田写真館</span>
          </Link>
          <nav style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <Link href="/albums" style={{ color: 'var(--sub)', textDecoration: 'none' }}>アルバム一覧</Link>
          </nav>
        </header>

        <AuthProvider>
          <div style={{ flex: 1 }}>{children}</div>
        </AuthProvider>

        <footer style={{
          textAlign: 'center', padding: '36px 24px',
          fontSize: 12, color: 'var(--sub)',
          borderTop: '1px solid var(--line)', marginTop: 64,
        }}>
          © 上田写真館. All rights reserved. — 無断転載・複製を禁じます。
          <br />
          <Link href="/admin" style={{ color: 'var(--line)', textDecoration: 'none', fontSize: 11, marginTop: 8, display: 'inline-block' }}>管理者</Link>
        </footer>
      </body>
    </html>
  )
}
