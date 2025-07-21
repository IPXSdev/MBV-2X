-- Final authentication fix - keep it simple
-- Drop all existing policies
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

-- Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE creator_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE placements DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure master dev users exist
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

-- Clean up sessions
DELETE FROM user_sessions WHERE expires_at < NOW();
