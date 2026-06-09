-- Site settings (single row keyed by id = 1)
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_title TEXT NOT NULL DEFAULT 'Peculiar Youth & Children Ministry',
  tagline TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  giving_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE, INSERT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins update site settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert site settings" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Extend storage policies for media-library bucket
DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public read media buckets" ON storage.objects;
DROP POLICY IF EXISTS "Super admins delete media" ON storage.objects;

CREATE POLICY "Admins upload media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs','media-library']) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs','media-library']) AND public.is_admin(auth.uid()));

CREATE POLICY "Public read media buckets" ON storage.objects FOR SELECT
USING (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs','media-library']));

CREATE POLICY "Super admins delete media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = ANY (ARRAY['sermon-thumbnails','sermon-audio','sermon-pdfs','team-photos','post-covers','artwork-images','study-pdfs','media-library']) AND public.has_role(auth.uid(), 'super_admin'::app_role));