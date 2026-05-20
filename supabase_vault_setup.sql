-- ============================================================
-- ByteLens — Vault Photos Table & Storage Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create vault_photos table
CREATE TABLE IF NOT EXISTS vault_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  status TEXT DEFAULT 'private' CHECK (status IN ('private', 'selling')),
  sell_price INTEGER,
  title TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE vault_photos ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: users can only manage their own vault photos
CREATE POLICY "Users can view own vault photos"
  ON vault_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault photos"
  ON vault_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault photos"
  ON vault_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault photos"
  ON vault_photos FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Public read for photos marked as 'selling' (for marketplace)
CREATE POLICY "Anyone can view selling photos"
  ON vault_photos FOR SELECT
  USING (status = 'selling');

-- 5. Create index for faster queries
CREATE INDEX idx_vault_photos_user_id ON vault_photos(user_id);
CREATE INDEX idx_vault_photos_status ON vault_photos(status);

-- ============================================================
-- STORAGE BUCKET SETUP
-- Go to Supabase Dashboard → Storage → Create new bucket:
--   Name: vault-photos
--   Public: false (private)
--
-- Then add these storage policies via SQL:
-- ============================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own vault folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own vault files
CREATE POLICY "Users can view own vault files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own vault files
CREATE POLICY "Users can delete own vault files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vault-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read for files that correspond to 'selling' status
-- (This is handled at the application level by generating signed URLs)
