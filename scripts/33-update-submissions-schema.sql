-- Update submissions table to match new schema
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS track_title TEXT,
ADD COLUMN IF NOT EXISTS artist_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1;

-- Update existing records to use new column names if they exist
UPDATE submissions 
SET track_title = title 
WHERE track_title IS NULL AND title IS NOT NULL;

UPDATE submissions 
SET artist_name = COALESCE(
  (SELECT name FROM users WHERE users.id = submissions.user_id),
  'Unknown Artist'
)
WHERE artist_name IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_track_title ON submissions(track_title);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_name ON submissions(artist_name);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- Update RLS policies to work with new schema
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
CREATE POLICY "Users can view own submissions" ON submissions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
CREATE POLICY "Users can insert own submissions" ON submissions
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
CREATE POLICY "Admins can view all submissions" ON submissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'master_dev')
  )
);
