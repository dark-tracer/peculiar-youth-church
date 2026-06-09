
-- 1. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_chk CHECK (status IN ('active','disabled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Hardcoded super admin email
CREATE OR REPLACE FUNCTION public.super_admin_email() RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT 'bernieamponsah12@gmail.com'::text $$;

-- 3. is_super_admin: role + matching email + active status
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = 'super_admin'::app_role
      AND lower(p.email) = lower(public.super_admin_email())
      AND p.status = 'active'
  )
$$;

-- 4. is_active_editor
CREATE OR REPLACE FUNCTION public.is_active_editor(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = 'editor'::app_role
      AND p.status = 'active'
  )
$$;

-- 5. Redefine is_admin to mean "active super admin only"
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(_user_id)
$$;

-- 6. Update signup trigger: only the hardcoded email becomes super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned app_role;
BEGIN
  IF lower(NEW.email) = lower(public.super_admin_email()) THEN
    assigned := 'super_admin'::app_role;
  ELSE
    assigned := 'editor'::app_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 7. Reconcile existing rows
UPDATE public.user_roles ur
SET role = 'editor'::app_role
WHERE ur.role = 'super_admin'::app_role
  AND ur.user_id NOT IN (
    SELECT id FROM public.profiles WHERE lower(email) = lower(public.super_admin_email())
  );

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'super_admin'::app_role
FROM public.profiles p
WHERE lower(p.email) = lower(public.super_admin_email())
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Granular policies on editor-managed tables
-- blog_posts
DROP POLICY IF EXISTS "Admins manage posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins read all posts" ON public.blog_posts;
CREATE POLICY "Super admin all blog_posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Editors read own blog_posts" ON public.blog_posts FOR SELECT TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Editors insert own draft blog_posts" ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);
CREATE POLICY "Editors update own draft blog_posts" ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status)
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);

-- articles
DROP POLICY IF EXISTS "Admins manage articles" ON public.articles;
DROP POLICY IF EXISTS "Admins read all articles" ON public.articles;
CREATE POLICY "Super admin all articles" ON public.articles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Editors read own articles" ON public.articles FOR SELECT TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Editors insert own draft articles" ON public.articles FOR INSERT TO authenticated
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);
CREATE POLICY "Editors update own draft articles" ON public.articles FOR UPDATE TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status)
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);

-- artworks
DROP POLICY IF EXISTS "Admins manage artworks" ON public.artworks;
DROP POLICY IF EXISTS "Admins read all artworks" ON public.artworks;
CREATE POLICY "Super admin all artworks" ON public.artworks FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Editors read own artworks" ON public.artworks FOR SELECT TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Editors insert own draft artworks" ON public.artworks FOR INSERT TO authenticated
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);
CREATE POLICY "Editors update own draft artworks" ON public.artworks FOR UPDATE TO authenticated
  USING (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status)
  WITH CHECK (public.is_active_editor(auth.uid()) AND created_by = auth.uid() AND status = 'draft'::content_status);

-- 9. Allow super admin to read all profiles (already present) and update editor status
DROP POLICY IF EXISTS "Super admin manage profiles" ON public.profiles;
CREATE POLICY "Super admin manage profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
