-- =============================================
-- TMBM Authentication System Restoration
-- This script completely resets and restores the authentication system
-- =============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Disable RLS on auth schema (if it exists)
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;

-- Create users table with proper structure
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'creator' CHECK (tier IN ('creator', 'indie', 'pro')),
    submission_credits INTEGER NOT NULL DEFAULT 0,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master_dev')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on our tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated and anon roles
GRANT ALL ON users TO authenticated, anon, service_role;
GRANT ALL ON user_sessions TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Insert master dev users with exact credentials
INSERT INTO users (
    email, 
    name, 
    tier, 
    submission_credits, 
    role, 
    is_verified
) VALUES 
(
    '2668harris@gmail.com',
    'Darion Harris',
    'pro',
    999999,
    'master_dev',
    true
),
(
    'ipxsdev@gmail.com', 
    'IPXS Developer',
    'pro',
    999999,
    'master_dev',
    true
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    submission_credits = EXCLUDED.submission_credits,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified;

-- Verify the setup
SELECT 'Authentication system restored successfully!' as status;
SELECT 'Master dev users created:' as info;
SELECT email, name, role, tier, submission_credits FROM users WHERE role = 'master_dev';
SELECT 'Tables created:' as tables_info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'user_sessions');
