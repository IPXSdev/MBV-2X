-- Execute the submissions functionality setup
-- This script ensures all required tables, columns, policies, and functions are in place

-- Ensure submissions table has all required columns and proper structure
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'track_title') THEN
        ALTER TABLE submissions ADD COLUMN track_title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'artist_name') THEN
        ALTER TABLE submissions ADD COLUMN artist_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'description') THEN
        ALTER TABLE submissions ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'file_size') THEN
        ALTER TABLE submissions ADD COLUMN file_size BIGINT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'duration') THEN
        ALTER TABLE submissions ADD COLUMN duration NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'credits_used') THEN
        ALTER TABLE submissions ADD COLUMN credits_used INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'admin_rating') THEN
        ALTER TABLE submissions ADD COLUMN admin_rating INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'admin_feedback') THEN
        ALTER TABLE submissions ADD COLUMN admin_feedback TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'reviewed_by') THEN
        ALTER TABLE submissions ADD COLUMN reviewed_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'reviewed_at') THEN
        ALTER TABLE submissions ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Ensure users table has submission_credits column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'submission_credits') THEN
        ALTER TABLE users ADD COLUMN submission_credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_admin_rating ON submissions(admin_rating);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_users_submission_credits ON users(submission_credits);

-- Enable RLS on submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON submissions;

-- Create RLS policies for submissions
CREATE POLICY "Users can view own submissions" ON submissions
FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('admin', 'master_dev')
    )
);

CREATE POLICY "Users can insert own submissions" ON submissions
FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.submission_credits > 0
    )
);

CREATE POLICY "Admins can manage all submissions" ON submissions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('admin', 'master_dev')
    )
);

-- Ensure audio-submissions bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-submissions', 
    'audio-submissions', 
    true, 
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can view audio-submissions" ON storage.objects;

-- Create storage policies for audio submissions
CREATE POLICY "Users can upload to audio-submissions" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'audio-submissions' AND
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.submission_credits > 0
    )
);

CREATE POLICY "Public can view audio-submissions" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-submissions');

CREATE POLICY "Admins can manage audio-submissions" ON storage.objects
FOR ALL USING (
    bucket_id = 'audio-submissions' AND
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('admin', 'master_dev')
    )
);

-- Create function to automatically deduct credits on submission
CREATE OR REPLACE FUNCTION deduct_submission_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Only deduct credits for non-master_dev users
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = NEW.user_id 
        AND users.role != 'master_dev'
    ) THEN
        UPDATE users 
        SET submission_credits = GREATEST(0, submission_credits - 1),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically deduct credits
DROP TRIGGER IF EXISTS trigger_deduct_submission_credit ON submissions;
CREATE TRIGGER trigger_deduct_submission_credit
    AFTER INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION deduct_submission_credit();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Update existing users to have appropriate credits based on their tier
UPDATE users 
SET submission_credits = CASE 
    WHEN tier = 'creator' THEN 0
    WHEN tier = 'indie' THEN 1
    WHEN tier = 'pro' THEN 2
    WHEN role = 'master_dev' THEN 999999
    ELSE 0
END
WHERE submission_credits IS NULL OR submission_credits = 0;

-- Verify the setup
SELECT 'Submissions table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

SELECT 'Storage buckets:' as info;
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'audio-submissions';

SELECT 'User credits summary:' as info;
SELECT role, tier, COUNT(*) as user_count, AVG(submission_credits) as avg_credits
FROM users 
GROUP BY role, tier
ORDER BY role, tier;
