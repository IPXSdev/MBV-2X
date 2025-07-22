-- Create submissions table for admin portal
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    track_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    mood_tags TEXT[],
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'reviewed', 'accepted', 'declined')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- Insert some sample submissions for testing
INSERT INTO submissions (user_id, track_title, artist_name, genre, status, created_at) 
SELECT 
    u.id,
    CASE 
        WHEN random() < 0.33 THEN 'Midnight Vibes'
        WHEN random() < 0.66 THEN 'City Lights'
        ELSE 'Underground Flow'
    END,
    CASE 
        WHEN random() < 0.33 THEN 'DJ Shadow'
        WHEN random() < 0.66 THEN 'MC Thunder'
        ELSE 'Beat Master'
    END,
    CASE 
        WHEN random() < 0.33 THEN 'Hip-Hop'
        WHEN random() < 0.66 THEN 'R&B'
        ELSE 'Electronic'
    END,
    CASE 
        WHEN random() < 0.25 THEN 'submitted'
        WHEN random() < 0.5 THEN 'reviewing'
        WHEN random() < 0.75 THEN 'reviewed'
        ELSE 'accepted'
    END,
    NOW() - (random() * INTERVAL '30 days')
FROM users u 
WHERE u.role = 'user' 
LIMIT 10;

-- Grant permissions
GRANT ALL ON submissions TO postgres;
GRANT ALL ON submissions TO anon;
GRANT ALL ON submissions TO authenticated;
GRANT ALL ON submissions TO service_role;

-- Disable RLS for submissions table
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

COMMIT;
