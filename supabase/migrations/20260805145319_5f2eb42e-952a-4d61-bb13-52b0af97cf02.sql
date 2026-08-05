DROP POLICY IF EXISTS "Anyone can read knowledge documents" ON public.knowledge_documents;
DROP POLICY IF EXISTS "Public can read knowledge documents" ON public.knowledge_documents;
DROP POLICY IF EXISTS "knowledge_documents_select" ON public.knowledge_documents;
DROP POLICY IF EXISTS "knowledge_documents_public_read" ON public.knowledge_documents;

REVOKE ALL ON public.knowledge_documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read knowledge documents"
ON public.knowledge_documents FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()));