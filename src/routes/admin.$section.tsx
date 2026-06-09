import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ArrowLeft } from "lucide-react";

// Catch-all for any /admin/<slug> route not handled by a dedicated file.
export const Route = createFileRoute("/admin/$section")({
  ssr: false,
  component: NotFound,
});

function NotFound() {
  const { section } = Route.useParams();
  return (
    <AdminShell>
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <h1 className="text-2xl font-display font-bold">Section not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">No admin module exists at "{section}".</p>
      </div>
    </AdminShell>
  );
}
