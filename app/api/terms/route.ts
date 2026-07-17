import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_TERMS_REGISTER, DEFAULT_TERMS_DOWNLOAD } from '@/lib/terms-defaults'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', ['terms_register', 'terms_download'])

  const map: Record<string, string> = {}
  ;(data ?? []).forEach(r => { map[r.key] = r.value })

  return Response.json({
    terms_register: map['terms_register'] ?? DEFAULT_TERMS_REGISTER,
    terms_download: map['terms_download'] ?? DEFAULT_TERMS_DOWNLOAD,
  })
}
