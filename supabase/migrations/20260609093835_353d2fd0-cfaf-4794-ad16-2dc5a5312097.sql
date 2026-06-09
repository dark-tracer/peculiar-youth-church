
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'editor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Auto-create profile + bootstrap first user as super_admin, others as editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') INTO is_first;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'super_admin'::app_role ELSE 'editor'::app_role END);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SHARED ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'scheduled');

-- ============ TEAM MEMBERS ============
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read team" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins manage team" ON public.team_members FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER team_members_touch BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SERMON SERIES ============
CREATE TABLE public.sermon_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sermon_series TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermon_series TO authenticated;
GRANT ALL ON public.sermon_series TO service_role;
ALTER TABLE public.sermon_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read series" ON public.sermon_series FOR SELECT USING (true);
CREATE POLICY "Admins manage series" ON public.sermon_series FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ SERMONS ============
CREATE TABLE public.sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  preacher_name TEXT NOT NULL,
  preacher_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  date_preached DATE NOT NULL,
  scripture TEXT,
  series_id UUID REFERENCES public.sermon_series(id) ON DELETE SET NULL,
  series_name TEXT,
  description TEXT,
  video_url TEXT,
  audio_url TEXT,
  notes_pdf_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status content_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sermons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermons TO authenticated;
GRANT ALL ON public.sermons TO service_role;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read published sermons" ON public.sermons FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all sermons" ON public.sermons FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Editors insert sermons" ON public.sermons FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Editors update own drafts, super_admin all" ON public.sermons FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (created_by = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (created_by = auth.uid() AND status != 'published'));
CREATE POLICY "Super admin delete sermons" ON public.sermons FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER sermons_touch BEFORE UPDATE ON public.sermons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX sermons_status_idx ON public.sermons(status);
CREATE INDEX sermons_date_idx ON public.sermons(date_preached DESC);

-- ============ SKELETON TABLES (Phase 3+, needed for dashboard stats) ============
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author_name TEXT,
  category TEXT,
  cover_url TEXT,
  excerpt TEXT,
  body TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  publish_date TIMESTAMPTZ,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read published posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER blog_touch BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  column_name TEXT,
  episode_number INT,
  edition_label TEXT,
  reading_minutes INT,
  author_name TEXT,
  cover_url TEXT,
  excerpt TEXT,
  body TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status content_status NOT NULL DEFAULT 'draft',
  publish_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read published articles" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all articles" ON public.articles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER articles_touch BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bible_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  series_name TEXT,
  study_number INT,
  leader_name TEXT,
  scripture TEXT,
  objective TEXT,
  body TEXT,
  discussion_questions TEXT[] DEFAULT ARRAY[]::TEXT[],
  key_takeaway TEXT,
  pdf_url TEXT,
  resource_url TEXT,
  audience TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bible_studies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_studies TO authenticated;
GRANT ALL ON public.bible_studies TO service_role;
ALTER TABLE public.bible_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read published studies" ON public.bible_studies FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all studies" ON public.bible_studies FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage studies" ON public.bible_studies FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER studies_touch BEFORE UPDATE ON public.bible_studies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist_name TEXT DEFAULT 'Peculiar Youth Creative Team',
  description TEXT,
  scripture TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  allow_download BOOLEAN NOT NULL DEFAULT true,
  watermark BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artworks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read published artworks" ON public.artworks FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all artworks" ON public.artworks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage artworks" ON public.artworks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER artworks_touch BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MEDIA LIBRARY ============
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read media" ON public.media FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert media" ON public.media FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Super admin delete media" ON public.media FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
