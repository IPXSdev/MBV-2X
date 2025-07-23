-- Ensure users table has all necessary columns
DO $$
BEGIN
    -- Add password_hash column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Added password_hash column to users table';
    END IF;

    -- Add legal_waiver_accepted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'legal_waiver_accepted') THEN
        ALTER TABLE users ADD COLUMN legal_waiver_accepted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added legal_waiver_accepted column to users table';
    END IF;

    -- Add legal_waiver_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'legal_waiver_date') THEN
        ALTER TABLE users ADD COLUMN legal_waiver_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added legal_waiver_date column to users table';
    END IF;

    -- Add compensation_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'compensation_type') THEN
        ALTER TABLE users ADD COLUMN compensation_type VARCHAR(50) DEFAULT 'no_compensation';
        RAISE NOTICE 'Added compensation_type column to users table';
    END IF;
END $$;

-- Ensure user_sessions table exists
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Clean up expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW();

RAISE NOTICE 'Auth schema setup completed successfully';
