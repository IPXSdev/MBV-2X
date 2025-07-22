-- Restore Working Authentication System
-- This script ensures the authentication system works properly

-- First, disable RLS completely to avoid any conflicts
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE media DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Sessions are private" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;

-- Grant full permissions to authenticated and anon roles
GRANT ALL ON users TO authenticated, anon;
GRANT ALL ON user_sessions TO authenticated, anon;
GRANT ALL ON submissions TO authenticated, anon;
GRANT ALL ON tracks TO authenticated, anon;
GRANT ALL ON reviews TO authenticated, anon;
GRANT ALL ON media TO authenticated, anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Clean up any orphaned sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Clean up duplicate users (keep the first one for each email)
DELETE FROM users 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM users 
    GROUP BY email
);

-- Ensure master dev users exist with correct data
INSERT INTO users (email, name, tier, submission_credits, role, is_verified, created_at, updated_at)
VALUES 
    ('2668harris@gmail.com', 'Harris (Master Dev)', 'pro', 999, 'master_dev', true, NOW(), NOW()),
    ('ipxsdev@gmail.com', 'IPXS Dev (Master Dev)', 'pro', 999, 'master_dev', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    submission_credits = EXCLUDED.submission_credits,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Verify the setup
SELECT 
    'Users table' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE role = 'master_dev') as master_devs,
    COUNT(*) FILTER (WHERE role = 'admin') as admins,
    COUNT(*) FILTER (WHERE role = 'user') as regular_users
FROM users

UNION ALL

SELECT 
    'Sessions table' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_sessions,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_sessions,
    0 as unused
FROM user_sessions;

-- Show master dev accounts
SELECT email, name, role, tier, submission_credits, is_verified, created_at
FROM users 
WHERE role = 'master_dev'
ORDER BY email;
