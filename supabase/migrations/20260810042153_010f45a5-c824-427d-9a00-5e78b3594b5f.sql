DROP POLICY IF EXISTS "Public read image buckets" ON storage.objects;

CREATE POLICY "Staff read image buckets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = ANY (ARRAY['sermon-thumbnails','team-photos','post-covers','artwork-images','media-library'])
  AND (public.is_admin(auth.uid()) OR public.is_active_editor(auth.uid()))
);