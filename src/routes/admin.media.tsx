import { AdminGate } from "@/components/admin/AdminGate";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/admin-storage";
import { Upload, Trash2, Copy, Loader2, Image as ImageIcon, FileText, Film } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/media")({
  ssr: false,
  component: () => (<AdminGate><MediaLibrary /></AdminGate>),
});

function formatBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string | null) {
  if (!mime) return FileText;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Film;
  return FileText;
}

function MediaLibrary() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function handleUpload(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const { path, url } = await uploadFile("media-library", file);
      const { error } = await supabase.from("media").insert({
        name: file.name,
        url,
        bucket: "media-library",
        path,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: user.id,
        content_type: file.type || null,
      });
      if (error) throw error;
      toast.success("File uploaded");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string, bucket: string, path: string) {
    await supabase.storage.from(bucket).remove([path]);
    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("File deleted");
    qc.invalidateQueries({ queryKey: ["admin-media"] });
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Shared uploads — paste these URLs anywhere on the site.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)] cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload File"}
          <input type="file" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </label>
      </header>

      {isLoading && <p className="text-center text-muted-foreground py-12">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          No files uploaded yet. Click "Upload File" to add the first one.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {data?.map((m) => {
          const Icon = iconFor(m.mime_type);
          const isImg = m.mime_type?.startsWith("image/");
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden group">
              <div className="relative aspect-square bg-muted flex items-center justify-center">
                {isImg ? (
                  <img src={m.url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Icon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" title={m.name}>{m.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatBytes(m.size_bytes)} · {format(new Date(m.created_at), "MMM d")}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <button onClick={() => copyUrl(m.url)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/70">
                    <Copy className="h-3 w-3" /> Copy URL
                  </button>
                  {role === "super_admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive" aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete file?</AlertDialogTitle>
                          <AlertDialogDescription>"{m.name}" will be removed from storage and any pages using it will break.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(m.id, m.bucket, m.path)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
