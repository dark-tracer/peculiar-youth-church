import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/events/")({
  ssr: false,
  component: EventsAdmin,
});

function EventsAdmin() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, start_at, location, status, featured")
        .order("start_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onDelete(id: string) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    qc.invalidateQueries({ queryKey: ["public-events"] });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage church events shown on the live website.</p>
        </div>
        <Link to="/admin/events/new" className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] px-4 py-2 text-sm font-semibold text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Date</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Location</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && (!data || data.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No events yet. <Link to="/admin/events/new" className="text-[oklch(0.68_0.20_40)] underline">Create the first one</Link>.</td></tr>
              )}
              {data?.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[oklch(0.68_0.20_40)]" />{e.title}{e.featured ? " ★" : ""}</span></td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{format(new Date(e.start_at), "MMM d, yyyy h:mm a")}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{e.location ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${e.status === "published" ? "bg-[oklch(0.30_0.10_150)] text-[oklch(0.85_0.15_150)]" : "bg-[oklch(0.30_0.05_85)] text-[oklch(0.85_0.15_85)]"}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {e.status === "published" && <a href={`/events/${e.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Preview"><Eye className="h-4 w-4" /></a>}
                      <Link to="/admin/events/$id" params={{ id: e.id }} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
                      {role === "super_admin" && <AlertDialog><AlertDialogTrigger asChild><button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete event?</AlertDialogTitle><AlertDialogDescription>This will permanently remove "{e.title}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(e.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}