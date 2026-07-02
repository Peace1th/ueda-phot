'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

export default function HeaderAuth() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <Link href="/" style={{ fontSize: 13, color: 'var(--sub)', textDecoration: 'none' }}>
        ログイン
      </Link>
    )
  }

  return (
    <Link href="/mypage" style={{
      fontSize: 12, color: 'var(--ink)', textDecoration: 'none',
      border: '1px solid var(--line)', borderRadius: 5,
      padding: '5px 14px', letterSpacing: '0.04em',
    }}>
      マイページ
    </Link>
  )
}
