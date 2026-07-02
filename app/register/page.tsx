import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import RegisterForm from './RegisterForm'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.name) redirect('/')

  return (
    <main style={{
      minHeight: '70vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: '0.05em' }}>
          はじめまして
        </h1>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 32, lineHeight: 1.9 }}>
          お名前と電話番号を登録してください。<br />
          写真のダウンロード時に使用します。
        </p>
        <RegisterForm userId={user.id} email={user.email ?? ''} />
      </div>
    </main>
  )
}
