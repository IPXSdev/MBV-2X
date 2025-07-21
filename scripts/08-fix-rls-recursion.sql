-- Complete RLS fix and database setup
-- First, drop all existing policies that might cause issues
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON tracks;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON submissions;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Master dev can view all users" ON users;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admin can view all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own submissions" ON creator_submissions;
DROP POLICY IF EXISTS "Admin can view all submissions" ON creator_submissions;

-- Completely disable RLS on all tables
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creator_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS podcast_episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS placements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hosts DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure master dev users exist with correct data
INSERT INTO users (email, name, tier, submission_credits, role, is_verified, created_at, updated_at)
VALUES 
  ('2668harris@gmail.com', 'Harris Master Dev', 'pro', 999, 'master_dev', true, NOW(), NOW()),
  ('ipxsdev@gmail.com', 'IPXS Master Dev', 'pro', 999, 'master_dev', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  tier = EXCLUDED.tier,
  submission_credits = EXCLUDED.submission_credits,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Clean up any orphaned sessions
DELETE FROM user_sessions WHERE expires_at < NOW();
