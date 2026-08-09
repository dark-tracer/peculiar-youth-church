
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS comments_parent_idx ON public.comments(parent_comment_id);

CREATE TABLE IF NOT EXISTS public.pending_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  commenter_name text NOT NULL,
  commenter_email text NOT NULL,
  comment_text text NOT NULL,
  verification_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pending_comments TO service_role;
ALTER TABLE public.pending_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pending comments" ON public.pending_comments
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, visitor_hash)
);
GRANT SELECT ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read likes" ON public.comment_likes
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- reply count trigger
CREATE OR REPLACE FUNCTION public.sync_reply_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE public.comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE public.comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS comments_reply_count ON public.comments;
CREATE TRIGGER comments_reply_count AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_reply_count();

-- public read of comments (threaded, no emails)
DROP FUNCTION IF EXISTS public.get_public_comments(text, uuid);
CREATE OR REPLACE FUNCTION public.get_public_comments(_content_type text, _content_id uuid)
RETURNS TABLE(id uuid, parent_comment_id uuid, commenter_name text, comment_text text,
              created_at timestamptz, is_pinned boolean, like_count integer, reply_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.parent_comment_id, c.commenter_name, c.comment_text, c.created_at,
         c.is_pinned, c.like_count, c.reply_count
  FROM public.comments c
  WHERE c.content_type = _content_type
    AND c.content_id = _content_id
    AND c.is_deleted = false
  ORDER BY c.is_pinned DESC, c.created_at DESC
$$;

-- name/email consistency check
CREATE OR REPLACE FUNCTION public.check_commenter_name(_name text, _email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comments
    WHERE lower(btrim(commenter_name)) = lower(btrim(_name))
      AND lower(btrim(commenter_email)) <> lower(btrim(_email))
  )
$$;

-- queue a pending comment, returns token
CREATE OR REPLACE FUNCTION public.queue_pending_comment(
  _content_type text, _content_id uuid, _parent_comment_id uuid,
  _name text, _email text, _comment text)
RETURNS TABLE(id uuid, verification_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE parent record;
BEGIN
  IF _content_type NOT IN ('blog','article') THEN RAISE EXCEPTION 'Invalid content type'; END IF;
  IF length(btrim(_name)) < 2 OR length(_name) > 80 THEN RAISE EXCEPTION 'Please enter your full name.'; END IF;
  IF _email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' OR length(_email) > 255 THEN RAISE EXCEPTION 'Please enter a valid email address.'; END IF;
  IF length(btrim(_comment)) < 2 OR length(_comment) > 500 THEN RAISE EXCEPTION 'Comments are limited to 1-500 characters.'; END IF;

  IF _parent_comment_id IS NOT NULL THEN
    SELECT * INTO parent FROM public.comments WHERE public.comments.id = _parent_comment_id AND is_deleted = false;
    IF parent IS NULL THEN RAISE EXCEPTION 'Comment not found.'; END IF;
    IF parent.parent_comment_id IS NOT NULL THEN RAISE EXCEPTION 'You cannot reply to a reply.'; END IF;
  END IF;

  RETURN QUERY
  INSERT INTO public.pending_comments
    (content_type, content_id, parent_comment_id, commenter_name, commenter_email, comment_text)
  VALUES (_content_type, _content_id, _parent_comment_id, btrim(_name), lower(btrim(_email)), btrim(_comment))
  RETURNING pending_comments.id, pending_comments.verification_token;
END; $$;

-- verify + publish
CREATE OR REPLACE FUNCTION public.verify_pending_comment(_token uuid)
RETURNS TABLE(status text, content_type text, content_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; new_id uuid;
BEGIN
  SELECT * INTO p FROM public.pending_comments WHERE verification_token = _token;
  IF p IS NULL THEN RETURN QUERY SELECT 'not_found'::text, NULL::text, NULL::uuid; RETURN; END IF;
  IF p.token_expires_at < now() THEN
    DELETE FROM public.pending_comments WHERE id = p.id;
    RETURN QUERY SELECT 'expired'::text, p.content_type, p.content_id; RETURN;
  END IF;

  INSERT INTO public.comments
    (content_type, content_id, parent_comment_id, commenter_name, commenter_email, comment_text)
  VALUES (p.content_type, p.content_id, p.parent_comment_id, p.commenter_name, p.commenter_email, p.comment_text)
  RETURNING id INTO new_id;

  DELETE FROM public.pending_comments WHERE id = p.id;
  RETURN QUERY SELECT 'verified'::text, p.content_type, p.content_id;
END; $$;

-- likes
CREATE OR REPLACE FUNCTION public.toggle_comment_like(_comment_id uuid, _visitor_hash text)
RETURNS TABLE(liked boolean, like_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing uuid; total integer; is_liked boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.comments c WHERE c.id = _comment_id AND c.is_deleted = false) THEN
    RAISE EXCEPTION 'Comment not found.';
  END IF;
  SELECT id INTO existing FROM public.comment_likes
    WHERE comment_id = _comment_id AND visitor_hash = _visitor_hash;
  IF existing IS NOT NULL THEN
    DELETE FROM public.comment_likes WHERE id = existing;
    is_liked := false;
  ELSE
    INSERT INTO public.comment_likes (comment_id, visitor_hash) VALUES (_comment_id, _visitor_hash)
      ON CONFLICT DO NOTHING;
    is_liked := true;
  END IF;
  SELECT count(*)::int INTO total FROM public.comment_likes WHERE comment_id = _comment_id;
  UPDATE public.comments SET like_count = total WHERE id = _comment_id;
  RETURN QUERY SELECT is_liked, total;
END; $$;

-- pinning (admin only)
CREATE OR REPLACE FUNCTION public.set_pinned_comment(_comment_id uuid, _pinned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO c FROM public.comments WHERE id = _comment_id;
  IF c IS NULL OR c.parent_comment_id IS NOT NULL THEN RAISE EXCEPTION 'Only top-level comments can be pinned.'; END IF;
  IF _pinned THEN
    UPDATE public.comments SET is_pinned = false
      WHERE content_type = c.content_type AND content_id = c.content_id AND is_pinned = true;
  END IF;
  UPDATE public.comments SET is_pinned = _pinned WHERE id = _comment_id;
END; $$;

-- delete a whole thread (admin only)
CREATE OR REPLACE FUNCTION public.delete_comment_thread(_comment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.comments SET is_deleted = true
    WHERE id = _comment_id OR parent_comment_id = _comment_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.queue_pending_comment(text, uuid, uuid, text, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.verify_pending_comment(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.toggle_comment_like(uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_commenter_name(text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.set_pinned_comment(uuid, boolean) FROM public;
REVOKE EXECUTE ON FUNCTION public.delete_comment_thread(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.queue_pending_comment(text, uuid, uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_pending_comment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_comment_like(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_commenter_name(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_comments(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_pinned_comment(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_comment_thread(uuid) TO authenticated;

-- realtime for live like counts
ALTER TABLE public.comments REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- daily cleanup of expired unverified comments
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('cleanup-pending-comments') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-pending-comments');
SELECT cron.schedule('cleanup-pending-comments', '0 3 * * *', $$
  DELETE FROM public.pending_comments WHERE token_expires_at < now();
$$);
