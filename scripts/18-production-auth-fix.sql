-- =============================================
-- PRODUCTION AUTHENTICATION SYSTEM SETUP
-- =============================================

-- Drop existing tables and policies
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Disable RLS temporarily for setup
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;

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
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM user_sessions 
        WHERE user_sessions.user_id = users.id 
        AND session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    ));

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert" ON users
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for user_sessions table
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

-- Grant permissions to service role
GRANT ALL ON users TO service_role;
GRANT ALL ON user_sessions TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_sessions TO authenticated;

-- Insert master dev users
INSERT INTO users (email, name, tier, submission_credits, role, is_verified) VALUES
('2668harris@gmail.com', 'Darion Harris', 'pro', 999999, 'master_dev', true),
('ipxsdev@gmail.com', 'IPXS Dev', 'pro', 999999, 'master_dev', true)
ON CONFLICT (email) DO UPDATE SET
    tier = EXCLUDED.tier,
    submission_credits = EXCLUDED.submission_credits,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Production authentication system setup complete!' as status;
SELECT email, name, role, tier FROM users WHERE role = 'master_dev';
