
-- Widen artwork RLS: admins (super_admin + admin role) can fully manage artworks; editors can insert/update own drafts.
DROP POLICY IF EXISTS "Editors insert own draft artworks" ON public.artworks;
DROP POLICY IF EXISTS "Editors update own draft artworks" ON public.artworks;
DROP POLICY IF EXISTS "Editors read own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Super admin all artworks" ON public.artworks;
DROP POLICY IF EXISTS "Admins read all artworks" ON public.artworks;
DROP POLICY IF EXISTS "Admins manage artworks" ON public.artworks;

CREATE POLICY "Admins manage artworks" ON public.artworks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Editors read own artworks" ON public.artworks FOR SELECT TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Editors insert own draft artworks" ON public.artworks FOR INSERT TO authenticated
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);

CREATE POLICY "Editors update own draft artworks" ON public.artworks FOR UPDATE TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status)
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);
