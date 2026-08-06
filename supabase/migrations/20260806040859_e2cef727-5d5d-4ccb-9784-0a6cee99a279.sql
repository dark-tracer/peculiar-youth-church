DROP POLICY IF EXISTS "knowledge_documents public read" ON public.knowledge_documents;
REVOKE SELECT ON public.knowledge_documents FROM anon;

CREATE OR REPLACE FUNCTION public.search_knowledge_snippets(_query text)
RETURNS TABLE(file_name text, snippet text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH q AS (
    SELECT array_agg(w) AS words
    FROM (
      SELECT DISTINCT lower(w) AS w
      FROM regexp_split_to_table(coalesce(_query,''), '[^a-zA-Z0-9]+') AS w
      WHERE length(w) > 3
      LIMIT 12
    ) t
  ),
  s AS (
    SELECT d.file_name, btrim(sent) AS sent
    FROM public.knowledge_documents d,
         LATERAL regexp_split_to_table(d.extracted_text, '(?<=[.!?])\s+|\n+') AS sent
    WHERE length(btrim(sent)) BETWEEN 26 AND 600
  )
  SELECT s.file_name, s.sent
  FROM s, q
  WHERE q.words IS NOT NULL
    AND (SELECT count(*) FROM unnest(q.words) w WHERE position(w in lower(s.sent)) > 0) > 0
  ORDER BY (SELECT count(*) FROM unnest(q.words) w WHERE position(w in lower(s.sent)) > 0) DESC
  LIMIT 5
$$;

REVOKE ALL ON FUNCTION public.search_knowledge_snippets(text) FROM public;
GRANT EXECUTE ON FUNCTION public.search_knowledge_snippets(text) TO anon, authenticated;