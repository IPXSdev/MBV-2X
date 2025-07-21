-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_dev_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')
    ));

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')
    ));

-- Tracks policies
CREATE POLICY "Users can view own tracks" ON tracks
    FOR SELECT USING (user_id::text = auth.uid()::text OR EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')
    ));

CREATE POLICY "Users can insert own tracks" ON tracks
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own tracks" ON tracks
    FOR UPDATE USING (user_id::text = auth.uid()::text OR EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')
    ));

-- Submissions policies
CREATE POLICY "Users can view own submissions" ON submissions
    FOR SELECT USING (user_id::text = auth.uid()::text OR EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')
    ));

CREATE POLICY "Users can create own submissions" ON submissions
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Public read access for hosts and podcast episodes
CREATE POLICY "Anyone can view hosts" ON hosts FOR SELECT USING (true);
CREATE POLICY "Anyone can view podcast episodes" ON podcast_episodes FOR SELECT USING (true);
CREATE POLICY "Anyone can view placements" ON placements FOR SELECT USING (true);

-- Admin/Master Dev full access
CREATE POLICY "Admins have full access to all tables" ON users FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')
));
