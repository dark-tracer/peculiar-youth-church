-- ============ CHATBOT KNOWLEDGE ============
CREATE TABLE public.chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chatbot_knowledge TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbot_knowledge TO authenticated;
GRANT ALL ON public.chatbot_knowledge TO service_role;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatbot_knowledge public read" ON public.chatbot_knowledge FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chatbot_knowledge admin write" ON public.chatbot_knowledge FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER chatbot_knowledge_touch BEFORE UPDATE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ KNOWLEDGE DOCUMENTS ============
CREATE TABLE public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text,
  extracted_text text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_documents public read" ON public.knowledge_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "knowledge_documents admin write" ON public.knowledge_documents FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ UNANSWERED QUESTIONS ============
CREATE TABLE public.unanswered_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  asked_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);
GRANT INSERT ON public.unanswered_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unanswered_questions TO authenticated;
GRANT ALL ON public.unanswered_questions TO service_role;
ALTER TABLE public.unanswered_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unanswered insert public" ON public.unanswered_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "unanswered admin read" ON public.unanswered_questions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "unanswered admin update" ON public.unanswered_questions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "unanswered admin delete" ON public.unanswered_questions FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============ CONTENT VIEWS ============
CREATE TABLE public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_views_lookup ON public.content_views (content_id, visitor_hash, viewed_at DESC);
GRANT SELECT ON public.content_views TO authenticated;
GRANT ALL ON public.content_views TO service_role;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_views admin read" ON public.content_views FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.content_view_counts (
  content_id uuid NOT NULL,
  content_type text NOT NULL,
  unique_view_count integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, content_type)
);
GRANT SELECT ON public.content_view_counts TO anon, authenticated;
GRANT ALL ON public.content_view_counts TO service_role;
ALTER TABLE public.content_view_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view counts public read" ON public.content_view_counts FOR SELECT TO anon, authenticated USING (true);

-- ============ COMMENTS ============
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  commenter_name text NOT NULL,
  commenter_email text NOT NULL,
  comment_text text NOT NULL,
  is_flagged boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_content_idx ON public.comments (content_type, content_id, created_at DESC);

-- email column intentionally excluded from public read grants
GRANT SELECT (id, content_type, content_id, commenter_name, comment_text, is_flagged, is_deleted, created_at)
  ON public.comments TO anon, authenticated;
GRANT INSERT (content_type, content_id, commenter_name, commenter_email, comment_text) ON public.comments TO anon, authenticated;
GRANT UPDATE (is_flagged) ON public.comments TO anon;
GRANT UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments public read" ON public.comments FOR SELECT TO anon, authenticated USING (is_deleted = false);
CREATE POLICY "comments public insert" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (is_deleted = false AND is_flagged = false);
CREATE POLICY "comments public flag" ON public.comments FOR UPDATE TO anon USING (is_deleted = false) WITH CHECK (is_deleted = false);
CREATE POLICY "comments admin manage" ON public.comments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ PRESET Q&A ============
INSERT INTO public.chatbot_knowledge (question, answer, keywords, category) VALUES
('What time is service?', 'Sunday service is at 9AM at Peculiar International School Auditorium, Kasoa CP, Ghana.', ARRAY['service','time','sunday','9am','worship','start'], 'Service Times'),
('Where is the church located?', 'We meet at Peculiar International School Auditorium, Kasoa CP, Ghana.', ARRAY['location','where','address','kasoa','directions','map'], 'General'),
('How do I join Peculiar Youth?', 'Simply show up on Sunday at 9AM. You can also fill out the New Here form on our website.', ARRAY['join','member','membership','new','sign up'], 'General'),
('How do I submit a prayer request?', 'Visit the Prayer page on our website and fill out the prayer request form.', ARRAY['prayer','pray','request','intercession'], 'General'),
('How do I give or donate?', 'Visit the Give page on our website to make a one-time or recurring donation.', ARRAY['give','giving','donate','donation','offering','tithe','support'], 'General');