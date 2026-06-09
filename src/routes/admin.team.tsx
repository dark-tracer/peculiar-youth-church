import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/admin-storage";
import { Plus, Edit, Trash2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/team")({
  ssr: false,
  component: TeamAdmin,
});

interface TeamValues {
  id?: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  instagram: string;
  twitter: string;
  linkedin: string;
}

const empty: TeamValues = { name: "", title: "", bio: "", photo_url: "", instagram: "", twitter: "", linkedin: "" };

function TeamAdmin() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TeamValues | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onDelete(id: string) {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Team member removed");
    qc.invalidateQueries({ queryKey: ["admin-team"] });
  }

  function openEdit(m: typeof data extends (infer U)[] | undefined ? U : never) {
    const social = (m.social_links as Record<string, string> | null) ?? {};
    setEditing({
      id: m.id,
      name: m.name,
      title: m.title ?? "",
      bio: m.bio ?? "",
      photo_url: m.photo_url ?? "",
      instagram: social.instagram ?? "",
      twitter: social.twitter ?? "",
      linkedin: social.linkedin ?? "",
    });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Pastors, leaders, and ministry staff.</p>
        </div>
        <button onClick={() => setEditing({ ...empty })}
          className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)]">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </header>

      {isLoading && <p className="text-center text-muted-foreground py-12">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          No team members yet. Click "Add Member" to get started.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="aspect-[4/3] bg-muted relative">
              {m.photo_url && <img src={m.photo_url} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <p className="font-bold">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.title ?? "—"}</p>
              {m.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{m.bio}</p>}
              <div className="mt-3 flex items-center gap-1">
                <button onClick={() => openEdit(m)} className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs hover:bg-muted/70">
                  <Edit className="h-3 w-3" /> Edit
                </button>
                {role === "super_admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="ml-auto p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>"{m.name}" will be removed from the site.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(m.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <TeamDialog
        value={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-team"] }); }}
      />
    </AdminShell>
  );
}

function TeamDialog({ value, onClose, onSaved }: { value: TeamValues | null; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  if (!value) return null;
  const [v, setV] = useStateInit(value);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("team-photos", file);
      setV({ ...v, photo_url: url });
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      const payload = {
        name: v.name.trim(),
        title: v.title || null,
        bio: v.bio || null,
        photo_url: v.photo_url || null,
        social_links: {
          ...(v.instagram && { instagram: v.instagram }),
          ...(v.twitter && { twitter: v.twitter }),
          ...(v.linkedin && { linkedin: v.linkedin }),
        },
      };
      if (v.id) {
        const { error } = await supabase.from("team_members").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_members").insert(payload);
        if (error) throw error;
      }
      toast.success("Saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{v.id ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Photo</Label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-muted shrink-0">
                {v.photo_url && <img src={v.photo_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                </label>
                {v.photo_url && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setV({ ...v, photo_url: "" })}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Name <span className="text-[oklch(0.68_0.20_40)]">*</span></Label>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Title / Role</Label>
            <Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Lead Pastor, Youth Director" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Short bio</Label>
            <Textarea rows={3} value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Instagram</Label>
              <Input value={v.instagram} onChange={(e) => setV({ ...v, instagram: e.target.value })} placeholder="@handle" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Twitter / X</Label>
              <Input value={v.twitter} onChange={(e) => setV({ ...v, twitter: e.target.value })} placeholder="@handle" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">LinkedIn</Label>
              <Input value={v.linkedin} onChange={(e) => setV({ ...v, linkedin: e.target.value })} placeholder="URL" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy} className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Local helper: useState seeded once from the dialog's open value
function useStateInit<T>(initial: T): [T, (v: T) => void] {
  const [v, set] = useState<T>(initial);
  return [v, set];
}
