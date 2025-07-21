-- Complete database reset and proper setup
-- Disable RLS completely to avoid recursion issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE hosts DISABLE ROW LEVEL SECURITY;
ALTER TABLE placements DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON user_sessions;

-- Grant full permissions to all roles
GRANT ALL ON users TO anon, authenticated, service_role;
GRANT ALL ON user_sessions TO anon, authenticated, service_role;
GRANT ALL ON podcast_episodes TO anon, authenticated, service_role;
GRANT ALL ON hosts TO anon, authenticated, service_role;
GRANT ALL ON placements TO anon, authenticated, service_role;
GRANT ALL ON submissions TO anon, authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Clean up existing data
DELETE FROM user_sessions;
DELETE FROM users WHERE email IN ('2668harris@gmail.com', 'ipxsdev@gmail.com');

-- Insert master dev users with correct tier
INSERT INTO users (id, email, name, tier, submission_credits, role, is_verified) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '2668harris@gmail.com',
    'Harris (Master Dev)',
    'creator',
    999,
    'master_dev',
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'ipxsdev@gmail.com',
    'IPXS Dev (Master Dev)',
    'creator',
    999,
    'master_dev',
    true
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Clean up expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Ensure proper permissions
ALTER TABLE users OWNER TO postgres;
ALTER TABLE user_sessions OWNER TO postgres;

-- Final verification
SELECT 'Database setup complete' as status;
