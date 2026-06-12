import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { PageHero, PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/bible-studies/")({
  component: StudiesList,
});

function StudiesList() {
  const { data: studies, isLoading } = useQuery({
    queryKey: ["public-studies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_studies")
        .select("id, slug, title, series_name, study_number, scripture, objective")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!studies) return [];
    const s = q.trim().toLowerCase();
    if (!s) return studies;
    return studies.filter((x) =>
      [x.title, x.series_name, x.scripture, x.objective]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(s)),
    );
  }, [studies, q]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Bible Studies"
        title="Grow deeper in the Word."
        subtitle="Lesson notes, discussion guides, and study resources for personal or group use."
      />
      <div className="container-x mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, scripture, series…" className="pl-9" />
        </div>
      </div>
      <section className="container-x py-12">
        {isLoading && <p className="py-16 text-center text-muted-foreground">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            {q ? "No studies match your search." : "No studies published yet. Check back soon."}
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.id} to="/bible-studies/$slug" params={{ slug: s.slug }} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-brand/40 hover:shadow-lg">
              <div className="mb-4 inline-grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                <BookOpen className="h-5 w-5" />
              </div>
              {s.series_name && (
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  {s.series_name}{s.study_number ? ` · #${s.study_number}` : ""}
                </p>
              )}
              <h3 className="mt-1 text-lg font-bold transition group-hover:text-brand">{s.title}</h3>
              {s.scripture && <p className="mt-1 text-sm italic text-muted-foreground">{s.scripture}</p>}
              {s.objective && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{s.objective}</p>}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}