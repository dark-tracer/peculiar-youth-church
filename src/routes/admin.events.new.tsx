import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";

export const Route = createFileRoute("/admin/events/new")({
  ssr: false,
  component: NewEvent,
});

function NewEvent() {
  return (
    <AdminShell>
      <Link to="/admin/events" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold">New Event</h1>
      <EventForm />
    </AdminShell>
  );
}