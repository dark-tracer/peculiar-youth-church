import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Calendar, Clock, MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/events/$eventId")({
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", eventId)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Loading…</div></PageShell>;
  if (!event) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Event not found.</div></PageShell>;

  return (
    <PageShell>
      <section className="container-x py-16 max-w-3xl">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-brand font-semibold mb-8 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <div className="rounded-3xl gradient-brand text-brand-foreground p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Upcoming Event</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold">{event.title}</h1>
        </div>
        {event.cover_url && <img src={event.cover_url} alt={event.title} className="mt-8 w-full rounded-2xl object-cover aspect-[16/9]" />}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Calendar, label: "Date", value: format(new Date(event.start_at), "MMMM d, yyyy") },
            { icon: Clock, label: "Time", value: format(new Date(event.start_at), "h:mm a") },
            { icon: MapPin, label: "Location", value: event.location ?? "To be announced" },
          ].map((d) => (
            <div key={d.label} className="rounded-xl border border-border bg-card p-5">
              <d.icon className="h-5 w-5 text-brand" />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{d.label}</p>
              <p className="font-semibold">{d.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <h2 className="text-2xl font-bold">About this event</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{event.description ?? "More details will be shared soon."}</p>
        </div>
        {event.registration_url ? (
          <a href={event.registration_url} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-foreground hover:opacity-90">
            Register <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <Link to="/contact" className="mt-10 inline-flex rounded-full bg-brand px-6 py-3 font-semibold text-brand-foreground hover:opacity-90">
            Let us know you're coming
          </Link>
        )}
      </section>
    </PageShell>
  );
}
