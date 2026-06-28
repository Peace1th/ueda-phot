import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(url, anon)
export const supabaseAdmin = createClient(url, service)

export type Album = {
  id: string
  slug: string
  name: string
  description: string
  drive_folder_id: string
  cover_file_id: string | null
  watermark_text: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}
