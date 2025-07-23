-- Simple read-only check of current storage state
-- This script only reads data, doesn't modify anything

SELECT 'Current Storage Buckets:' as info;
SELECT id, name, public, file_size_limit, 
       CASE 
         WHEN allowed_mime_types IS NULL THEN 'No restrictions'
         ELSE array_length(allowed_mime_types, 1)::text || ' mime types'
       END as mime_types,
       created_at, updated_at
FROM storage.buckets
ORDER BY created_at;

SELECT 'Looking for audio-submissions bucket:' as info;
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'audio-submissions') 
    THEN 'FOUND: audio-submissions bucket exists'
    ELSE 'NOT FOUND: audio-submissions bucket missing'
  END as bucket_status;

SELECT 'Storage policies summary:' as info;
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage'
GROUP BY schemaname, tablename
ORDER BY tablename;

SELECT 'Recent storage objects (last 10):' as info;
SELECT 
  bucket_id,
  name,
  created_at,
  ROUND(metadata->>'size'::text::numeric / 1024.0, 2) as size_kb
FROM storage.objects 
ORDER BY created_at DESC 
LIMIT 10;
