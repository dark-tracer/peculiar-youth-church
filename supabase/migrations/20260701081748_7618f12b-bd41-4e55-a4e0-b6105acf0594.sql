DROP POLICY IF EXISTS "Admins and editors update events" ON public.events;
CREATE POLICY "Admins and editors update events" ON public.events
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (public.is_active_editor(auth.uid()) AND created_by = auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.is_active_editor(auth.uid()) AND created_by = auth.uid())
  );