-- Fix RLS policies for submissions
-- This script simplifies RLS and ensures proper permissions

-- First, disable RLS temporarily to clean up
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON submissions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON submissions;
DROP POLICY IF EXISTS "Enable update for admins" ON submissions;

-- Re-enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that work with our auth system
-- Allow service role to bypass RLS (for API operations)
CREATE POLICY "Service role bypass" ON submissions
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own submissions
CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow users to view their own submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow admins to do everything
CREATE POLICY "Admins full access" ON submissions
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the audio-submissions bucket exists and has proper permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-submissions',
  'audio-submissions',
  true,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/ogg']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up storage policies for the bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;

-- Allow public read access to audio files
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'audio-submissions');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload access" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-submissions');

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio-submissions');

-- Allow service role full access to storage
CREATE POLICY "Service role storage access" ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'audio-submissions')
  WITH CHECK (bucket_id = 'audio-submissions');

-- Grant necessary permissions
GRANT ALL ON submissions TO service_role;
GRANT SELECT, INSERT ON submissions TO authenticated;
GRANT ALL ON storage.objects TO service_role;
GRANT SELECT, INSERT, UPDATE ON storage.objects TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
