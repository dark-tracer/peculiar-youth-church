CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  location text,
  cover_url text,
  registration_url text,
  contact_info text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published events"
ON public.events FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins and editors view all events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.is_active_editor(auth.uid()));

CREATE POLICY "Admins and editors create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_active_editor(auth.uid()));

CREATE POLICY "Admins and editors update events"
ON public.events FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.is_active_editor(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_active_editor(auth.uid()));

CREATE POLICY "Super admins delete events"
ON public.events FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER touch_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX events_start_at_idx ON public.events (start_at DESC);
CREATE INDEX events_status_idx ON public.events (status);