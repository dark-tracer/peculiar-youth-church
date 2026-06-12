import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm, toLocalInputValue } from "@/components/admin/EventForm";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/events/$id")({
  ssr: false,
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <Link to="/admin/events" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to events</Link>
      <h1 className="mb-6 font-display text-3xl font-bold">Edit Event</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !data && <p className="text-muted-foreground">Event not found.</p>}
      {data && <EventForm initial={{ ...data, start_at: toLocalInputValue(data.start_at), end_at: toLocalInputValue(data.end_at), description: data.description ?? "", location: data.location ?? "", cover_url: data.cover_url ?? "", registration_url: data.registration_url ?? "", contact_info: data.contact_info ?? "", status: data.status === "published" ? "published" : "draft" }} />}
    </AdminShell>
  );
}