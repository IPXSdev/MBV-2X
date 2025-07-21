-- Fix authentication issues and clean up database
-- This script will fix duplicate users and ensure proper authentication

-- First, let's clean up any duplicate sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Clean up any duplicate users (keep the most recent one)
WITH duplicate_users AS (
  SELECT email, 
         array_agg(id ORDER BY created_at DESC) as user_ids
  FROM users 
  GROUP BY email 
  HAVING count(*) > 1
)
DELETE FROM users 
WHERE id IN (
  SELECT unnest(user_ids[2:]) 
  FROM duplicate_users
);

-- Clean up orphaned sessions
DELETE FROM user_sessions 
WHERE user_id NOT IN (SELECT id FROM users);

-- Ensure master dev users exist with correct data
INSERT INTO users (email, name, tier, submission_credits, role, is_verified, created_at, updated_at)
VALUES 
  ('2668harris@gmail.com', 'Harris (Master Dev)', 'creator', 999, 'master_dev', true, NOW(), NOW()),
  ('ipxsdev@gmail.com', 'IPXS Dev (Master Dev)', 'creator', 999, 'master_dev', true, NOW(), NOW())
ON CONFLICT (email) 
DO UPDATE SET 
  tier = 'creator',
  submission_credits = 999,
  role = 'master_dev',
  is_verified = true,
  updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Grant permissions (ensure RLS is disabled)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON user_sessions TO anon, authenticated;

-- Verify the setup
SELECT 'Users count:' as info, count(*) as value FROM users
UNION ALL
SELECT 'Master devs:' as info, count(*) as value FROM users WHERE role = 'master_dev'
UNION ALL
SELECT 'Active sessions:' as info, count(*) as value FROM user_sessions WHERE expires_at > NOW();
