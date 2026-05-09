import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { ArrowRight } from "lucide-react";
import { posts } from "@/lib/data";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Devotionals and articles for teens navigating faith, friendships, and everyday life." },
    ],
  }),
  component: Blog,
});

function Blog() {
  return (
    <PageShell>
      <PageHero eyebrow="Blog & Devotionals" title="Real talk for real life." subtitle="Short reads to help you stay grounded between Sundays." />

      <section className="container-x py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-card p-7 hover:border-brand/40 hover:shadow-lg transition">
              <p className="text-xs text-brand font-semibold">{p.date}</p>
              <h3 className="mt-2 text-2xl font-bold">{p.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{p.excerpt}</p>
              <a href="#" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Read More <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
