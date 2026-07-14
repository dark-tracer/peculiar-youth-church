import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, PageHero } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";

export const Route = createFileRoute("/artworks")({
  head: () => ({
    meta: [
      { title: "Digital Artworks — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Scripture-inspired posters, wallpapers, and digital art created to inspire faith — free to download." },
      { property: "og:title", content: "Digital Artworks — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Scripture-inspired posters, wallpapers, and visual art for download." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://peculiar-youth-church.lovable.app/artworks" },
    ],
    links: [{ rel: "canonical", href: "https://peculiar-youth-church.lovable.app/artworks" }],
  }),
  component: ArtworksGallery,
});

type Art = {
  id: string; slug: string; title: string; artist_name: string | null;
  description: string | null; scripture: string | null; image_url: string | null;
  category: string | null; tags: string[] | null; allow_download: boolean; featured: boolean;
};

function ArtworksGallery() {
  const [active, setActive] = useState<Art | null>(null);

  const { data: artworks, isLoading } = useQuery({
    queryKey: ["public-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id, slug, title, artist_name, description, scripture, image_url, category, tags, allow_download, featured")
        .eq("status", "published")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Art[];
    },
  });

  return (
    <PageShell>
      <PageHero
        eyebrow="Gallery"
        title="Visual scripture art."
        subtitle="Wallpapers, posters, and digital pieces created to inspire faith."
      />
      <section className="container-x py-12">
        {isLoading && <p className="text-center text-muted-foreground py-16">Loading…</p>}
        {!isLoading && (!artworks || artworks.length === 0) && (
          <p className="text-center text-muted-foreground py-16">No artworks published yet.</p>
        )}

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {artworks?.map((a) => (
            <button
              key={a.id}
              id={a.slug}
              onClick={() => setActive(a)}
              className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-card group focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt={a.title}
                  loading="lazy"
                  className="w-full transition group-hover:scale-[1.02]"
                />
              )}
              <div className="p-3 text-left">
                <p className="font-semibold text-sm truncate">{a.title}</p>
                {a.scripture && <p className="text-xs italic text-muted-foreground truncate">{a.scripture}</p>}
              </div>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
          {active && (
            <div className="grid md:grid-cols-[1.5fr_1fr]">
              <div className="bg-black flex items-center justify-center">
                {active.image_url && <img src={active.image_url} alt={active.title} className="max-h-[80vh] w-full object-contain" />}
              </div>
              <div className="p-6 space-y-4">
                <button onClick={() => setActive(null)} aria-label="Close artwork preview" className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 hover:bg-muted md:hidden">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                {active.category && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{active.category}</p>}
                <h2 className="text-2xl font-bold">{active.title}</h2>
                {active.scripture && <p className="text-base italic text-muted-foreground">{active.scripture}</p>}
                {active.artist_name && <p className="text-sm text-muted-foreground">by {active.artist_name}</p>}
                {active.description && <p className="text-sm leading-relaxed">{active.description}</p>}
                {active.tags && active.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {active.tags.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                {active.allow_download && active.image_url && (
                  <a
                    href={active.image_url}
                    download={`${active.slug}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
