-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Add password_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT check_column_exists('users', 'password_hash') THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'Added password_hash column to users table';
  ELSE
    RAISE NOTICE 'password_hash column already exists in users table';
  END IF;
END $$;

-- Add legal_waiver_accepted column if it doesn't exist
DO $$
BEGIN
  IF NOT check_column_exists('users', 'legal_waiver_accepted') THEN
    ALTER TABLE users ADD COLUMN legal_waiver_accepted BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added legal_waiver_accepted column to users table';
  ELSE
    RAISE NOTICE 'legal_waiver_accepted column already exists in users table';
  END IF;
END $$;

-- Add legal_waiver_date column if it doesn't exist
DO $$
BEGIN
  IF NOT check_column_exists('users', 'legal_waiver_date') THEN
    ALTER TABLE users ADD COLUMN legal_waiver_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added legal_waiver_date column to users table';
  ELSE
    RAISE NOTICE 'legal_waiver_date column already exists in users table';
  END IF;
END $$;

-- Add compensation_type column if it doesn't exist
DO $$
BEGIN
  IF NOT check_column_exists('users', 'compensation_type') THEN
    ALTER TABLE users ADD COLUMN compensation_type TEXT;
    RAISE NOTICE 'Added compensation_type column to users table';
  ELSE
    RAISE NOTICE 'compensation_type column already exists in users table';
  END IF;
END $$;

-- Add credits column if it doesn't exist
DO $$
BEGIN
  IF NOT check_column_exists('users', 'credits') THEN
    ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 3;
    RAISE NOTICE 'Added credits column to users table with default value of 3';
  ELSE
    RAISE NOTICE 'credits column already exists in users table';
  END IF;
END $$;

SELECT 'Database schema updated successfully' as result;
