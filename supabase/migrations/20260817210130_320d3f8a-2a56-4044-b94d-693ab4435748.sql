-- 1) Gated storage: staff always, others only for published content
DROP POLICY IF EXISTS "Authenticated read gated documents" ON storage.objects;

CREATE POLICY "Read gated documents when published or staff"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = ANY (ARRAY['sermon-audio','sermon-pdfs','study-pdfs'])
    AND (
      public.is_admin(auth.uid())
      OR public.is_active_editor(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.sermons s
        WHERE s.status = 'published'
          AND (s.audio_url LIKE '%' || storage.objects.name
               OR s.notes_pdf_url LIKE '%' || storage.objects.name)
      )
      OR EXISTS (
        SELECT 1 FROM public.bible_studies b
        WHERE b.status = 'published'
          AND b.pdf_url LIKE '%' || storage.objects.name
      )
    )
  );

-- 2) Password reset requests
CREATE TABLE public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  handled_by uuid REFERENCES auth.users(id),
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read reset requests"
  ON public.password_reset_requests FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update reset requests"
  ON public.password_reset_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete reset requests"
  ON public.password_reset_requests FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER password_reset_requests_touch
  BEFORE UPDATE ON public.password_reset_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public (unauthenticated) submission goes through this definer function only,
-- and only records emails that belong to an approved console account.
CREATE OR REPLACE FUNCTION public.request_password_reset(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE p record;
BEGIN
  IF _email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' OR length(_email) > 255 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  SELECT pr.id INTO p FROM public.profiles pr
  WHERE lower(pr.email) = lower(btrim(_email)) AND pr.status = 'active'
  LIMIT 1;

  IF p IS NULL THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM public.password_reset_requests r
    WHERE lower(r.email) = lower(btrim(_email))
      AND r.status = 'pending'
  ) THEN RETURN; END IF;

  INSERT INTO public.password_reset_requests (email)
  VALUES (lower(btrim(_email)));
END; $$;

REVOKE ALL ON FUNCTION public.request_password_reset(text) FROM public;
GRANT EXECUTE ON FUNCTION public.request_password_reset(text) TO anon, authenticated;