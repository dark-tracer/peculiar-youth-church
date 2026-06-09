
-- Public read for all 4 buckets (files are intended to display on public pages)
CREATE POLICY "Public read media buckets" ON storage.objects FOR SELECT
  USING (bucket_id IN ('sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos'));

CREATE POLICY "Admins upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos')
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos')
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Super admins delete media" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos')
    AND public.has_role(auth.uid(), 'super_admin')
  );
