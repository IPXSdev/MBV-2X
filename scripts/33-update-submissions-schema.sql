-- Update submissions table to match the new API structure
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS track_title TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS duration NUMERIC,
ADD COLUMN IF NOT EXISTS bpm INTEGER,
ADD COLUMN IF NOT EXISTS key_signature TEXT,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1;

-- Update existing records to use track_title if title exists
UPDATE submissions 
SET track_title = title 
WHERE track_title IS NULL AND title IS NOT NULL;

-- Make track_title required going forward
ALTER TABLE submissions 
ALTER COLUMN track_title SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
