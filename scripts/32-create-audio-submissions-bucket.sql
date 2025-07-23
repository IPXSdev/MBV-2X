-- Create storage bucket for audio submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-submissions',
  'audio-submissions',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/flac', 'audio/aac', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload their own audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-submissions' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'master_dev')
  )
);

CREATE POLICY "Public read access for audio submissions" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-submissions');
