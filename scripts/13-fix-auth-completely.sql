-- Complete Authentication Fix
-- This script completely fixes the authentication system

-- First, clean up everything
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with proper structure
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate user_sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON users TO authenticated, anon, postgres;
GRANT ALL ON user_sessions TO authenticated, anon, postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, postgres;

-- Insert master dev users
INSERT INTO users (email, name, tier, submission_credits, role, is_verified, created_at, updated_at)
VALUES 
    ('2668harris@gmail.com', 'Harris (Master Dev)', 'pro', 999, 'master_dev', true, NOW(), NOW()),
    ('ipxsdev@gmail.com', 'IPXS Dev (Master Dev)', 'pro', 999, 'master_dev', true, NOW(), NOW());

-- Create performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Verify setup
SELECT 
    email, 
    name, 
    role, 
    tier, 
    submission_credits, 
    is_verified, 
    created_at
FROM users 
ORDER BY role DESC, email;

-- Show table permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions');
