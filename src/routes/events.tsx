import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { Calendar, Clock, MapPin, ArrowRight, Instagram } from "lucide-react";
import { events, instagramUrl } from "@/lib/data";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Upcoming youth and children's events — camps, game nights, outreaches and more." },
    ],
  }),
  component: Events,
});

function Events() {
  return (
    <PageShell>
      <PageHero eyebrow="Events" title="Come hang out with us." subtitle="From summer camps to Friday game nights, here's what's happening next." />

      <section className="container-x py-16">
        {events.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 md:p-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Calendar className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl md:text-3xl font-bold">Nothing on the calendar yet</h2>
            <p className="mt-3 text-muted-foreground">
              No upcoming events right now. Follow us on Instagram to be the first to know when something is coming.
            </p>
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
            {events.map((e) => (
              <article key={e.id} className="rounded-2xl border border-border bg-card p-6 md:p-8 grid md:grid-cols-[160px_1fr_auto] gap-6 items-center hover:border-brand/40 hover:shadow-lg transition">
                <div className="rounded-xl gradient-brand text-brand-foreground p-5 text-center">
                  <p className="text-xs uppercase tracking-wider opacity-80">{e.date.split(",")[0].split(" ")[0]}</p>
                  <p className="text-3xl font-bold font-display leading-none mt-1">{e.date.split(" ")[1].replace(",", "")}</p>
                  <p className="text-xs mt-1 opacity-80">{e.date.split(", ")[1]}</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{e.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand" /> {e.time}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {e.location}</span>
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-brand" /> {e.date}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                </div>
                <Link to="/events/$eventId" params={{ eventId: e.id }} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 justify-self-start md:justify-self-end">
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
