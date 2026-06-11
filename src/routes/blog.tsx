import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageShell, PageHero } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Stories, devotionals, and announcements from our ministry." },
      { property: "og:title", content: "Blog — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Stories, devotionals, and announcements from our ministry." },
    ],
  }),
  component: BlogList,
});

function BlogList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["public-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, author_name, publish_date, category, excerpt, cover_url, tags")
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
      [p.title, p.author_name, p.category, p.excerpt, ...(p.tags ?? [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(s))
    );
  }, [posts, q]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Blog"
        title="Stories, devotionals, and updates."
        subtitle="Fresh thinking from our team and community."
      />
      <div className="container-x mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts by title, author, category…"
            className="pl-9"
          />
        </div>
      </div>
      <section className="container-x py-12">
        {isLoading && <p className="text-center text-muted-foreground py-16">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            {q ? "No posts match your search." : "No posts published yet. Check back soon."}
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-brand/40 hover:shadow-lg transition">
              <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                <div className="aspect-[16/10] gradient-brand relative">
                  {p.cover_url && <img src={p.cover_url} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />}
                </div>
                <div className="p-6">
                  {p.category && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{p.category}</p>}
                  <h3 className="mt-1 text-lg font-bold group-hover:text-brand transition">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.author_name ?? "Ministry"} · {p.publish_date ? format(new Date(p.publish_date), "MMM d, yyyy") : ""}
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
