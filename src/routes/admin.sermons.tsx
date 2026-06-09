import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Eye, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
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

export const Route = createFileRoute("/admin/sermons")({
  ssr: false,
  component: SermonsAdmin,
});

async function fetchSermons() {
  const { data, error } = await supabase
    .from("sermons")
    .select("id, title, preacher_name, date_preached, series_name, status, featured")
    .order("date_preached", { ascending: false });
  if (error) throw error;
  return data;
}

function SermonsAdmin() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-sermons"], queryFn: fetchSermons });

  async function onDelete(id: string) {
    const { error } = await supabase.from("sermons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sermon deleted");
    qc.invalidateQueries({ queryKey: ["admin-sermons"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Sermons</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your sermon library.</p>
        </div>
        <Link
          to="/admin/sermons/new"
          className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)]"
        >
          <Plus className="h-4 w-4" /> New Sermon
        </Link>
      </header>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Preacher</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Series</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && (!data || data.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No sermons yet. <Link to="/admin/sermons/new" className="text-[oklch(0.68_0.20_40)] underline">Add the first one</Link>.
                </td></tr>
              )}
              {data?.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.featured && <Star className="h-3.5 w-3.5 fill-[oklch(0.85_0.15_85)] text-[oklch(0.85_0.15_85)]" />}
                      <span className="font-semibold">{s.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{s.preacher_name}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {s.date_preached ? format(new Date(s.date_preached), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.series_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                      s.status === "published"
                        ? "bg-[oklch(0.30_0.10_150)] text-[oklch(0.85_0.15_150)]"
                        : "bg-[oklch(0.30_0.05_85)] text-[oklch(0.85_0.15_85)]"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {s.status === "published" && (
                        <a
                          href={`/sermons/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          aria-label="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <Link
                        to="/admin/sermons/$id"
                        params={{ id: s.id }}
                        className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {role === "super_admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete sermon?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove "{s.title}". This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(s.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
