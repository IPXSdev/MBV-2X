-- Check if the submissions table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'submissions' AND table_schema = 'public') THEN
    -- Table exists, check if it has the correct columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'title' AND table_schema = 'public') THEN
      -- Add title column if it doesn't exist
      ALTER TABLE submissions ADD COLUMN title TEXT;
      
      -- Update existing records to copy track_title to title if track_title exists
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'track_title' AND table_schema = 'public') THEN
        UPDATE submissions SET title = track_title WHERE title IS NULL AND track_title IS NOT NULL;
      END IF;
    END IF;
    
    -- Check if track_title column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'track_title' AND table_schema = 'public') THEN
      -- Add track_title column if it doesn't exist
      ALTER TABLE submissions ADD COLUMN track_title TEXT;
      
      -- Update existing records to copy title to track_title if title exists
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'title' AND table_schema = 'public') THEN
        UPDATE submissions SET track_title = title WHERE track_title IS NULL AND title IS NOT NULL;
      END IF;
    END IF;
    
    -- Ensure both columns have the same data
    UPDATE submissions SET title = track_title WHERE title IS NULL AND track_title IS NOT NULL;
    UPDATE submissions SET track_title = title WHERE track_title IS NULL AND title IS NOT NULL;
    
    RAISE NOTICE 'Submissions table updated to have both title and track_title columns';
  ELSE
    -- Create the submissions table with both columns
    CREATE TABLE submissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      track_title TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      genre TEXT,
      mood_tags TEXT[],
      description TEXT,
      file_url TEXT,
      file_size BIGINT,
      duration INTEGER,
      bpm INTEGER,
      key_signature TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
      admin_rating INTEGER CHECK (admin_rating >= 1 AND admin_rating <= 10),
      admin_feedback TEXT,
      credits_used INTEGER DEFAULT 1,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes for better performance
    CREATE INDEX idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX idx_submissions_status ON submissions(status);
    CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
    
    -- Enable RLS
    ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own submissions" ON submissions
      FOR SELECT USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert their own submissions" ON submissions
      FOR INSERT WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can update their own submissions" ON submissions
      FOR UPDATE USING (user_id = auth.uid());
    
    CREATE POLICY "Admins can view all submissions" ON submissions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'master_dev')
        )
      );
    
    CREATE POLICY "Admins can update all submissions" ON submissions
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'master_dev')
        )
      );
    
    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_submissions_updated_at 
      BEFORE UPDATE ON submissions 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Submissions table created with both title and track_title columns';
  END IF;
END $$;

-- Output the current schema for verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions' AND table_schema = 'public'
ORDER BY ordinal_position;
