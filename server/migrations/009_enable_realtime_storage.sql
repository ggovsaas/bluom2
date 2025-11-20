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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Enable realtime on streaks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_streaks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_streaks;
  END IF;
END $$;

-- Enable realtime on meal logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meal_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meal_logs;
  END IF;
END $$;

-- Enable realtime on workout logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'workout_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workout_logs;
  END IF;
END $$;

-- Enable realtime on meditation sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meditation_sessions_ac'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meditation_sessions_ac;
  END IF;
END $$;

-- Enable realtime on AI recommendations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ai_recommendations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_recommendations;
  END IF;
END $$;

-- Enable realtime on queued notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'queued_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE queued_notifications;
  END IF;
END $$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users upload own avatar'
  ) THEN
    CREATE POLICY "Users upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Users can update their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own avatar'
  ) THEN
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
  END IF;
END $$;

-- Users can read their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users read own avatar'
  ) THEN
    CREATE POLICY "Users read own avatar"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Users can delete their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own avatar'
  ) THEN
    CREATE POLICY "Users delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- =============================================
-- STORAGE RLS POLICIES - RECIPE IMAGES
-- =============================================

-- Users can upload recipe images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users upload recipe images'
  ) THEN
    CREATE POLICY "Users upload recipe images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'recipe-images');
  END IF;
END $$;

-- Users can update their own recipe images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own recipe images'
  ) THEN
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
  END IF;
END $$;

-- Everyone can read recipe images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone read recipe images'
  ) THEN
    CREATE POLICY "Anyone read recipe images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'recipe-images');
  END IF;
END $$;

-- Users can delete their own recipe images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own recipe images'
  ) THEN
    CREATE POLICY "Users delete own recipe images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'recipe-images'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- =============================================
-- STORAGE RLS POLICIES - WORKOUT VIDEOS
-- =============================================

-- Users can upload workout videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users upload workout videos'
  ) THEN
    CREATE POLICY "Users upload workout videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'workout-videos');
  END IF;
END $$;

-- Users can update their own workout videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own workout videos'
  ) THEN
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
  END IF;
END $$;

-- Everyone can read workout videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone read workout videos'
  ) THEN
    CREATE POLICY "Anyone read workout videos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'workout-videos');
  END IF;
END $$;

-- Users can delete their own workout videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own workout videos'
  ) THEN
    CREATE POLICY "Users delete own workout videos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'workout-videos'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

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
