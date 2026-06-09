import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/bible-studies/$slug")({
  component: StudyDetail,
});

function StudyDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["study", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_studies").select("*")
        .eq("slug", slug).eq("status", "published").maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Loading…</div></PageShell>;
  if (!data) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Study not found.</div></PageShell>;

  return (
    <PageShell>
      <article className="container-x py-12 max-w-3xl">
        <Link to="/bible-studies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> All studies
        </Link>
        {data.series_name && (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {data.series_name}{data.study_number ? ` · Study #${data.study_number}` : ""}
          </p>
        )}
        <h1 className="mt-2 text-4xl font-bold">{data.title}</h1>
        {data.scripture && <p className="mt-2 text-lg italic text-muted-foreground">{data.scripture}</p>}
        <div className="mt-3 text-sm text-muted-foreground space-x-3">
          {data.leader_name && <span>Led by {data.leader_name}</span>}
          {data.audience && <span>· For {data.audience}</span>}
        </div>

        {data.objective && (
          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand">Objective</h2>
            <p className="mt-2 text-base">{data.objective}</p>
          </div>
        )}

        {data.body && (
          <div className="prose prose-lg max-w-none mt-10" dangerouslySetInnerHTML={{ __html: data.body }} />
        )}

        {data.discussion_questions && data.discussion_questions.length > 0 && (
          <section className="mt-10 rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Discussion Questions</h2>
            <ol className="mt-4 space-y-3 list-decimal list-inside">
              {data.discussion_questions.map((q: string, i: number) => (
                <li key={i} className="text-base">{q}</li>
              ))}
            </ol>
          </section>
        )}

        {data.key_takeaway && (
          <div className="mt-10 rounded-xl border-l-4 border-brand bg-brand/5 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand">Key Takeaway</h2>
            <p className="mt-2 text-lg font-medium">{data.key_takeaway}</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          {data.pdf_url && (
            <a href={data.pdf_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90">
              <Download className="h-4 w-4" /> Download PDF
            </a>
          )}
          {data.resource_url && (
            <a href={data.resource_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              <ExternalLink className="h-4 w-4" /> External Resource
            </a>
          )}
        </div>
      </article>
    </PageShell>
  );
}
