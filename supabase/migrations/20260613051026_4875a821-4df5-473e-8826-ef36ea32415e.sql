-- 1) Add 'admin' value to the app_role enum (idempotent).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- 2) Redefine is_admin to grant access to BOTH super_admin AND active 'admin' role users.
--    Uses role::text = 'admin' to avoid referencing the new enum literal in this same
--    transaction (Postgres restriction).
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.user_id = _user_id
        AND ur.role::text = 'admin'
        AND p.status = 'active'
    )
$function$;

-- 3) Add policies on blog_posts and articles so Admins (not just super_admin) can manage them.
DROP POLICY IF EXISTS "Admins manage blog_posts" ON public.blog_posts;
CREATE POLICY "Admins manage blog_posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage articles" ON public.articles;
CREATE POLICY "Admins manage articles" ON public.articles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4) Allow public (anonymous) reads of team_members and events so the about and home pages
--    can render for visitors without a session. RLS already restricts mutations to admins.
GRANT SELECT ON public.team_members TO anon;
GRANT SELECT ON public.events TO anon;