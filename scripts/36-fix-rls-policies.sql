-- Disable RLS temporarily to fix policies
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins have full access to all tables" ON users;

-- Re-enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that work with our custom auth
CREATE POLICY "Allow all operations for service role" ON submissions
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for service role" ON users
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for service role" ON user_sessions
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON submissions TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON master_dev_keys TO service_role;

-- Ensure storage bucket permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-submissions',
    'audio-submissions',
    true,
    52428800, -- 50MB
    ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/aac', 'audio/ogg']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio-submissions');

CREATE POLICY "Allow public access" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio-submissions');
