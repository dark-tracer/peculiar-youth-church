import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Calendar, Clock, Instagram, MapPin } from "lucide-react";
import { PageHero, PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { instagramUrl } from "@/lib/data";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Upcoming youth and children's events — camps, game nights, outreaches, and more." },
      { property: "og:title", content: "Events — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "See what's coming up at Peculiar Youth & Children Ministry." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://peculiar-youth-church.lovable.app/events" },
    ],
    links: [{ rel: "canonical", href: "https://peculiar-youth-church.lovable.app/events" }],
  }),
  component: Events,
});

function Events() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, description, start_at, end_at, location, cover_url, featured")
        .eq("status", "published")
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell>
      <PageHero eyebrow="Events" title="Come hang out with us." subtitle="From summer camps to Friday game nights, here's what's happening next." />

      <section className="container-x py-16">
        {isLoading && <p className="py-16 text-center text-muted-foreground">Loading events…</p>}
        {!isLoading && (!events || events.length === 0) ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center md:p-14">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Calendar className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-bold md:text-3xl">Nothing on the calendar yet</h2>
            <p className="mt-3 text-muted-foreground">No upcoming events right now. Follow us on Instagram to be the first to know when something is coming.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:opacity-90">
                <Instagram className="h-4 w-4" /> Follow on Instagram
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-surface">
                Get in touch
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {events?.map((e) => (
              <article key={e.id} className="grid items-center gap-6 rounded-2xl border border-border bg-card p-6 transition hover:border-brand/40 hover:shadow-lg md:grid-cols-[160px_1fr_auto] md:p-8">
                <div className="gradient-brand rounded-xl p-5 text-center text-brand-foreground">
                  <p className="text-xs uppercase tracking-wider opacity-80">{format(new Date(e.start_at), "MMM")}</p>
                  <p className="font-display mt-1 text-3xl font-bold leading-none">{format(new Date(e.start_at), "d")}</p>
                  <p className="mt-1 text-xs opacity-80">{format(new Date(e.start_at), "yyyy")}</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{e.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand" /> {format(new Date(e.start_at), "h:mm a")}</span>
                    {e.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {e.location}</span>}
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-brand" /> {format(new Date(e.start_at), "MMMM d, yyyy")}</span>
                  </div>
                  {e.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                </div>
                <Link to="/events/$eventId" params={{ eventId: e.slug }} className="inline-flex items-center gap-2 justify-self-start rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 md:justify-self-end" aria-label={`View details for ${e.title}`}>
                  View event details <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}