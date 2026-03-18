-- Tighten storage RLS: scope uploads/updates/deletes to user's own client folder
-- Super admins can access any folder

-- Drop the overly permissive policies from 20251213220500_fix_storage_rls.sql
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Upload: user can only upload to their client's folder (or super_admin anywhere)
CREATE POLICY "Client-scoped upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'onesign-display' AND (
      -- Super admins can upload anywhere
      EXISTS (SELECT 1 FROM display_profiles WHERE id = auth.uid() AND role = 'super_admin')
      OR
      -- Client admins can only upload to their client's folder
      (storage.foldername(name))[1] = (
        SELECT client_id::text FROM display_profiles WHERE id = auth.uid()
      )
    )
  );

-- Update: same scope as upload
CREATE POLICY "Client-scoped update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'onesign-display' AND (
      EXISTS (SELECT 1 FROM display_profiles WHERE id = auth.uid() AND role = 'super_admin')
      OR
      (storage.foldername(name))[1] = (
        SELECT client_id::text FROM display_profiles WHERE id = auth.uid()
      )
    )
  );

-- Delete: same scope
CREATE POLICY "Client-scoped delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'onesign-display' AND (
      EXISTS (SELECT 1 FROM display_profiles WHERE id = auth.uid() AND role = 'super_admin')
      OR
      (storage.foldername(name))[1] = (
        SELECT client_id::text FROM display_profiles WHERE id = auth.uid()
      )
    )
  );
