-- Complete Authentication Reset Script
-- This will completely reset the authentication system

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'creator' CHECK (tier IN ('creator', 'indie', 'pro')),
    submission_credits INTEGER DEFAULT 0,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master_dev')),
    is_verified BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON users TO anon, authenticated, service_role;
GRANT ALL ON user_sessions TO anon, authenticated, service_role;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Insert master dev users
INSERT INTO users (email, name, tier, submission_credits, role, is_verified) VALUES
('2668harris@gmail.com', 'Harris Master Dev', 'pro', 999999, 'master_dev', true),
('ipxsdev@gmail.com', 'IPXS Master Dev', 'pro', 999999, 'master_dev', true)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    tier = EXCLUDED.tier,
    submission_credits = EXCLUDED.submission_credits,
    is_verified = EXCLUDED.is_verified;

-- Clean up any orphaned sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Verify the setup
SELECT 'Users created:' as status, count(*) as count FROM users;
SELECT 'Master devs:' as status, count(*) as count FROM users WHERE role = 'master_dev';
SELECT 'Sessions cleaned:' as status, count(*) as count FROM user_sessions;
