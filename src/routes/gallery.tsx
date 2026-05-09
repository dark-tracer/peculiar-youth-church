import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import g3 from "@/assets/g3.jpg";
import g4 from "@/assets/g4.jpg";
import g5 from "@/assets/g5.jpg";
import g6 from "@/assets/g6.jpg";
import hero from "@/assets/hero.jpg";

const images = [g2, g4, g1, hero, g3, g5, g6, g1, g2];

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Snapshots from worship, events, and community moments at Peculiar Youth." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  return (
    <PageShell>
      <PageHero eyebrow="Gallery" title="Moments worth remembering." subtitle="Worship nights, summer camps, hangouts and the everyday joy of doing life together." />

      <section className="container-x py-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
          {images.map((src, i) => (
            <div key={i} className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-surface">
              <img src={src} alt={`Gallery photo ${i + 1}`} loading="lazy" className="w-full h-auto block hover:scale-105 transition duration-500" />
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
