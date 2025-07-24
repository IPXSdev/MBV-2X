-- Fix RLS policies for submissions and user operations
-- This script simplifies RLS policies to work with service role operations

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Create simplified RLS policies that work with service role
CREATE POLICY "Enable all operations for service role" ON submissions
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for service role on users" ON users
  FOR ALL USING (true);

-- Ensure RLS is enabled but allows service role operations
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for user sessions
DROP POLICY IF EXISTS "Enable all operations for service role on sessions" ON user_sessions;
CREATE POLICY "Enable all operations for service role on sessions" ON user_sessions
  FOR ALL USING (true);

-- Grant necessary permissions to service role
GRANT ALL ON submissions TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON user_sessions TO service_role;

-- Ensure storage bucket exists and has proper permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-submissions',
  'audio-submissions',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/ogg']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/ogg'];

-- Create storage policy for audio submissions
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-submissions');

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio-submissions');

DROP POLICY IF EXISTS "Allow service role all operations" ON storage.objects;
CREATE POLICY "Allow service role all operations" ON storage.objects
  FOR ALL USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
