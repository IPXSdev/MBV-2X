-- Create audio submissions bucket with proper configuration
-- This script ensures the bucket exists and is properly configured

-- First, check if bucket exists and delete if it does (for clean setup)
DO $$
BEGIN
    -- Delete bucket if it exists
    DELETE FROM storage.buckets WHERE id = 'audio-submissions';
    
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'audio-submissions',
        'audio-submissions',
        true,
        52428800, -- 50MB limit
        ARRAY[
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/flac',
            'audio/x-flac',
            'audio/aac',
            'audio/mp4',
            'audio/m4a',
            'audio/ogg',
            'audio/webm'
        ]
    );
    
    RAISE NOTICE 'Audio submissions bucket created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating bucket: %', SQLERRM;
END $$;

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload files
INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
VALUES (
    'audio-submissions',
    'Allow authenticated users to upload',
    'auth.role() = ''authenticated''',
    'auth.role() = ''authenticated''',
    'INSERT'
) ON CONFLICT (bucket_id, name) DO UPDATE SET
    definition = EXCLUDED.definition,
    check_definition = EXCLUDED.check_definition;

-- Allow public read access to files
INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
VALUES (
    'audio-submissions',
    'Allow public read access',
    'true',
    'true',
    'SELECT'
) ON CONFLICT (bucket_id, name) DO UPDATE SET
    definition = EXCLUDED.definition,
    check_definition = EXCLUDED.check_definition;

-- Allow users to update their own files
INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
VALUES (
    'audio-submissions',
    'Allow users to update own files',
    'auth.role() = ''authenticated''',
    'auth.role() = ''authenticated''',
    'UPDATE'
) ON CONFLICT (bucket_id, name) DO UPDATE SET
    definition = EXCLUDED.definition,
    check_definition = EXCLUDED.check_definition;

-- Allow users to delete their own files
INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
VALUES (
    'audio-submissions',
    'Allow users to delete own files',
    'auth.role() = ''authenticated''',
    'auth.role() = ''authenticated''',
    'DELETE'
) ON CONFLICT (bucket_id, name) DO UPDATE SET
    definition = EXCLUDED.definition,
    check_definition = EXCLUDED.check_definition;

-- Verify the bucket was created
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'audio-submissions';

-- Verify policies were created
SELECT 
    bucket_id,
    name,
    definition,
    command
FROM storage.policies 
WHERE bucket_id = 'audio-submissions'
ORDER BY name;

-- Final verification message
DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id = 'audio-submissions';
    SELECT COUNT(*) INTO policy_count FROM storage.policies WHERE bucket_id = 'audio-submissions';
    
    IF bucket_count = 1 AND policy_count >= 4 THEN
        RAISE NOTICE 'SUCCESS: Audio submissions bucket and policies configured correctly';
        RAISE NOTICE 'Bucket count: %, Policy count: %', bucket_count, policy_count;
    ELSE
        RAISE NOTICE 'WARNING: Configuration may be incomplete';
        RAISE NOTICE 'Bucket count: %, Policy count: %', bucket_count, policy_count;
    END IF;
END $$;
