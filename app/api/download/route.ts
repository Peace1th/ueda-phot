import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getDriveFileBuffer } from '@/lib/drive'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const { fileId, slug, name, email, phone } = await req.json()

  if (!fileId || !slug || !name?.trim() || !email?.trim()) {
    return new Response('Bad request', { status: 400 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(`album_token_${slug}`)?.value
  if (!token || !verifyToken(token, slug)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: album } = await supabaseAdmin
    .from('albums')
    .select('download_enabled, dl_watermark_enabled, dl_watermark_text, dl_watermark_opacity, dl_watermark_position')
    .eq('slug', slug)
    .single()

  if (!album || !album.download_enabled) {
    return new Response('Download not enabled', { status: 403 })
  }

  await supabaseAdmin.from('download_logs').insert({
    album_slug: slug,
    file_id: fileId,
    requester_name: name.trim(),
    requester_email: email.trim(),
    requester_phone: phone?.trim() || null,
  })

  const buffer = await getDriveFileBuffer(fileId)
  let result: Buffer

  if (album.dl_watermark_enabled && album.dl_watermark_text) {
    const metadata = await sharp(buffer).metadata()
    const imgW = metadata.width ?? 1000
    const fontSize = Math.max(18, Math.round(imgW * 0.022))
    const pad = Math.round(fontSize * 0.6)
    const text = String(album.dl_watermark_text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const svgW = Math.round(text.length * fontSize * 0.65) + pad * 2
    const svgH = fontSize + pad * 2
    const opacity = ((album.dl_watermark_opacity ?? 15) / 100).toFixed(2)

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">
      <text x="${pad}" y="${fontSize + Math.round(pad * 0.3)}"
        font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="700"
        fill="rgba(0,0,0,${opacity})">${text}</text>
    </svg>`

    result = await sharp(buffer)
      .composite([{ input: Buffer.from(svg), gravity: (album.dl_watermark_position ?? 'southwest') as sharp.Gravity }])
      .jpeg({ quality: 95 })
      .toBuffer()
  } else {
    result = await sharp(buffer).jpeg({ quality: 95 }).toBuffer()
  }

  return new Response(new Uint8Array(result), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="photo.jpg"',
      'Cache-Control': 'no-store',
    },
  })
}
