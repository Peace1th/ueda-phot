import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import RegisterForm from './RegisterForm'
import { DEFAULT_TERMS_REGISTER } from '@/lib/terms-defaults'

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

  const { data: termsSetting } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'terms_register')
    .maybeSingle()
  const terms = termsSetting?.value ?? DEFAULT_TERMS_REGISTER

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
          サービスのご利用にあたり、お名前・電話番号の登録と<br />
          利用規約へのご同意をお願いします。
        </p>
        <RegisterForm userId={user.id} email={user.email ?? ''} terms={terms} />
      </div>
    </main>
  )
}
