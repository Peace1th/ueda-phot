-- 上田写真館 Supabase スキーマ
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください

create table if not exists albums (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        unique not null,
  name             text        not null,
  description      text        default '',
  drive_folder_id  text        not null,
  cover_file_id    text,
  password_hash    text        not null,
  watermark_text   text        default '上田写真館',
  is_active        boolean     default true,
  start_date       date,
  end_date         date,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 例）テスト用アルバム（パスワードは別途 bcrypt でハッシュ化）
-- insert into albums (slug, name, password_hash, drive_folder_id)
-- values ('test-album', 'テストアルバム', '$2b$10$...', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74Ojc');
