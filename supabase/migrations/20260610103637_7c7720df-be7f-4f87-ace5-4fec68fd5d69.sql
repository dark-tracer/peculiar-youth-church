-- Storage: split public-image read from gated-document read
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;

CREATE POLICY "Public read image buckets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = ANY (ARRAY[
    'sermon-thumbnails','team-photos','post-covers','artwork-images','media-library'
  ]));

CREATE POLICY "Authenticated read gated documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = ANY (ARRAY['sermon-audio','sermon-pdfs','study-pdfs']));

-- user_roles: explicit super-admin-only write/delete
CREATE POLICY "Super admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));