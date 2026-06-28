import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabaseAdmin
    .from('albums')
    .select('slug, name, description, cover_public_id')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('created_at', { ascending: false })

  return Response.json(data ?? [])
}
