CREATE POLICY "knowledge docs admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'knowledge-docs' AND public.is_admin(auth.uid()));
CREATE POLICY "knowledge docs admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'knowledge-docs' AND public.is_admin(auth.uid()));
CREATE POLICY "knowledge docs admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'knowledge-docs' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'knowledge-docs' AND public.is_admin(auth.uid()));
CREATE POLICY "knowledge docs admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'knowledge-docs' AND public.is_admin(auth.uid()));