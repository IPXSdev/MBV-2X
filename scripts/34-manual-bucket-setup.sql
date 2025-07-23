-- Manual bucket setup for audio-submissions
-- Run this directly in Supabase SQL Editor

-- First, let's check what buckets currently exist
SELECT 'Current buckets before setup:' as info;
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;

-- Enable RLS on storage.objects and storage.buckets if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies for audio-submissions to start fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to audio-submissions" ON storage.objects;

-- Create or replace the audio-submissions bucket
INSERT INTO storage.buckets (
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at,
    updated_at
) VALUES (
    'audio-submissions',
    'audio-submissions', 
    true,
    52428800, -- 50MB in bytes
    ARRAY[
        'audio/mpeg',
        'audio/mp3',
        'audio/wav', 
        'audio/wave',
        'audio/x-wav',
        'audio/flac',
        'audio/x-flac',
        'audio/aac',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'audio/ogg',
        'audio/webm'
    ],
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    updated_at = NOW();

-- Create comprehensive policies for the audio-submissions bucket
-- Policy 1: Allow anyone to upload to audio-submissions
CREATE POLICY "Allow public uploads to audio-submissions"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'audio-submissions');

-- Policy 2: Allow anyone to read from audio-submissions  
CREATE POLICY "Allow public read access to audio-submissions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-submissions');

-- Policy 3: Allow authenticated users to upload to audio-submissions
CREATE POLICY "Allow authenticated uploads to audio-submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-submissions');

-- Policy 4: Allow authenticated users to read from audio-submissions
CREATE POLICY "Allow authenticated read access to audio-submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-submissions');

-- Policy 5: Allow admin users full access to audio-submissions
CREATE POLICY "Allow admin full access to audio-submissions"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'audio-submissions' AND
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role IN ('admin', 'master_dev')
    )
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT INSERT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Also grant permissions on the buckets table
GRANT SELECT ON storage.buckets TO public;

-- Create a policy for bucket access
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
CREATE POLICY "Allow public bucket access"
ON storage.buckets FOR SELECT
TO public
USING (true);

-- Final verification
SELECT 'Buckets after setup:' as info;
SELECT id, name, public, file_size_limit, 
       array_length(allowed_mime_types, 1) as mime_type_count
FROM storage.buckets;

SELECT 'Storage object policies:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

SELECT 'Storage bucket policies:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'buckets' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Test bucket access
SELECT 'Testing bucket access:' as info;
SELECT 
    CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'audio-submissions') 
         THEN 'BUCKET EXISTS' 
         ELSE 'BUCKET MISSING' 
    END as bucket_status;

-- Show final summary
SELECT 'Setup Summary:' as info;
SELECT 
    (SELECT COUNT(*) FROM storage.buckets) as total_buckets,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'audio-submissions') as audio_submissions_bucket,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') as object_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'buckets' AND schemaname = 'storage') as bucket_policies;
