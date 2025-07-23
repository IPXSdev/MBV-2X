-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- First, check if bucket exists and delete if it does to recreate properly
DELETE FROM storage.buckets WHERE id = 'audio-submissions';

-- Create the audio-submissions storage bucket with proper configuration
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  avif_autodetection,
  created_at,
  updated_at
)
VALUES (
  'audio-submissions',
  'audio-submissions',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'audio/mpeg', 
    'audio/wav', 
    'audio/flac', 
    'audio/mp3', 
    'audio/x-wav', 
    'audio/x-flac', 
    'audio/aac', 
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a'
  ],
  false,
  NOW(),
  NOW()
);

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for this bucket to start fresh
DROP POLICY IF EXISTS "Users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;

-- Create comprehensive RLS policies for the audio-submissions bucket

-- Policy 1: Allow authenticated users to upload files to audio-submissions bucket
CREATE POLICY "Allow authenticated uploads to audio-submissions" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'audio-submissions'
);

-- Policy 2: Allow public read access to audio-submissions bucket (for playback)
CREATE POLICY "Allow public read access to audio-submissions" ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'audio-submissions'
);

-- Policy 3: Allow authenticated users to view files in audio-submissions bucket
CREATE POLICY "Allow authenticated read access to audio-submissions" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'audio-submissions'
);

-- Policy 4: Allow admins to manage all files in audio-submissions bucket
CREATE POLICY "Allow admin management of audio-submissions" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'audio-submissions' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role IN ('admin', 'master_dev')
  )
);

-- Grant necessary permissions to roles
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Verify the bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'audio-submissions';

-- Also verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%audio-submissions%';
