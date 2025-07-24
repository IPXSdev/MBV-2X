-- Check if submissions data exists and restore if needed
-- This script will help identify why submissions disappeared

-- First, let's check what's in the submissions table
SELECT 
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions
FROM submissions;

-- Check if there are any submissions from the last 30 days
SELECT 
  id,
  track_title,
  artist_name,
  status,
  created_at,
  user_id
FROM submissions 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Check users table to see if user data is intact
SELECT 
  id,
  email,
  name,
  role,
  tier,
  submission_credits,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Check user_sessions to see active sessions
SELECT 
  COUNT(*) as active_sessions,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_sessions
FROM user_sessions;

-- If data is missing, we need to check if RLS policies are blocking access
-- Let's temporarily disable RLS to see all data
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
SELECT COUNT(*) as total_submissions_no_rls FROM submissions;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Check storage bucket for uploaded files
SELECT 
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'audio-submissions'
ORDER BY created_at DESC
LIMIT 10;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Service role bypass" ON submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Service role can manage all submissions" ON storage.objects;

-- Create proper RLS policies
CREATE POLICY "Service role bypass" ON submissions
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view submissions" ON submissions
  FOR SELECT 
  TO authenticated, anon, service_role
  USING (true);

CREATE POLICY "Admins can update submissions" ON submissions
  FOR UPDATE 
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'master_dev')
    )
  );

CREATE POLICY "Users can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'master_dev')
    )
  );

CREATE POLICY "Service role can manage all submissions" ON submissions
  FOR ALL USING (true);

-- Grant proper permissions
GRANT ALL ON submissions TO service_role;
GRANT SELECT, INSERT, UPDATE ON submissions TO authenticated;
GRANT SELECT, INSERT ON submissions TO anon;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

-- Check storage bucket permissions
SELECT * FROM storage.buckets WHERE name = 'audio-submissions';

-- Ensure storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-submissions', 'audio-submissions', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];

-- Fix storage policies
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all files" ON storage.objects;

CREATE POLICY "Users can upload their own audio files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-submissions' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('admin', 'master_dev')))
  );

CREATE POLICY "Users can view their own audio files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio-submissions' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('admin', 'master_dev')))
  );

CREATE POLICY "Service role can manage all files" ON storage.objects
  FOR ALL USING (bucket_id = 'audio-submissions');

-- Check if any submissions are missing due to user_id mismatch
SELECT 
  s.id,
  s.user_id,
  s.title,
  s.artist_name,
  s.created_at,
  u.email,
  u.name
FROM submissions s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Show recent submissions to verify data integrity
SELECT 
  s.id,
  s.title,
  s.artist_name,
  s.status,
  s.created_at,
  u.email,
  u.name
FROM submissions s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 10;
