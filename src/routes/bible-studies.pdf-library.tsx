import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, Download, FileText, Search } from "lucide-react";
import { PageHero, PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { GatedDownloadButton } from "@/components/GatedDownloadButton";
import { supabase } from "@/integrations/supabase/client";

const CANONICAL = "https://peculiar-youth-church.lovable.app/bible-studies/pdf-library";

const FAQ = [
  {
    q: "Are the youth Bible study lesson PDFs really free?",
    a: "Yes. Every PDF in our youth Bible study library is 100% free to download. Create a free account to unlock the download link — no payment, no subscription.",
  },
  {
    q: "Who are these Bible study PDFs for?",
    a: "Our free lesson PDFs are written for teens, young adults, youth leaders, small-group facilitators, and Sunday-school teachers looking for scripture-grounded discussion guides.",
  },
  {
    q: "Can I print and share the PDFs with my youth group?",
    a: "Yes — print, hand out, and use the lessons inside your local church, small group, or family setting. Please don't repost the files on another website; link back to this page instead.",
  },
  {
    q: "How often do you add new youth Bible study lessons?",
    a: "New lessons are added regularly as our teaching series progress. Bookmark this page or subscribe to the newsletter so you don't miss a release.",
  },
];

export const Route = createFileRoute("/bible-studies/pdf-library")({
  head: () => ({
    meta: [
      { title: "Free Youth Bible Study Lessons PDF — Download Library" },
      {
        name: "description",
        content:
          "Download free youth Bible study lesson PDFs — printable scripture-based discussion guides for teens, young adults, and youth leaders. No cost, no subscription.",
      },
      { name: "keywords", content: "youth bible study lessons pdf free, free youth bible study, printable bible study for teens, youth group lessons pdf" },
      { property: "og:title", content: "Free Youth Bible Study Lessons PDF — Download Library" },
      {
        property: "og:description",
        content: "A free, growing library of printable youth Bible study PDFs for teens, small groups, and youth leaders.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Free Youth Bible Study Lessons PDF Library",
          url: CANONICAL,
          description:
            "Free printable youth Bible study lesson PDFs — scripture-based discussion guides for teens, young adults, and youth leaders.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: PdfLibrary,
});

function PdfLibrary() {
  const { data: studies, isLoading } = useQuery({
    queryKey: ["public-studies-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_studies")
        .select("id, slug, title, series_name, study_number, scripture, objective, audience, pdf_url, updated_at")
        .eq("status", "published")
        .not("pdf_url", "is", null)
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
      [x.title, x.series_name, x.scripture, x.objective, x.audience]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(s)),
    );
  }, [studies, q]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Free PDF Library"
        title="Free youth Bible study lessons — PDF downloads."
        subtitle="A growing library of printable, scripture-based Bible study lessons for teens, young adults, small groups, and youth leaders. Download, print, share — completely free."
      />

      <section className="container-x mt-10">
        <div className="rounded-2xl border border-border bg-brand/5 p-6 md:p-8">
          <h2 className="text-xl font-bold">What you'll find here</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-brand" /> Printable PDF lesson notes for youth ministry</li>
            <li className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-brand" /> Scripture references and discussion questions included</li>
            <li className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-brand" /> Ready to use in small groups, camps, or Sunday school</li>
            <li className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-brand" /> 100% free — create a free account to unlock downloads</li>
          </ul>
        </div>

        <div className="relative mt-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons by title, scripture, series…" className="pl-9" />
        </div>
      </section>

      <section className="container-x py-10">
        <h2 className="text-2xl font-bold">Download free youth Bible study PDFs</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLoading ? "Loading library…" : `${filtered.length} free lesson${filtered.length === 1 ? "" : "s"} available`}
        </p>

        {!isLoading && filtered.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            {q ? "No lessons match your search." : "No PDF lessons published yet. Check back soon."}
          </p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <article key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:border-brand/40 hover:shadow-lg">
              <div className="mb-4 inline-grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                <BookOpen className="h-5 w-5" />
              </div>
              {s.series_name && (
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  {s.series_name}{s.study_number ? ` · #${s.study_number}` : ""}
                </p>
              )}
              <h3 className="mt-1 text-lg font-bold">
                <Link to="/bible-studies/$slug" params={{ slug: s.slug }} className="hover:text-brand">
                  {s.title}
                </Link>
              </h3>
              {s.scripture && <p className="mt-1 text-sm italic text-muted-foreground">{s.scripture}</p>}
              {s.objective && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{s.objective}</p>}
              <div className="mt-auto pt-5 flex flex-wrap gap-2">
                {s.pdf_url && (
                  <GatedDownloadButton
                    bucket="study-pdfs"
                    path={s.pdf_url}
                    download
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" /> Free PDF
                  </GatedDownloadButton>
                )}
                <Link
                  to="/bible-studies/$slug"
                  params={{ slug: s.slug }}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                  aria-label={`Read lesson: ${s.title}`}
                >
                  Read lesson
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer text-base font-semibold marker:content-none">
                {f.q}
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
