DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Super admins delete media" ON storage.objects;

CREATE POLICY "Admins upload media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs']) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs']) AND public.is_admin(auth.uid()));

CREATE POLICY "Public read media buckets" ON storage.objects FOR SELECT
USING (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs']));

CREATE POLICY "Super admins delete media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs']) AND public.has_role(auth.uid(), 'super_admin'::app_role));