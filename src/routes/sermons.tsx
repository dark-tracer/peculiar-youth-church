import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { Download, Info } from "lucide-react";
import { sermons } from "@/lib/data";

export const Route = createFileRoute("/sermons")({
  head: () => ({
    meta: [
      { title: "Sermons — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Browse our latest sermons and download PDF notes to read or share." },
    ],
  }),
  component: Sermons,
});

function Sermons() {
  return (
    <PageShell>
      <PageHero eyebrow="Sermons" title="Messages that meet you where you are." subtitle="Download notes from our recent talks and dive deeper on your own." />

      <div className="container-x mt-8">
        <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft px-5 py-4">
          <Info className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-foreground/90">
            <span className="font-semibold text-brand">Audio sermons coming soon.</span>{" "}
            <span className="text-foreground/80">Stay connected — we're working on it.</span>
          </p>
        </div>
      </div>

      <section className="container-x py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sermons.map((s) => (
            <article key={s.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-brand/40 hover:shadow-lg transition">
              <div className="aspect-[16/10] gradient-brand relative flex items-end p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-foreground/80">{s.series}</p>
                  <h3 className="mt-1 text-xl font-bold text-brand-foreground">{s.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs text-muted-foreground">{s.date}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                <a href={s.pdfUrl} download target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-2 text-sm font-semibold hover:bg-brand hover:text-brand-foreground transition">
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
