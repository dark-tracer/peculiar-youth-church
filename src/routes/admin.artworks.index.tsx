import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/artworks/")({
  ssr: false,
  component: ArtworksAdmin,
});

function ArtworksAdmin() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id, slug, title, artist_name, category, image_url, featured, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onDelete(id: string) {
    const { error } = await supabase.from("artworks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Artwork deleted");
    qc.invalidateQueries({ queryKey: ["admin-artworks"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Digital Artworks</h1>
          <p className="text-sm text-muted-foreground mt-1">Posters, wallpapers, and visual scripture art.</p>
        </div>
        <Link to="/admin/artworks/new"
          className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)]">
          <Plus className="h-4 w-4" /> New Artwork
        </Link>
      </header>

      {isLoading && <p className="text-center text-muted-foreground py-12">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No artworks yet. <Link to="/admin/artworks/new" className="text-[oklch(0.68_0.20_40)] underline">Upload the first one</Link>.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.map((a) => (
          <div key={a.id} className="group rounded-xl border border-border bg-card overflow-hidden">
            <div className="relative aspect-square bg-muted">
              {a.image_url && <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" />}
              {a.featured && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-2 py-0.5 text-[10px] font-semibold">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              <span className={`absolute top-2 right-2 inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                a.status === "published"
                  ? "bg-[oklch(0.30_0.10_150)] text-[oklch(0.85_0.15_150)]"
                  : "bg-[oklch(0.30_0.05_85)] text-[oklch(0.85_0.15_85)]"
              }`}>{a.status}</span>
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground truncate">{a.category ?? "—"}</p>
              <div className="mt-2 flex items-center gap-1">
                {a.status === "published" && (
                  <a href={`/artworks#${a.slug}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Preview">
                    <Eye className="h-4 w-4" />
                  </a>
                )}
                <Link to="/admin/artworks/$id" params={{ id: a.id }}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Edit">
                  <Edit className="h-4 w-4" />
                </Link>
                {(role === "super_admin" || role === "admin") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive ml-auto" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete artwork?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove "{a.title}".</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(a.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
