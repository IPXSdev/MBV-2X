-- Fix existing Creator (free) tier users to have 0 submissions
-- This addresses the issue where users still show 2 submissions instead of 0

-- Update all free tier users to have 0 submissions (except master devs)
UPDATE users 
SET submission_credits = 0 
WHERE tier = 'free' 
  AND role = 'user' 
  AND submission_credits != 0;

-- Verify the update worked
SELECT 
  email, 
  name, 
  tier, 
  submission_credits, 
  role 
FROM users 
WHERE tier = 'free' 
ORDER BY created_at DESC;

-- Also ensure any new signups get 0 credits by default
-- (This is already fixed in the auth.ts code, but let's make sure the database default is correct)
ALTER TABLE users 
ALTER COLUMN submission_credits SET DEFAULT 0;

-- Update the database comment to reflect the correct tier system
COMMENT ON COLUMN users.tier IS 'User subscription tier: free (Creator - 0 submissions), creator (Indie - paid tier), pro (Pro - premium tier)';
COMMENT ON COLUMN users.submission_credits IS 'Number of available music submissions. Creator (free) = 0, Indie = monthly allocation, Pro = monthly allocation';
