import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageShell, PageHero } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Long-form articles, columns, and editions." },
      { property: "og:title", content: "Articles — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Long-form articles, columns, and editions." },
    ],
  }),
  component: ArticlesList,
});

function ArticlesList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["public-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, author_name, publish_date, column_name, edition_label, excerpt, cover_url, tags")
        .eq("status", "published")
        .order("publish_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!posts) return [];
    const s = q.trim().toLowerCase();
    if (!s) return posts;
    return posts.filter((p) =>
      [p.title, p.author_name, p.column_name, p.edition_label, p.excerpt, ...(p.tags ?? [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(s))
    );
  }, [posts, q]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Articles"
        title="Long-form writing for hungry hearts."
        subtitle="Columns, editions, and deeper reflections from our team."
      />
      <div className="container-x mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, column, author…"
            className="pl-9"
          />
        </div>
      </div>
      <section className="container-x py-12">
        {isLoading && <p className="text-center text-muted-foreground py-16">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            {q ? "No articles match your search." : "No articles published yet. Check back soon."}
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-brand/40 hover:shadow-lg transition">
              <Link to="/articles/$slug" params={{ slug: p.slug }} className="block">
                <div className="aspect-[16/10] gradient-brand relative">
                  {p.cover_url && <img src={p.cover_url} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />}
                </div>
                <div className="p-6">
                  {p.column_name && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{p.column_name}</p>}
                  <h3 className="mt-1 text-lg font-bold group-hover:text-brand transition">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.author_name ?? "Ministry"} · {p.publish_date ? format(new Date(p.publish_date), "MMM d, yyyy") : ""}
                    {p.edition_label && ` · ${p.edition_label}`}
                  </p>
                  {p.excerpt && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
