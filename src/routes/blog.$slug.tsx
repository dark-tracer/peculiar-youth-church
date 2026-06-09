import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogDetail,
});

function BlogDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Loading…</div></PageShell>;
  if (!data) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Post not found.</div></PageShell>;

  return (
    <PageShell>
      <article className="container-x py-12 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        {data.category && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{data.category}</p>}
        <h1 className="mt-2 text-4xl font-bold">{data.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.author_name ?? "Ministry"} · {data.publish_date ? format(new Date(data.publish_date), "MMMM d, yyyy") : ""}
        </p>
        {data.cover_url && (
          <img src={data.cover_url} alt={data.title} className="mt-8 w-full rounded-2xl object-cover aspect-[16/9]" />
        )}
        {data.body && (
          <div className="prose prose-lg max-w-none mt-10" dangerouslySetInnerHTML={{ __html: data.body }} />
        )}
        {data.tags && data.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {data.tags.map((t: string) => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </article>
    </PageShell>
  );
}
