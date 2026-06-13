import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin/AdminShell";
import { SuperAdminGate } from "@/components/admin/SuperAdminGate";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/admin-storage";
import {
  inviteEditor,
  listEditors,
  setEditorStatus,
  deleteEditor,
} from "@/lib/editors.functions";
import { Plus, Edit, Trash2, Loader2, Upload, X, UserPlus, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
  component: () => (
    <SuperAdminGate>
      <TeamAdmin />
    </SuperAdminGate>
  ),
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
  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage editor accounts and public-facing ministry team members.
        </p>
      </header>

      <EditorAccountsSection />
      <div className="h-10" />
      <MinistryTeamSection />
    </AdminShell>
  );
}

/* -------------------------------- Editor Accounts -------------------------------- */

function EditorAccountsSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listEditors);
  const inviteFn = useServerFn(inviteEditor);
  const statusFn = useServerFn(setEditorStatus);
  const deleteFn = useServerFn(deleteEditor);

  const { data: editors, isLoading } = useQuery({
    queryKey: ["admin-editors"],
    queryFn: () => listFn(),
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "admin">("editor");
  const [inviting, setInviting] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string; role: "editor" | "admin" } | null>(null);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("First name, last name, and email are required");
      return;
    }
    setInviting(true);
    try {
      const res = await inviteFn({ data: { firstName, lastName, email, role: inviteRole } });
      setCreatedCreds({ email: res.email, password: res.password, role: res.role });
      toast.success(`${res.role === "admin" ? "Admin" : "Editor"} account created. Share the login details below.`);
      setFirstName(""); setLastName(""); setEmail(""); setInviteRole("editor");
      setInviteOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-editors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setInviting(false);
    }
  }

  async function toggleStatus(id: string, current: "active" | "disabled") {
    const next = current === "active" ? "disabled" : "active";
    try {
      await statusFn({ data: { editorId: id, status: next } });
      toast.success(next === "disabled" ? "Editor disabled" : "Editor re-enabled");
      qc.invalidateQueries({ queryKey: ["admin-editors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function removeEditor(id: string) {
    try {
      await deleteFn({ data: { editorId: id } });
      toast.success("Editor removed");
      qc.invalidateQueries({ queryKey: ["admin-editors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="text-xl font-display font-bold">Team Accounts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">Editors</span> create drafts in Blog Posts, Articles, and Digital Artworks.{" "}
            <span className="font-semibold text-foreground">Admins</span> can additionally approve and publish posts and manage Bible Studies. Only the super admin can manage team accounts.
          </p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
        >
          <UserPlus className="h-4 w-4 mr-1" /> Add Team Member
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Date Added</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && (!editors || editors.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No team accounts yet.</td></tr>
              )}
              {editors?.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{e.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      e.role === "admin"
                        ? "bg-[oklch(0.68_0.20_40)]/15 text-[oklch(0.78_0.18_40)]"
                        : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {e.role === "admin" ? "Admin" : "Editor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(e.created_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      e.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {e.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(e.id, e.status)}
                      >
                        {e.status === "active" ? (
                          <><ShieldOff className="h-3.5 w-3.5 mr-1" /> Disable</>
                        ) : (
                          <><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Enable</>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this editor's access. Their content will remain.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeEditor(e.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Editor</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitInvite} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">First name <span className="text-[oklch(0.68_0.20_40)]">*</span></Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Last name <span className="text-[oklch(0.68_0.20_40)]">*</span></Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email <span className="text-[oklch(0.68_0.20_40)]">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Role <span className="text-[oklch(0.68_0.20_40)]">*</span></Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "editor" | "admin")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="editor">Editor — creates drafts (Blog, Articles, Artworks)</option>
                <option value="admin">Admin — approves &amp; publishes posts, manages Bible Studies</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              A login email and a random password will be generated. You'll see the credentials on the next screen — share them privately with the new team member.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={inviting}
                className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
              >
                {inviting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Create Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdCreds} onOpenChange={(o) => !o && setCreatedCreds(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{createdCreds?.role === "admin" ? "Admin" : "Editor"} login details</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Copy these now — the password won't be shown again. Share it with the editor through a secure channel.
          </p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdCreds?.email ?? ""} className="font-mono text-sm" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (createdCreds) {
                      navigator.clipboard.writeText(createdCreds.email);
                      toast.success("Email copied");
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Password</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdCreds?.password ?? ""} className="font-mono text-sm" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (createdCreds) {
                      navigator.clipboard.writeText(createdCreds.password);
                      toast.success("Password copied");
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setCreatedCreds(null)}
              className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </section>
  );
}

/* ----------------------------- Ministry Team Members ---------------------------- */

function MinistryTeamSection() {
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

  function openEdit(m: NonNullable<typeof data>[number]) {
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
    <section>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="text-xl font-display font-bold">Ministry Team Members</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Pastors, leaders, and ministry staff shown on the public site.</p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)]"
        >
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {isLoading && <p className="text-center text-muted-foreground py-8">Loading…</p>}
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
    </section>
  );
}

function TeamDialog({ value, onClose, onSaved }: { value: TeamValues | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {value && <TeamForm initial={value} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function TeamForm({ initial, onClose, onSaved }: { initial: TeamValues; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<TeamValues>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("team-photos", file);
      setV((p) => ({ ...p, photo_url: url }));
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
    <>
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
                <Button type="button" size="sm" variant="ghost" onClick={() => setV((p) => ({ ...p, photo_url: "" }))}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Name <span className="text-[oklch(0.68_0.20_40)]">*</span></Label>
          <Input value={v.name} onChange={(e) => setV((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Title / Role</Label>
          <Input value={v.title} onChange={(e) => setV((p) => ({ ...p, title: e.target.value }))} placeholder="Lead Pastor, Youth Director" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Short bio</Label>
          <Textarea rows={3} value={v.bio} onChange={(e) => setV((p) => ({ ...p, bio: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Instagram</Label>
            <Input value={v.instagram} onChange={(e) => setV((p) => ({ ...p, instagram: e.target.value }))} placeholder="@handle" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Twitter / X</Label>
            <Input value={v.twitter} onChange={(e) => setV((p) => ({ ...p, twitter: e.target.value }))} placeholder="@handle" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">LinkedIn</Label>
            <Input value={v.linkedin} onChange={(e) => setV((p) => ({ ...p, linkedin: e.target.value }))} placeholder="URL" />
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
    </>
  );
}
