
CREATE TABLE public.page_content (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.page_content TO anon;
GRANT SELECT, INSERT, UPDATE ON public.page_content TO authenticated;
GRANT ALL ON public.page_content TO service_role;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read page_content" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Admins insert page_content" ON public.page_content FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update page_content" ON public.page_content FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER page_content_touch BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed defaults
INSERT INTO public.page_content (key, data) VALUES
  ('home_hero', jsonb_build_object(
    'eyebrow', 'Ages 10 – 19',
    'title_lead', 'You were made for',
    'title_highlight', 'something peculiar.',
    'subtitle', 'Peculiar Youth & Children Ministry is a community of young people chasing Jesus, building real friendships, and growing into who they were created to be.',
    'primary_cta_label', 'I Am New Here',
    'primary_cta_href', '/contact',
    'secondary_cta_label', 'Upcoming Events',
    'secondary_cta_href', '/events',
    'background_image_url', ''
  )),
  ('home_about', jsonb_build_object(
    'eyebrow', 'Who we are',
    'title', 'A safe place to grow, belong, and believe.',
    'body', 'We exist to help young people meet Jesus in a real way — through honest teaching, joyful worship, and lasting friendships. Whether it''s your first Sunday or your hundredth, there''s a seat with your name on it.'
  )),
  ('home_verse', jsonb_build_object(
    'reference', '',
    'text', ''
  )),
  ('home_service_times', jsonb_build_object(
    'title', 'Service Times',
    'sunday_service', 'Sunday Service · 11:00 AM',
    'bible_study', 'Bible Study · Sundays · 6:00 PM',
    'worship_sunday', 'Worship Sunday · First Sunday of every month'
  )),
  ('home_mission', jsonb_build_object(
    'text', 'To raise a peculiar generation that knows Jesus deeply, loves people genuinely, and lives boldly on purpose.'
  )),
  ('about_page', jsonb_build_object(
    'hero_eyebrow', 'About Us',
    'hero_title', 'A ministry built for the next generation.',
    'hero_subtitle', 'We''re a youth and children''s church helping young people aged 10–19 find Jesus, friendship, and purpose.',
    'who_title', 'More than a youth group.',
    'who_body_1', 'Peculiar Youth & Children Ministry started with a simple conviction: young people don''t need to be entertained, they need to be empowered. For over a decade we''ve been creating spaces where teens and kids meet Jesus in a real way, build friendships that outlast the season, and discover the unique calling on their lives.',
    'who_body_2', 'Every Sunday looks like worship, honest teaching, small group conversations, and a whole lot of laughter. You belong here.',
    'who_image_url', ''
  )),
  ('contact_page', jsonb_build_object(
    'hero_title', 'Let''s talk.',
    'hero_subtitle', 'Got a question? Planning your first visit? Drop us a message — we''d love to meet you.',
    'address', 'C.P, Kasoa, Central Region, Ghana',
    'phone', '+233 50 367 7447',
    'email', 'peculiaryouthchurch.pyc@gmail.com',
    'service_times', E'Sunday Service · 11:00 AM\nBible Study · Sundays · 6:00 PM\nWorship Sunday · First Sunday of every month'
  ))
ON CONFLICT (key) DO NOTHING;
