export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
        <p style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.2em', margin: '0 0 4px' }}>ADMIN</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>上田写真館 管理画面</h1>
      </div>
      {children}
    </div>
  )
}
