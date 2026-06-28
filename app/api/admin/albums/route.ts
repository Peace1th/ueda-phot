import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

// アルバム一覧取得
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })
  return Response.json(data ?? [])
}

// アルバム作成
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { name, slug, description, password, drive_folder_id, cover_file_id, watermark_text, start_date, end_date } = body

  if (!name || !slug || !password || !drive_folder_id) {
    return Response.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabaseAdmin
    .from('albums')
    .insert({ name, slug, description, password_hash, drive_folder_id, cover_file_id: cover_file_id || null, watermark_text, start_date: start_date || null, end_date: end_date || null })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}

// アルバム更新（is_active 切り替えなど）
export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...fields } = await req.json()
  if (!id) return Response.json({ error: 'id が必要です' }, { status: 400 })

  if (fields.password) {
    fields.password_hash = await bcrypt.hash(fields.password, 10)
    delete fields.password
  }

  const { data, error } = await supabaseAdmin
    .from('albums')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

// アルバム削除
export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('albums').delete().eq('id', id)
  return Response.json({ ok: true })
}
