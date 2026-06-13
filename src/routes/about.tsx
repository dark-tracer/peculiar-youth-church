import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, PageHero } from "@/components/PageShell";
import { Cross, Users, Compass, UserRound } from "lucide-react";
import { leaders } from "@/lib/data";
import g1 from "@/assets/g1.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Learn who we are, what we believe, and meet the leaders behind Peculiar Youth & Children Ministry." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHero eyebrow="About Us" title="A ministry built for the next generation." subtitle="We're a youth and children's church helping young people aged 10–19 find Jesus, friendship, and purpose." />

      <section className="container-x py-20 grid gap-12 md:grid-cols-2 items-center">
        <img src={g1} alt="Youth gathering" loading="lazy" width={800} height={800} className="rounded-3xl object-cover aspect-square" />
        <div>
          <span className="text-sm font-semibold text-brand">Who We Are</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">More than a youth group.</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Peculiar Youth & Children Ministry started with a simple conviction: young people don't need to be entertained, they need to be empowered. For over a decade we've been creating spaces where teens and kids meet Jesus in a real way, build friendships that outlast the season, and discover the unique calling on their lives.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every Sunday looks like worship, honest teaching, small group conversations, and a whole lot of laughter. You belong here.
          </p>
        </div>
      </section>

      <section className="bg-surface border-y border-border">
        <div className="container-x py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-brand">What We Believe</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Three things we're rooted in.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Cross, title: "Faith in Jesus", text: "We believe Jesus is the Son of God — alive, present, and personally interested in every young heart that comes through our doors." },
              { icon: Users, title: "Real Community", text: "Faith was never meant to be lived alone. We do life together — the highs, the lows, and everything in between." },
              { icon: Compass, title: "God-Given Purpose", text: "Every young person carries a calling. We help them discover it, develop it, and walk in it with confidence." },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl bg-card border border-border p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-brand-foreground">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand">Leadership</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">Our Youth Facilitators.</h2>
        </div>
        <TeamGrid />
      </section>
    </PageShell>
  );
}

function TeamGrid() {
  const { data: members } = useQuery({
    queryKey: ["about-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, title, bio, photo_url")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fall back to static leaders if no team members have been added yet.
  const list = members && members.length > 0
    ? members.map((m) => ({ id: m.id, name: m.name, title: m.title ?? "", photo_url: m.photo_url ?? "" }))
    : leaders.map((l) => ({ id: l.name, name: l.name, title: l.title, photo_url: "" }));

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {list.map((l) => (
        <div key={l.id} className="rounded-2xl overflow-hidden border border-border bg-card">
          <div className="aspect-square bg-surface grid place-items-center overflow-hidden">
            {l.photo_url ? (
              <img src={l.photo_url} alt={l.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full gradient-brand text-brand-foreground">
                <UserRound className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="p-6 text-center">
            <h3 className="font-semibold text-lg">{l.name}</h3>
            {l.title && <p className="text-sm text-brand">{l.title}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
