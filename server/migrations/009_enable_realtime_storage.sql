/*
  # Enable Realtime & Storage via SQL

  ## Description
  Enables realtime subscriptions and creates storage buckets with RLS policies.

  ## Features
  1. **Realtime** - Live updates for key tables
  2. **Storage Buckets** - File upload support (avatars, recipes)
  3. **Storage RLS** - Secure file access policies
*/

-- =============================================
-- ENABLE REALTIME FOR KEY TABLES
-- =============================================

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;

-- Enable realtime on streaks
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_streaks;

-- Enable realtime on meal logs
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS meal_logs;

-- Enable realtime on workout logs
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS workout_logs;

-- Enable realtime on meditation sessions
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS meditation_sessions_ac;

-- Enable realtime on AI recommendations
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS ai_recommendations;

-- Enable realtime on queued notifications
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS queued_notifications;

-- =============================================
-- CREATE STORAGE BUCKETS
-- =============================================

-- Insert avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Insert recipe-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Insert workout-videos bucket (optional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-videos',
  'workout-videos',
  false,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE RLS POLICIES - AVATARS
-- =============================================

-- Users can upload their own avatar
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own avatar
CREATE POLICY "Users read own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- STORAGE RLS POLICIES - RECIPE IMAGES
-- =============================================

-- Users can upload recipe images
CREATE POLICY "Users upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Users can update their own recipe images
CREATE POLICY "Users update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Everyone can read recipe images
CREATE POLICY "Anyone read recipe images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recipe-images');

-- Users can delete their own recipe images
CREATE POLICY "Users delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- STORAGE RLS POLICIES - WORKOUT VIDEOS
-- =============================================

-- Users can upload workout videos
CREATE POLICY "Users upload workout videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workout-videos');

-- Users can update their own workout videos
CREATE POLICY "Users update own workout videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workout-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'workout-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Everyone can read workout videos
CREATE POLICY "Anyone read workout videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'workout-videos');

-- Users can delete their own workout videos
CREATE POLICY "Users delete own workout videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- VERIFY SETUP
-- =============================================

-- Query to verify realtime is enabled
-- SELECT schemaname, tablename
-- FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
-- ORDER BY tablename;

-- Query to verify buckets exist
-- SELECT id, name, public, file_size_limit
-- FROM storage.buckets
-- ORDER BY name;
