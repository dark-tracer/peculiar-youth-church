import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, PageHero } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/bible-studies")({
  head: () => ({
    meta: [
      { title: "Bible Studies — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Discipleship lessons, scripture-based studies, and discussion guides." },
      { property: "og:title", content: "Bible Studies — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Discipleship lessons, scripture-based studies, and discussion guides." },
    ],
  }),
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

  return (
    <PageShell>
      <PageHero
        eyebrow="Bible Studies"
        title="Grow deeper in the Word."
        subtitle="Lesson notes, discussion guides, and study resources for personal or group use."
      />
      <section className="container-x py-12">
        {isLoading && <p className="text-center text-muted-foreground py-16">Loading…</p>}
        {!isLoading && (!studies || studies.length === 0) && (
          <p className="text-center text-muted-foreground py-16">No studies published yet. Check back soon.</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {studies?.map((s) => (
            <Link key={s.id} to="/bible-studies/$slug" params={{ slug: s.slug }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand/40 hover:shadow-lg transition">
              <div className="inline-grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              {s.series_name && (
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  {s.series_name}{s.study_number ? ` · #${s.study_number}` : ""}
                </p>
              )}
              <h3 className="mt-1 text-lg font-bold group-hover:text-brand transition">{s.title}</h3>
              {s.scripture && <p className="mt-1 text-sm text-muted-foreground italic">{s.scripture}</p>}
              {s.objective && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.objective}</p>}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
