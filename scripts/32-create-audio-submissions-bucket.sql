-- Create the audio-submissions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-submissions',
  'audio-submissions',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/x-wav', 'audio/x-flac', 'audio/aac', 'audio/ogg']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload their own audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-submissions'
);

CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-submissions'
);

CREATE POLICY "Admins can view all audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-submissions' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role IN ('admin', 'master_dev')
  )
);

CREATE POLICY "Public read access for audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-submissions');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
