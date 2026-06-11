import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Users, Heart, Sprout, Download, ArrowRight, Calendar, MapPin, Instagram, Headphones, Play } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import sermonImg from "@/assets/sermon.jpg";
import { events, instagramUrl } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Peculiar Youth & Children Ministry — Home" },
      { name: "description", content: "A youth and children's church where the next generation discovers Jesus, builds friendships, and lives out their purpose." },
      { property: "og:title", content: "Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Where the next generation belongs." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: latest } = useQuery({
    queryKey: ["home-latest-sermon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("id, slug, title, preacher_name, date_preached, scripture, series_name, description, video_url, audio_url, notes_pdf_url, thumbnail_url")
        .eq("status", "published")
        .order("date_preached", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Youth worship" width={1600} height={1000} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        </div>
        <div className="relative container-x py-24 md:py-36 max-w-2xl">
          <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            Ages 10 – 19
          </span>
          <h1 className="mt-5 text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            You were made for <span className="text-gradient">something peculiar.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Peculiar Youth & Children Ministry is a community of young people chasing Jesus, building real friendships, and growing into who they were created to be.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-foreground hover:opacity-90">
              I Am New Here <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/events" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 font-semibold hover:bg-surface">
              Upcoming Events
            </Link>
          </div>
        </div>
      </section>

      {/* INTRO + HIGHLIGHTS */}
      <section className="container-x py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-brand">Who we are</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">A safe place to grow, belong, and believe.</h2>
          <p className="mt-4 text-muted-foreground">
            We exist to help young people meet Jesus in a real way — through honest teaching, joyful worship, and lasting friendships. Whether it's your first Sunday or your hundredth, there's a seat with your name on it.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, title: "Community", text: "Real friends who walk with you through every season — no masks, no pretending." },
            { icon: Heart, title: "Faith", text: "A living relationship with Jesus that shapes how you think, feel, and live." },
            { icon: Sprout, title: "Growth", text: "Spaces to learn, ask hard questions, and discover the gifts God placed in you." },
          ].map((h) => (
            <div key={h.title} className="rounded-2xl border border-border bg-card p-7 hover:shadow-lg hover:-translate-y-1 transition">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                <h.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{h.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST SERMON */}
      {latest && (
        <section className="bg-surface border-y border-border">
          <div className="container-x py-20 md:py-24 grid gap-10 md:grid-cols-2 items-center">
            <div className="rounded-3xl overflow-hidden aspect-[4/3] relative">
              <img
                src={latest.thumbnail_url || sermonImg}
                alt={latest.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {latest.series_name && (
                <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-background/90 backdrop-blur p-4">
                  <p className="text-xs font-semibold text-brand uppercase tracking-wider">Current Series</p>
                  <p className="font-display font-bold text-lg">{latest.series_name}</p>
                </div>
              )}
            </div>
            <div>
              <span className="text-sm font-semibold text-brand">Latest Sermon</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">{latest.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {latest.preacher_name} · Preached on {format(new Date(latest.date_preached), "MMMM d, yyyy")}
                {latest.scripture && ` · ${latest.scripture}`}
              </p>
              {latest.description && (
                <div
                  className="mt-4 prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: latest.description }}
                />
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/sermons/$slug"
                  params={{ slug: latest.slug }}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-90"
                >
                  <Play className="h-4 w-4" /> Watch Sermon
                </Link>
                {latest.audio_url && (
                  <a
                    href={latest.audio_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-surface"
                  >
                    <Headphones className="h-4 w-4" /> Download Audio
                  </a>
                )}
                {latest.notes_pdf_url && (
                  <a
                    href={latest.notes_pdf_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-surface"
                  >
                    <Download className="h-4 w-4" /> Sermon Notes (PDF)
                  </a>
                )}
                <Link to="/sermons" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-surface">
                  All Sermons
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EVENTS PREVIEW */}
      <section className="container-x py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-sm font-semibold text-brand">What's coming up</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Upcoming Events</h2>
          </div>
          <Link to="/events" className="text-sm font-semibold text-brand hover:underline inline-flex items-center gap-1">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 md:p-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Calendar className="h-7 w-7" />
            </div>
            <p className="mt-6 text-lg md:text-xl text-foreground max-w-xl mx-auto">
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
          <div className="grid gap-6 md:grid-cols-3">
            {events.slice(0, 3).map((e) => (
              <article key={e.id} className="group rounded-2xl border border-border bg-card p-7 hover:border-brand/40 hover:shadow-lg transition">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                  <Calendar className="h-4 w-4" /> {e.date} · {e.time}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{e.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {e.location}
                </p>
                <Link to="/events/$eventId" params={{ eventId: e.id }} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Details <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MISSION BANNER */}
      <section className="container-x pb-20">
        <div className="rounded-3xl gradient-brand p-10 md:p-16 text-center text-brand-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Our Mission</p>
          <p className="mt-4 text-2xl md:text-3xl font-display font-semibold leading-snug max-w-3xl mx-auto">
            "To raise a peculiar generation that knows Jesus deeply, loves people genuinely, and lives boldly on purpose."
          </p>
        </div>
      </section>
    </PageShell>
  );
}
