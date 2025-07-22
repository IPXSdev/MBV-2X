-- =============================================
-- CLEAN AUTHENTICATION SYSTEM SETUP
-- Drop everything and start fresh with proper RLS
-- =============================================

-- Drop existing tables and policies completely
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'creator' CHECK (tier IN ('creator', 'indie', 'pro')),
    submission_credits INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master_dev')),
    is_verified BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_sessions table  
CREATE POLICY "Service role full access sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow session creation" ON user_sessions
    FOR INSERT WITH CHECK (true);

-- Insert master dev users
INSERT INTO users (id, email, name, tier, submission_credits, role, is_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '2668harris@gmail.com', 'Harris Master Dev', 'pro', 1000, 'master_dev', true),
    ('550e8400-e29b-41d4-a716-446655440002', 'ipxsdev@gmail.com', 'IPXS Master Dev', 'pro', 1000, 'master_dev', true)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    tier = EXCLUDED.tier,
    submission_credits = EXCLUDED.submission_credits;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_sessions TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Clean authentication system setup complete!' as status;
SELECT email, name, role, tier FROM users WHERE role = 'master_dev';
SELECT 'RLS enabled on tables:' as rls_status;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('users', 'user_sessions');
