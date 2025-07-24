-- Fix audio-submissions bucket configuration
-- This script updates the bucket to be more permissive and fixes any issues

DO $$
DECLARE
    bucket_exists boolean := false;
    policy_count integer := 0;
BEGIN
    -- Check if bucket already exists
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'audio-submissions'
    ) INTO bucket_exists;

    IF bucket_exists THEN
        RAISE NOTICE 'Bucket "audio-submissions" already exists, updating configuration...';
        
        -- Update bucket configuration to be more permissive
        UPDATE storage.buckets 
        SET 
            public = false,
            file_size_limit = 52428800, -- 50MB
            allowed_mime_types = ARRAY[
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/wave',
                'audio/x-wav',
                'audio/vnd.wav',
                'audio/flac',
                'audio/x-flac',
                'audio/aac',
                'audio/mp4',
                'audio/m4a',
                'audio/x-m4a',
                'audio/ogg',
                'audio/webm',
                'audio/x-ms-wma'
            ]
        WHERE id = 'audio-submissions';
        
        RAISE NOTICE 'Updated bucket configuration';
    ELSE
        -- Create the bucket with comprehensive audio support
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'audio-submissions',
            'audio-submissions',
            false,
            52428800, -- 50MB in bytes
            ARRAY[
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/wave',
                'audio/x-wav',
                'audio/vnd.wav',
                'audio/flac',
                'audio/x-flac',
                'audio/aac',
                'audio/mp4',
                'audio/m4a',
                'audio/x-m4a',
                'audio/ogg',
                'audio/webm',
                'audio/x-ms-wma'
            ]
        );
        
        RAISE NOTICE 'Created bucket "audio-submissions" with comprehensive audio support';
    END IF;

    -- Drop existing policies to avoid conflicts
    DELETE FROM storage.policies WHERE bucket_id = 'audio-submissions';

    -- Create comprehensive RLS policies for the bucket
    
    -- Policy 1: Allow authenticated users to upload their own files
    CREATE POLICY "Users can upload audio files" ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'audio-submissions' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
    
    policy_count := policy_count + 1;

    -- Policy 2: Allow users to read their own files
    CREATE POLICY "Users can read their own audio files" ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-submissions' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
    
    policy_count := policy_count + 1;

    -- Policy 3: Allow admins to read all files
    CREATE POLICY "Admins can read all audio files" ON storage.objects FOR SELECT
    USING (
        bucket_id = 'audio-submissions' 
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'master_dev')
        )
    );
    
    policy_count := policy_count + 1;

    -- Policy 4: Allow service role full access (for admin operations)
    CREATE POLICY "Service role can manage all files" ON storage.objects FOR ALL
    USING (bucket_id = 'audio-submissions' AND auth.role() = 'service_role');
    
    policy_count := policy_count + 1;

    -- Ensure RLS is enabled on storage.objects
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Created % RLS policies for audio-submissions bucket', policy_count;

    -- Verify the setup
    DECLARE
        final_bucket_count integer;
        final_policy_count integer;
        bucket_config record;
    BEGIN
        SELECT COUNT(*) INTO final_bucket_count 
        FROM storage.buckets 
        WHERE id = 'audio-submissions';

        SELECT COUNT(*) INTO final_policy_count 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%audio-submissions%';

        SELECT * INTO bucket_config
        FROM storage.buckets 
        WHERE id = 'audio-submissions';

        RAISE NOTICE 'Setup verification:';
        RAISE NOTICE '- Buckets with id "audio-submissions": %', final_bucket_count;
        RAISE NOTICE '- Policies for audio-submissions: %', final_policy_count;
        RAISE NOTICE '- Bucket public: %', bucket_config.public;
        RAISE NOTICE '- File size limit: % MB', bucket_config.file_size_limit / 1048576;
        RAISE NOTICE '- Allowed MIME types: %', array_length(bucket_config.allowed_mime_types, 1);
        
        IF final_bucket_count = 1 AND final_policy_count >= 4 THEN
            RAISE NOTICE '✅ Audio submissions bucket setup completed successfully!';
        ELSE
            RAISE WARNING '⚠️  Setup may be incomplete. Expected 1 bucket and 4+ policies.';
        END IF;
    END;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to configure audio-submissions bucket: %', SQLERRM;
END $$;
