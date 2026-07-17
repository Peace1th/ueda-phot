import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [viewRes, dlRes, albumsRes] = await Promise.all([
    supabaseAdmin
      .from('view_logs')
      .select('album_slug, ip_address, viewer_email, accessed_at')
      .limit(10000),
    supabaseAdmin
      .from('download_logs')
      .select('album_slug, created_at')
      .limit(10000),
    supabaseAdmin.from('albums').select('slug, name'),
  ])

  const albums   = albumsRes.data ?? []
  const viewLogs = viewRes.data ?? []
  const dlLogs   = dlRes.data ?? []

  const stats = albums.map(album => {
    const views = viewLogs.filter(v => v.album_slug === album.slug)
    const dls   = dlLogs.filter(d => d.album_slug === album.slug)

    const uniqueIPs    = new Set(views.map(v => v.ip_address).filter(Boolean)).size
    const uniqueEmails = new Set(views.map(v => v.viewer_email).filter(Boolean)).size

    return {
      slug:            album.slug,
      name:            album.name,
      view_count:      views.length,
      unique_visitors: Math.max(uniqueIPs, uniqueEmails),
      download_count:  dls.length,
      last_viewed:     views[0]?.accessed_at ?? null,
    }
  })

  return Response.json(stats)
}
