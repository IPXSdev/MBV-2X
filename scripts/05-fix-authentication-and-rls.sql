-- First, let's check and fix the master dev authentication
-- Update the master dev users with proper setup
UPDATE users 
SET 
  tier = 'pro',
  submission_credits = 999,
  role = 'master_dev',
  is_verified = true
WHERE email IN ('2668harris@gmail.com', 'ipxsdev@gmail.com');

-- If the users don't exist, create them
INSERT INTO users (id, email, name, tier, submission_credits, role, is_verified) 
VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  '2668harris@gmail.com',
  'Harris (Master Dev)',
  'pro',
  999,
  'master_dev',
  true
),
(
  '00000000-0000-0000-0000-000000000002',
  'ipxsdev@gmail.com',
  'IPXS Dev (Master Dev)',
  'pro',
  999,
  'master_dev',
  true
)
ON CONFLICT (email) DO UPDATE SET
  tier = EXCLUDED.tier,
  submission_credits = EXCLUDED.submission_credits,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;

-- Clean up any old sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Fix Row Level Security - Enable RLS on all tables that should have it
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_dev_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Anyone can view hosts" ON hosts;
DROP POLICY IF EXISTS "Anyone can view podcast episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "Anyone can view placements" ON placements;
DROP POLICY IF EXISTS "Admins have full access to all tables" ON users;

-- Create a function to get current user ID from session
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from current session token in cookie
  SELECT us.user_id INTO user_id
  FROM user_sessions us
  WHERE us.session_token = current_setting('request.cookie.session', true)
    AND us.expires_at > NOW();
  
  RETURN user_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate RLS policies with proper logic
-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    id = get_current_user_id() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = get_current_user_id() 
      AND u.role IN ('admin', 'master_dev')
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    id = get_current_user_id() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = get_current_user_id() 
      AND u.role IN ('admin', 'master_dev')
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = get_current_user_id() 
      AND u.role IN ('admin', 'master_dev')
    )
  );

-- Tracks table policies
CREATE POLICY "Users can view own tracks" ON tracks
  FOR SELECT USING (
    user_id = get_current_user_id() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = get_current_user_id() 
      AND u.role IN ('admin', 'master_dev')
    )
  );

CREATE POLICY "Users can insert own tracks" ON tracks
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update own tracks" ON tracks
  FOR UPDATE USING (
    user_id = get_current_user_id() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = get_current_user_id() 
      AND u.role IN ('admin', 'master_dev')
    )
  );

-- Submissions table policies
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (
    user_id = get_current_user_id() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = get_current_user_id() 
      AND u.role IN ('admin', 'master_dev')
    )
  );

CREATE POLICY "Users can create own submissions" ON submissions
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- Sessions table policies
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (user_id = get_current_user_id());

-- Public read access for hosts and podcast episodes (no RLS needed)
ALTER TABLE hosts DISABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE placements DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON hosts TO anon, authenticated;
GRANT SELECT ON podcast_episodes TO anon, authenticated;
GRANT SELECT ON placements TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON tracks TO authenticated;
GRANT ALL ON submissions TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
