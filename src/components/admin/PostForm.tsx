import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Field, TAG_PRESETS } from "@/components/admin/FormField";
import { TagSelector } from "@/components/admin/TagSelector";
import { uploadFile, slugify } from "@/lib/admin-storage";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export type PostKind = "blog" | "article";

export interface PostFormValues {
  id?: string;
  title: string;
  author_name: string;
  publish_date: string;
  excerpt: string;
  body: string;
  cover_url: string;
  category: string;        // blog only
  column_name: string;     // articles only
  edition_label: string;   // articles only
  tags: string[];
  status: "draft" | "published";
}

const empty: PostFormValues = {
  title: "",
  author_name: "",
  publish_date: new Date().toISOString().slice(0, 10),
  excerpt: "",
  body: "",
  cover_url: "",
  category: "",
  column_name: "",
  edition_label: "",
  tags: [],
  status: "draft",
};

interface Props {
  kind: PostKind;
  initial?: Partial<PostFormValues> & { id?: string };
  onSaved?: () => void;
}

export function PostForm({ kind, initial, onSaved }: Props) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const table = kind === "blog" ? "blog_posts" : "articles";
  const listRoute = kind === "blog" ? "/admin/blog" : "/admin/articles";

  const [v, setV] = useState<PostFormValues>({ ...empty, ...initial });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) setV({ ...empty, ...initial });
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof PostFormValues>(k: K, val: PostFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("post-covers", file);
      set("cover_url", url);
      toast.success("Cover uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !v.author_name.trim() || !v.publish_date) {
      toast.error("Title, author, and publish date are required");
      return;
    }
    if (v.status === "published" && role !== "super_admin") {
      toast.error("Only Super Admins can publish content.");
      return;
    }
    setBusy(true);
    try {
      const basePayload: Record<string, unknown> = {
        title: v.title.trim(),
        author_name: v.author_name.trim() || null,
        publish_date: v.publish_date,
        excerpt: v.excerpt || null,
        body: v.body || null,
        cover_url: v.cover_url || null,
        tags: v.tags,
        status: v.status,
      };
      if (kind === "blog") {
        basePayload.category = v.category || null;
      } else {
        basePayload.column_name = v.column_name || null;
        basePayload.edition_label = v.edition_label || null;
      }

      if (initial?.id) {
        const { error } = await supabase.from(table).update(basePayload as never).eq("id", initial.id);
        if (error) throw error;
        toast.success("Saved");
      } else {
        const slug = `${slugify(v.title)}-${Date.now().toString(36).slice(-5)}`;
        const { error } = await supabase.from(table).insert({
          ...basePayload,
          slug,
          created_by: user!.id,
        } as never);
        if (error) throw error;
        toast.success("Created");
      }

      if (onSaved) onSaved();
      else navigate({ to: listRoute });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }


  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Field label="Title" required>
              <Input value={v.title} onChange={(e) => set("title", e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author" required>
                <Input value={v.author_name} onChange={(e) => set("author_name", e.target.value)} required />
              </Field>
              <Field label="Publish date" required>
                <Input type="date" value={v.publish_date} onChange={(e) => set("publish_date", e.target.value)} required />
              </Field>
            </div>
            {kind === "blog" ? (
              <Field label="Category">
                <Input value={v.category} onChange={(e) => set("category", e.target.value)} placeholder="Devotional, Story, Announcement…" />
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Column name">
                  <Input value={v.column_name} onChange={(e) => set("column_name", e.target.value)} placeholder="The Foundation, Q&A…" />
                </Field>
                <Field label="Edition label">
                  <Input value={v.edition_label} onChange={(e) => set("edition_label", e.target.value)} placeholder="Issue 12, June 2026" />
                </Field>
              </div>
            )}
            <Field label="Excerpt / Summary">
              <Textarea value={v.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={3} placeholder="A short teaser that appears in lists." />
            </Field>
            <Field label="Body" required>
              <RichTextEditor value={v.body} onChange={(html) => set("body", html)} placeholder="Write the full content…" />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Field label="Tags">
              <TagSelector
                options={TAG_PRESETS[kind === "blog" ? "blog" : "article"]}
                value={v.tags}
                onChange={(next) => set("tags", next)}
              />
            </Field>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Publish</h3>
            <Field label="Status">
              <Select value={v.status} onValueChange={(val) => set("status", val as "draft" | "published")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published" disabled={role !== "super_admin"}>
                    Published {role !== "super_admin" && "(Super Admin only)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial?.id ? "Save changes" : "Create"}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold">Cover image</h3>
            {v.cover_url ? (
              <div className="space-y-2">
                <img src={v.cover_url} alt="" className="w-full aspect-[16/10] object-cover rounded-md border border-border" />
                <Button type="button" size="sm" variant="ghost" onClick={() => set("cover_url", "")}>
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Click to upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
                />
              </label>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
