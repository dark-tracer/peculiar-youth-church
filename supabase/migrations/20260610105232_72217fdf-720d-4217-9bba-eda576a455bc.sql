DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins update media" ON storage.objects;

CREATE POLICY "Admins or editors upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  (bucket_id = ANY (ARRAY['sermon-audio','sermon-pdfs','study-pdfs']) AND is_super_admin(auth.uid()))
  OR (bucket_id = ANY (ARRAY['sermon-thumbnails','team-photos','post-covers','artwork-images','media-library'])
      AND (is_super_admin(auth.uid()) OR is_active_editor(auth.uid())))
);

CREATE POLICY "Admins or editors update media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  (bucket_id = ANY (ARRAY['sermon-audio','sermon-pdfs','study-pdfs']) AND is_super_admin(auth.uid()))
  OR (bucket_id = ANY (ARRAY['sermon-thumbnails','team-photos','post-covers','artwork-images','media-library'])
      AND (is_super_admin(auth.uid()) OR is_active_editor(auth.uid())))
);
