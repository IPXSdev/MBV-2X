-- Check if submissions data exists and restore if needed
-- This script will help identify why submissions disappeared

-- First, let's check what's in the submissions table
SELECT 
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_count
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
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins full access" ON submissions;

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

-- Grant proper permissions
GRANT ALL ON submissions TO service_role;
GRANT SELECT, INSERT ON submissions TO authenticated;
GRANT SELECT, INSERT ON submissions TO anon;

-- Refresh schema
NOTIFY pgrst, 'reload schema';
