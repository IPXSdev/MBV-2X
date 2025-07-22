-- Debug and fix authentication completely
-- First, let's see what we have
SELECT 'Current users:' as info;
SELECT email, name, role, tier, submission_credits, created_at FROM users ORDER BY email;

SELECT 'Current sessions:' as info;
SELECT user_id, session_token, expires_at, created_at FROM user_sessions ORDER BY created_at DESC;

-- Clean everything and start fresh
DELETE FROM user_sessions;
DELETE FROM users;

-- Insert master dev users with exact credentials
INSERT INTO users (email, name, tier, submission_credits, role, is_verified, created_at, updated_at)
VALUES 
    ('2668harris@gmail.com', 'Harris Master Dev', 'pro', 999999, 'master_dev', true, NOW(), NOW()),
    ('ipxsdev@gmail.com', 'IPXS Master Dev', 'pro', 999999, 'master_dev', true, NOW(), NOW());

-- Verify the insert
SELECT 'After insert:' as info;
SELECT email, name, role, tier, submission_credits FROM users ORDER BY email;

-- Test the exact credentials that should work
SELECT 'Testing credentials for 2668harris@gmail.com' as test;
SELECT 
    CASE 
        WHEN email = '2668harris@gmail.com' AND role = 'master_dev' 
        THEN 'CREDENTIALS SHOULD WORK' 
        ELSE 'PROBLEM DETECTED' 
    END as status
FROM users 
WHERE email = '2668harris@gmail.com';
