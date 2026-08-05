-- 1. Remove overly permissive public policies
DROP POLICY IF EXISTS "comments public read" ON public.comments;
DROP POLICY IF EXISTS "comments public flag" ON public.comments;
DROP POLICY IF EXISTS "comments public insert" ON public.comments;

REVOKE ALL ON public.comments FROM anon;
REVOKE ALL ON public.content_views FROM anon;
GRANT SELECT ON public.content_view_counts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
GRANT ALL ON public.content_views TO service_role;
GRANT ALL ON public.content_view_counts TO service_role;

-- 2. Public read of comments WITHOUT the email column
CREATE OR REPLACE FUNCTION public.get_public_comments(_content_type text, _content_id uuid)
RETURNS TABLE (id uuid, commenter_name text, comment_text text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.commenter_name, c.comment_text, c.created_at
  FROM public.comments c
  WHERE c.content_type = _content_type
    AND c.content_id = _content_id
    AND c.is_deleted = false
  ORDER BY c.created_at DESC
$$;

-- 3. Public comment insert (no privileged key needed)
CREATE OR REPLACE FUNCTION public.submit_public_comment(
  _content_type text,
  _content_id uuid,
  _name text,
  _email text,
  _comment text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF _content_type NOT IN ('blog','article') THEN
    RAISE EXCEPTION 'Invalid content type';
  END IF;
  IF length(btrim(_name)) < 2 OR length(_name) > 80 THEN
    RAISE EXCEPTION 'Please enter your full name.';
  END IF;
  IF _email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' OR length(_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;
  IF length(btrim(_comment)) < 2 OR length(_comment) > 500 THEN
    RAISE EXCEPTION 'Comments are limited to 1-500 characters.';
  END IF;

  INSERT INTO public.comments (content_type, content_id, commenter_name, commenter_email, comment_text)
  VALUES (_content_type, _content_id, btrim(_name), lower(btrim(_email)), btrim(_comment))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 4. Public flag-only update
CREATE OR REPLACE FUNCTION public.flag_public_comment(_comment_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.comments SET is_flagged = true
  WHERE id = _comment_id AND is_deleted = false
$$;

-- 5. Unique view recording + count, without service role
CREATE OR REPLACE FUNCTION public.record_content_view(
  _content_type text,
  _content_id uuid,
  _visitor_hash text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE counted boolean := false; total integer;
BEGIN
  IF _content_type NOT IN ('blog','article') THEN
    RAISE EXCEPTION 'Invalid content type';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.content_views
    WHERE content_id = _content_id
      AND visitor_hash = _visitor_hash
      AND viewed_at > now() - interval '24 hours'
  ) THEN
    INSERT INTO public.content_views (content_type, content_id, visitor_hash)
    VALUES (_content_type, _content_id, _visitor_hash);
    counted := true;
  END IF;

  SELECT unique_view_count INTO total
  FROM public.content_view_counts
  WHERE content_id = _content_id AND content_type = _content_type;

  total := COALESCE(total, 0);

  IF counted THEN
    total := total + 1;
    INSERT INTO public.content_view_counts (content_id, content_type, unique_view_count, last_updated)
    VALUES (_content_id, _content_type, total, now())
    ON CONFLICT (content_id, content_type)
    DO UPDATE SET unique_view_count = EXCLUDED.unique_view_count, last_updated = now();
  END IF;

  RETURN total;
END;
$$;

-- 6. Rate-limit helper for comment submissions
CREATE OR REPLACE FUNCTION public.recent_comment_count(_visitor_hash text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.content_views
  WHERE visitor_hash = _visitor_hash AND viewed_at > now() - interval '10 minutes'
$$;

REVOKE ALL ON FUNCTION public.get_public_comments(text, uuid) FROM public;
REVOKE ALL ON FUNCTION public.submit_public_comment(text, uuid, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.flag_public_comment(uuid) FROM public;
REVOKE ALL ON FUNCTION public.record_content_view(text, uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.recent_comment_count(text) FROM public;

GRANT EXECUTE ON FUNCTION public.get_public_comments(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_comment(text, uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.flag_public_comment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_content_view(text, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recent_comment_count(text) TO anon, authenticated;