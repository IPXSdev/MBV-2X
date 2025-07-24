-- This script resets and ensures the correct Master Developer accounts exist,
-- aligning with the platform bible. It removes old/incorrect accounts and
-- creates the two immutable master dev users.

-- Step 1: Remove any old or incorrect master dev accounts to prevent conflicts.
DELETE FROM users WHERE email IN ('harris@tmbm.dev', 'ipxs@tmbm.dev', 'harris@tmbm.com');

-- Step 2: Create or update the primary master dev account (Harris)
INSERT INTO users (email, name, role, tier, submission_credits, is_verified, legal_waiver_accepted)
VALUES (
  '2668harris@gmail.com',
  'Harris (Master Dev)',
  'master_dev',
  'pro',
  999999,
  true,
  true
)
ON CONFLICT (email)
DO UPDATE SET
  name = 'Harris (Master Dev)',
  role = 'master_dev',
  tier = 'pro',
  submission_credits = 999999,
  is_verified = true,
  updated_at = NOW();

-- Step 3: Create or update the secondary master dev account (IPXS)
-- The bible specifies 'ipxsdev@gmail.com'
INSERT INTO users (email, name, role, tier, submission_credits, is_verified, legal_waiver_accepted)
VALUES (
  'ipxsdev@gmail.com',
  'IPXS (Master Dev)',
  'master_dev',
  'pro',
  999999,
  true,
  true
)
ON CONFLICT (email)
DO UPDATE SET
  name = 'IPXS (Master Dev)',
  role = 'master_dev',
  tier = 'pro',
  submission_credits = 999999,
  is_verified = true,
  updated_at = NOW();

-- Step 4: Verify that the correct accounts are in place
SELECT email, name, role, tier FROM users WHERE role = 'master_dev';
