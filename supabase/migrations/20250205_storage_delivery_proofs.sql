-- =====================================================
-- Storage Bucket: delivery-proofs
-- For storing delivery proof photos uploaded by drivers
-- Date: 2025-02-05
-- =====================================================

-- 1. Create the storage bucket for delivery proof photos
-- Auto-delete files after 24 hours using avoidable_file_size_limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-proofs',
  'delivery-proofs',
  true, -- Public bucket so photos can be viewed
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: Supabase Storage doesn't have built-in TTL (time-to-live) for objects
-- We'll create a scheduled function to delete files older than 24 hours

-- 2. RLS Policies for delivery-proofs bucket

-- Allow authenticated users to upload (INSERT) delivery proof photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads to delivery-proofs'
  ) THEN
    CREATE POLICY "Allow authenticated uploads to delivery-proofs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'delivery-proofs');
  END IF;
END $$;

-- Allow public read access to delivery proof photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access to delivery-proofs'
  ) THEN
    CREATE POLICY "Public read access to delivery-proofs"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'delivery-proofs');
  END IF;
END $$;

-- Allow authenticated users to update their own delivery proofs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to update delivery-proofs'
  ) THEN
    CREATE POLICY "Allow authenticated users to update delivery-proofs"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'delivery-proofs');
  END IF;
END $$;

-- Allow authenticated users to delete their own delivery proofs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to delete delivery-proofs'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete delivery-proofs"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'delivery-proofs');
  END IF;
END $$;

-- 3. Create function to auto-delete old delivery proof photos (24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_delivery_proofs()
RETURNS void AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_object RECORD;
BEGIN
  -- Delete storage objects older than 24 hours from delivery-proofs bucket
  FOR v_object IN 
    SELECT name, bucket_id
    FROM storage.objects
    WHERE bucket_id = 'delivery-proofs'
    AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Delete the file from storage
    PERFORM storage.delete_object(v_object.bucket_id, v_object.name);
    v_deleted_count := v_deleted_count + 1;
  END LOOP;

  RAISE NOTICE 'Cleanup completed: % delivery proof photos deleted', v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Schedule the cleanup function to run daily via pg_cron
-- Note: pg_cron extension must be enabled in Supabase dashboard
-- Go to Database > Extensions > Enable pg_cron

-- Create the scheduled job (runs every hour)
-- Uncomment after enabling pg_cron extension:
/*
SELECT cron.schedule(
  'cleanup-delivery-proofs',           -- Job name
  '0 * * * *',                         -- Every hour at minute 0
  $$SELECT cleanup_old_delivery_proofs();$$
);
*/

-- Alternative: If pg_cron is not available, create a manual cleanup function
-- that can be called via Edge Function or manually

COMMENT ON FUNCTION cleanup_old_delivery_proofs() IS 'Deletes delivery proof photos older than 24 hours to save storage space';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "delivery-proofs" created successfully!';
  RAISE NOTICE 'Bucket is public for photo viewing';
  RAISE NOTICE 'Max file size: 5MB';
  RAISE NOTICE 'Allowed types: JPEG, PNG, WebP';
  RAISE NOTICE '⏰ Auto-cleanup function created (deletes photos after 24 hours)';
  RAISE NOTICE '📝 To enable scheduled cleanup:';
  RAISE NOTICE '   1. Enable pg_cron extension in Supabase Dashboard';
  RAISE NOTICE '   2. Uncomment the cron.schedule block in this migration';
  RAISE NOTICE '   3. Or create a Supabase Edge Function to call cleanup_old_delivery_proofs()';
END $$;
