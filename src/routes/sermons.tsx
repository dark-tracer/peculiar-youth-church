import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageShell, PageHero } from "@/components/PageShell";
import { Download, Headphones, Play, Info, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/sermons")({
  head: () => ({
    meta: [
      { title: "Sermons — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Browse our latest sermons and download notes." },
    ],
  }),
  component: Sermons,
});

async function fetchPublishedSermons() {
  const { data, error } = await supabase
    .from("sermons")
    .select("id, slug, title, preacher_name, date_preached, scripture, series_name, description, video_url, audio_url, notes_pdf_url, thumbnail_url, featured, tags")
    .eq("status", "published")
    .order("date_preached", { ascending: false });
  if (error) throw error;
  return data;
}

function Sermons() {
  const { data: sermons, isLoading } = useQuery({
    queryKey: ["public-sermons"],
    queryFn: fetchPublishedSermons,
  });

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!sermons) return [];
    const s = q.trim().toLowerCase();
    if (!s) return sermons;
    return sermons.filter((x) =>
      [x.title, x.preacher_name, x.series_name, x.scripture, ...(x.tags ?? [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(s))
    );
  }, [sermons, q]);

  const featured = filtered.find((s) => s.featured) ?? filtered[0];
  const rest = filtered.filter((s) => s.id !== featured?.id);

  return (
    <PageShell>
      <PageHero
        eyebrow="Sermons"
        title="Messages that meet you where you are."
        subtitle="Browse our latest talks, listen in, and download notes."
      />

      <div className="container-x mt-8 space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft px-5 py-4">
          <Info className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-foreground/90">
            <span className="font-semibold text-brand">Fresh content weekly.</span>{" "}
            <span className="text-foreground/80">Check back often for new messages.</span>
          </p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, preacher, scripture…"
            className="pl-9"
          />
        </div>
      </div>

      <section className="container-x py-12">
        {isLoading && <p className="text-center text-muted-foreground py-16">Loading sermons…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            {q ? "No sermons match your search." : "No sermons published yet. Check back soon."}
          </p>
        )}

        {featured && (
          <article className="mb-12 rounded-2xl border border-brand/30 bg-card overflow-hidden shadow-lg">
            <div className="grid md:grid-cols-2">
              <div className="aspect-[16/10] md:aspect-auto gradient-brand relative">
                {featured.thumbnail_url ? (
                  <img src={featured.thumbnail_url} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-8 flex flex-col">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
                  <Star className="h-3.5 w-3.5 fill-current" /> Featured Sermon
                </div>
                {featured.series_name && (
                  <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">{featured.series_name}</p>
                )}
                <h2 className="mt-2 text-2xl md:text-3xl font-bold">{featured.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {featured.preacher_name} · {format(new Date(featured.date_preached), "MMM d, yyyy")}
                  {featured.scripture && ` · ${featured.scripture}`}
                </p>
                {featured.description && (
                  <div className="mt-4 prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: featured.description }} />
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to="/sermons/$slug" params={{ slug: featured.slug }} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90">
                    <Play className="h-4 w-4" /> View Sermon
                  </Link>
                  {featured.audio_url && (
                    <a href={featured.audio_url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-semibold hover:bg-foreground/10">
                      <Headphones className="h-4 w-4" /> Download Audio
                    </a>
                  )}
                  {featured.notes_pdf_url && (
                    <a href={featured.notes_pdf_url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-semibold hover:bg-foreground/10">
                      <Download className="h-4 w-4" /> Notes (PDF)
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}

        {rest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((s) => (
              <article key={s.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-brand/40 hover:shadow-lg transition">
                <Link to="/sermons/$slug" params={{ slug: s.slug }} className="block">
                  <div className="aspect-[16/10] gradient-brand relative">
                    {s.thumbnail_url && <img src={s.thumbnail_url} alt={s.title} className="absolute inset-0 h-full w-full object-cover" />}
                  </div>
                  <div className="p-6">
                    {s.series_name && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{s.series_name}</p>}
                    <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.preacher_name} · {format(new Date(s.date_preached), "MMM d, yyyy")}
                    </p>
                    {s.scripture && <p className="mt-2 text-xs text-muted-foreground">{s.scripture}</p>}
                  </div>
                </Link>
                {(s.audio_url || s.notes_pdf_url) && (
                  <div className="px-6 pb-5 flex flex-wrap gap-2 text-xs">
                    {s.audio_url && (
                      <a href={s.audio_url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-semibold hover:bg-muted/70">
                        <Headphones className="h-3 w-3" /> Audio
                      </a>
                    )}
                    {s.notes_pdf_url && (
                      <a href={s.notes_pdf_url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-semibold hover:bg-muted/70">
                        <Download className="h-3 w-3" /> PDF
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
