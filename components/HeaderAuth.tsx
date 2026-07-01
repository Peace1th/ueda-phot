'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

export default function HeaderAuth() {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <Link href="/" style={{ fontSize: 13, color: 'var(--sub)', textDecoration: 'none' }}>
        ログイン
      </Link>
    )
  }

  return (
    <Link href="/" style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}>
      {profile?.name ?? user.email ?? 'マイページ'}
    </Link>
  )
}
