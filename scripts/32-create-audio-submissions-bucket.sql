-- Create audio submissions bucket with comprehensive setup
-- This script ensures the bucket exists and is properly configured

DO $$
DECLARE
    bucket_exists BOOLEAN := FALSE;
    policy_count INTEGER := 0;
BEGIN
    -- Check if bucket already exists
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'audio-submissions') INTO bucket_exists;
    
    IF bucket_exists THEN
        RAISE NOTICE 'Bucket audio-submissions already exists, recreating...';
        DELETE FROM storage.buckets WHERE id = 'audio-submissions';
    END IF;
    
    -- Create the bucket
    INSERT INTO storage.buckets (
        id, 
        name, 
        public, 
        file_size_limit, 
        allowed_mime_types,
        created_at,
        updated_at
    ) VALUES (
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
            'audio/x-m4a',
            'audio/ogg',
            'audio/webm'
        ],
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Audio submissions bucket created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create bucket: %', SQLERRM;
END $$;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to audio-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin management of audio-submissions" ON storage.objects;

-- Create RLS policies for the audio-submissions bucket

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to audio-submissions" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'audio-submissions');

-- Policy 2: Allow public read access (for playback)
CREATE POLICY "Allow public read access to audio-submissions" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'audio-submissions');

-- Policy 3: Allow authenticated users to read files
CREATE POLICY "Allow authenticated read access to audio-submissions" 
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'audio-submissions');

-- Policy 4: Allow admins to manage all files
CREATE POLICY "Allow admin management of audio-submissions" 
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'audio-submissions' AND
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role IN ('admin', 'master_dev')
    )
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Final verification
DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
    bucket_info RECORD;
BEGIN
    -- Check bucket exists
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id = 'audio-submissions';
    
    -- Check policies exist
    SELECT COUNT(*) INTO policy_count FROM pg_policies 
    WHERE tablename = 'objects' AND policyname LIKE '%audio-submissions%';
    
    -- Get bucket info
    SELECT * INTO bucket_info FROM storage.buckets WHERE id = 'audio-submissions';
    
    RAISE NOTICE '=== BUCKET SETUP VERIFICATION ===';
    RAISE NOTICE 'Bucket exists: %', (bucket_count = 1);
    RAISE NOTICE 'Bucket ID: %', bucket_info.id;
    RAISE NOTICE 'Bucket name: %', bucket_info.name;
    RAISE NOTICE 'Bucket public: %', bucket_info.public;
    RAISE NOTICE 'File size limit: % bytes (% MB)', bucket_info.file_size_limit, (bucket_info.file_size_limit / 1024 / 1024);
    RAISE NOTICE 'Allowed MIME types: %', bucket_info.allowed_mime_types;
    RAISE NOTICE 'Policies created: %', policy_count;
    
    IF bucket_count = 1 AND policy_count >= 4 THEN
        RAISE NOTICE 'SUCCESS: Audio submissions bucket is properly configured!';
    ELSE
        RAISE NOTICE 'WARNING: Configuration may be incomplete';
        RAISE NOTICE 'Expected: 1 bucket, 4+ policies';
        RAISE NOTICE 'Found: % bucket(s), % policies', bucket_count, policy_count;
    END IF;
END $$;

-- List all policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%audio-submissions%'
ORDER BY policyname;
