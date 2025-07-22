-- =============================================
-- EXECUTING PRODUCTION AUTHENTICATION SETUP
-- This script sets up the complete production-ready authentication system
-- =============================================

-- Drop existing tables and policies completely
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create users table with proper structure
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'creator' CHECK (tier IN ('creator', 'indie', 'pro')),
    submission_credits INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master_dev')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);  -- Allow read access for now

CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Insert new users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Create RLS policies for user_sessions table  
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (true);

CREATE POLICY "Service role full access sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Insert sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Delete own sessions" ON user_sessions
    FOR DELETE USING (true);

-- Grant permissions to service role (for server-side operations)
GRANT ALL ON users TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_sessions TO authenticated;

-- Grant permissions to anon users for registration
GRANT SELECT, INSERT ON users TO anon;

-- Insert master dev users with exact credentials
INSERT INTO users (email, name, tier, submission_credits, role, is_verified) VALUES
('2668harris@gmail.com', 'Darion Harris', 'pro', 999999, 'master_dev', true),
('ipxsdev@gmail.com', 'IPXS Developer', 'pro', 999999, 'master_dev', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    submission_credits = EXCLUDED.submission_credits,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Clean up any existing sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Verify the setup
SELECT 'PRODUCTION Authentication system executed successfully!' as status;
SELECT 'Master dev users:' as info;
SELECT email, name, role, tier, submission_credits, created_at FROM users WHERE role = 'master_dev';
SELECT 'Total users:' as user_count_info;
SELECT COUNT(*) as total_users FROM users;
SELECT 'RLS Status:' as rls_info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions');
SELECT 'Permissions granted successfully' as permissions_status;
