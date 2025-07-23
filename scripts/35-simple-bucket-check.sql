-- Simple bucket verification script
-- This just checks what exists, doesn't try to modify storage tables directly

-- Check current buckets
SELECT 'Current Storage Buckets:' as info;
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
ORDER BY created_at;

-- Check if audio-submissions bucket exists
SELECT 'Audio Submissions Bucket Status:' as info;
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'audio-submissions') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- Show storage policies (read-only check)
SELECT 'Current Storage Policies:' as info;
SELECT nspname as schemaname, relname as tablename, polname as policyname, polcmd as cmd
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE nspname = 'storage'
ORDER BY relname, polname;

-- Check what we can see about storage permissions
SELECT 'Storage Schema Info:' as info;
SELECT 
    t.table_name,
    t.table_type
FROM information_schema.tables t
WHERE t.table_schema = 'storage'
ORDER BY t.table_name;
