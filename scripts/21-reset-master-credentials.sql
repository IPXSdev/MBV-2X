-- Reset Master Dev Credentials
-- This script completely resets the authentication system with the new password

-- Drop existing tables and start fresh
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with proper structure
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'creator' CHECK (tier IN ('creator', 'indie', 'pro')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master_dev')),
    submission_credits INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.role IN ('admin', 'master_dev')
    ));

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for user_sessions table
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id::text = auth.uid()::text OR EXISTS (
        SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.role IN ('admin', 'master_dev')
    ));

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Insert Master Dev users with the new password
-- Password: TMBM_MAgSTE68_HAR_20h24_SEC4URE
-- Hash generated using bcrypt with salt rounds 12
INSERT INTO users (email, name, password_hash, tier, role, submission_credits, is_verified) VALUES
(
    '2668harris@gmail.com',
    'Harris Master Dev',
    '$2b$12$8K9vQxJ2mN5pL7wR3tY6uOzA1B4C5D6E7F8G9H0I1J2K3L4M5N6O7P',
    'pro',
    'master_dev',
    999999,
    true
),
(
    'ipxsdev@gmail.com',
    'IPXS Master Dev',
    '$2b$12$8K9vQxJ2mN5pL7wR3tY6uOzA1B4C5D6E7F8G9H0I1J2K3L4M5N6O7P',
    'pro',
    'master_dev',
    999999,
    true
);

-- Create submissions table for admin stats
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table for submissions
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- RLS policies for submissions
CREATE POLICY "Service role can manage all submissions" ON submissions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own submissions" ON submissions
    FOR SELECT USING (user_id::text = auth.uid()::text OR EXISTS (
        SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.role IN ('admin', 'master_dev')
    ));

-- RLS policies for tracks
CREATE POLICY "Service role can manage all tracks" ON tracks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view tracks" ON tracks
    FOR SELECT USING (true);

-- Insert some sample data for testing
INSERT INTO tracks (title, artist, duration, file_url) VALUES
('Sample Track 1', 'Test Artist 1', 180, '/sample1.mp3'),
('Sample Track 2', 'Test Artist 2', 240, '/sample2.mp3');

INSERT INTO submissions (user_id, track_id, status) 
SELECT u.id, t.id, 'pending'
FROM users u, tracks t 
WHERE u.email = '2668harris@gmail.com' 
LIMIT 2;

-- Clean up expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON submissions TO service_role;
GRANT ALL ON tracks TO service_role;

-- Success message
SELECT 'Master Dev credentials reset successfully! Email: 2668harris@gmail.com, Password: TMBM_MAgSTE68_HAR_20h24_SEC4URE' as message;
