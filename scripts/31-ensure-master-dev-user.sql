-- Ensure master dev users exist in the database
-- This script creates or updates the master dev users with proper credentials

-- First, let's check if the users exist and create/update them
DO $$
BEGIN
    -- Create or update harris@tmbm.dev user
    INSERT INTO users (
        id,
        email,
        name,
        role,
        tier,
        submission_credits,
        is_verified,
        legal_waiver_accepted,
        legal_waiver_date,
        compensation_type,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'harris@tmbm.dev',
        'Harris (Master Dev)',
        'master_dev',
        'pro',
        999999,
        true,
        true,
        NOW(),
        'no_compensation',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET
        name = 'Harris (Master Dev)',
        role = 'master_dev',
        tier = 'pro',
        submission_credits = 999999,
        is_verified = true,
        updated_at = NOW();

    -- Create or update 2668harris@gmail.com user
    INSERT INTO users (
        id,
        email,
        name,
        role,
        tier,
        submission_credits,
        is_verified,
        legal_waiver_accepted,
        legal_waiver_date,
        compensation_type,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        '2668harris@gmail.com',
        'Harris Gmail (Master Dev)',
        'master_dev',
        'pro',
        999999,
        true,
        true,
        NOW(),
        'no_compensation',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET
        name = 'Harris Gmail (Master Dev)',
        role = 'master_dev',
        tier = 'pro',
        submission_credits = 999999,
        is_verified = true,
        updated_at = NOW();

    -- Create or update ipxs@tmbm.dev user
    INSERT INTO users (
        id,
        email,
        name,
        role,
        tier,
        submission_credits,
        is_verified,
        legal_waiver_accepted,
        legal_waiver_date,
        compensation_type,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'ipxs@tmbm.dev',
        'IPXS (Master Dev)',
        'master_dev',
        'pro',
        999999,
        true,
        true,
        NOW(),
        'no_compensation',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET
        name = 'IPXS (Master Dev)',
        role = 'master_dev',
        tier = 'pro',
        submission_credits = 999999,
        is_verified = true,
        updated_at = NOW();

    RAISE NOTICE 'Master dev users created/updated successfully';
END $$;

-- Verify the users were created
SELECT 
    email,
    name,
    role,
    tier,
    submission_credits,
    is_verified,
    created_at
FROM users 
WHERE email IN ('harris@tmbm.dev', '2668harris@gmail.com', 'ipxs@tmbm.dev')
ORDER BY email;
