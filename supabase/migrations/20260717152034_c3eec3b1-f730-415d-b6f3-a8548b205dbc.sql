
-- 1) First-login password change flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- 2) Storage policies: grant admin the same access as super_admin
DROP POLICY IF EXISTS "Admins or editors upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins or editors update media" ON storage.objects;
DROP POLICY IF EXISTS "Super admins delete media" ON storage.objects;

CREATE POLICY "Admins or editors upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  (
    bucket_id = ANY (ARRAY['sermon-audio','sermon-pdfs','study-pdfs'])
    AND public.is_admin(auth.uid())
  )
  OR (
    bucket_id = ANY (ARRAY['sermon-thumbnails','team-photos','post-covers','artwork-images','media-library'])
    AND (public.is_admin(auth.uid()) OR public.is_active_editor(auth.uid()))
  )
);

CREATE POLICY "Admins or editors update media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  (
    bucket_id = ANY (ARRAY['sermon-audio','sermon-pdfs','study-pdfs'])
    AND public.is_admin(auth.uid())
  )
  OR (
    bucket_id = ANY (ARRAY['sermon-thumbnails','team-photos','post-covers','artwork-images','media-library'])
    AND (public.is_admin(auth.uid()) OR public.is_active_editor(auth.uid()))
  )
);

CREATE POLICY "Admins delete media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs','media-library'])
  AND public.is_admin(auth.uid())
);

-- 3) Events: admins get the same rights as super_admins
DROP POLICY IF EXISTS "Admins and editors create events" ON public.events;
DROP POLICY IF EXISTS "Admins and editors update events" ON public.events;
DROP POLICY IF EXISTS "Admins and editors view all events" ON public.events;
DROP POLICY IF EXISTS "Super admins delete events" ON public.events;

CREATE POLICY "Admins and editors view all events"
ON public.events FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_active_editor(auth.uid()));

CREATE POLICY "Admins and editors create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) OR public.is_active_editor(auth.uid()));

CREATE POLICY "Admins and editors update events"
ON public.events FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()) OR (public.is_active_editor(auth.uid()) AND created_by = auth.uid()))
WITH CHECK (public.is_admin(auth.uid()) OR (public.is_active_editor(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Admins delete events"
ON public.events FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- 4) Sermons: allow admin same as super_admin for delete
DROP POLICY IF EXISTS "Super admin delete sermons" ON public.sermons;
CREATE POLICY "Admins delete sermons"
ON public.sermons FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));
