-- Fix RLS policies for submissions and storage
-- This script simplifies RLS policies to work with service role operations

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON submissions;

-- Create simplified RLS policies for submissions
CREATE POLICY "Enable read access for service role" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON submissions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for service role" ON submissions
  FOR DELETE USING (true);

-- Ensure storage bucket exists and has correct permissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-submissions', 'audio-submissions', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Create storage policies for audio-submissions bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;

CREATE POLICY "Enable read access for all users" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-submissions');

CREATE POLICY "Enable insert access for all users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio-submissions');

CREATE POLICY "Enable update access for all users" ON storage.objects
  FOR UPDATE USING (bucket_id = 'audio-submissions');

CREATE POLICY "Enable delete access for all users" ON storage.objects
  FOR DELETE USING (bucket_id = 'audio-submissions');

-- Grant necessary permissions to authenticated users
GRANT ALL ON submissions TO authenticated;
GRANT ALL ON users TO authenticated;

-- Ensure the service role can bypass RLS
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- Update any existing submissions to ensure they have proper user associations
UPDATE submissions 
SET user_id = (
  SELECT id FROM users 
  WHERE users.email = submissions.contact_email 
  LIMIT 1
)
WHERE user_id IS NULL AND contact_email IS NOT NULL;

COMMIT;
