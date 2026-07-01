import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Field, TAG_PRESETS } from "@/components/admin/FormField";
import { TagSelector } from "@/components/admin/TagSelector";
import { uploadFile, uploadGatedFile, slugify } from "@/lib/admin-storage";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export interface SermonFormValues {
  id?: string;
  title: string;
  preacher_name: string;
  date_preached: string;
  scripture: string;
  series_name: string;
  description: string;
  video_url: string;
  audio_url: string;
  notes_pdf_url: string;
  thumbnail_url: string;
  tags: string[];
  status: "draft" | "published";
  featured: boolean;
}

const empty: SermonFormValues = {
  title: "",
  preacher_name: "",
  date_preached: new Date().toISOString().slice(0, 10),
  scripture: "",
  series_name: "",
  description: "",
  video_url: "",
  audio_url: "",
  notes_pdf_url: "",
  thumbnail_url: "",
  tags: [],
  status: "draft",
  featured: false,
};

interface Props {
  initial?: Partial<SermonFormValues> & { id?: string };
  onSaved?: () => void;
}

export function SermonForm({ initial, onSaved }: Props) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState<SermonFormValues>({ ...empty, ...initial });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setV({ ...empty, ...initial });
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof SermonFormValues>(k: K, val: SermonFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  async function handleUpload(field: "thumbnail_url" | "audio_url" | "notes_pdf_url", bucket: string, file: File) {
    setUploading(field);
    try {
      if (field === "thumbnail_url") {
        const { url } = await uploadFile(bucket, file);
        set(field, url);
      } else {
        const { path } = await uploadGatedFile(bucket as "sermon-audio" | "sermon-pdfs", file);
        set(field, path);
      }
      toast.success("File uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !v.preacher_name.trim() || !v.date_preached) {
      toast.error("Title, preacher, and date are required");
      return;
    }
    if (v.status === "published" && role !== "super_admin") {
      toast.error("Only Super Admins can publish content.");
      return;
    }
    setBusy(true);
    try {
      const slug = initial?.id ? undefined : `${slugify(v.title)}-${Date.now().toString(36).slice(-5)}`;
      const payload = {
        title: v.title.trim(),
        preacher_name: v.preacher_name.trim(),
        date_preached: v.date_preached,
        scripture: v.scripture || null,
        series_name: v.series_name || null,
        description: v.description || null,
        video_url: v.video_url || null,
        audio_url: v.audio_url || null,
        notes_pdf_url: v.notes_pdf_url || null,
        thumbnail_url: v.thumbnail_url || null,
        tags: v.tags,
        status: v.status,
        featured: v.featured,
      };

      if (initial?.id) {
        const { error } = await supabase.from("sermons").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Sermon updated");
      } else {
        const { error } = await supabase.from("sermons").insert({
          ...payload,
          slug: slug!,
          created_by: user!.id,
        });
        if (error) throw error;
        toast.success("Sermon created");
      }

      if (v.featured) {
        // unfeature siblings
        await supabase
          .from("sermons")
          .update({ featured: false })
          .neq("id", initial?.id ?? "00000000-0000-0000-0000-000000000000")
          .eq("featured", true);
      }

      if (onSaved) onSaved();
      else navigate({ to: "/admin/sermons" });
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
            <Field label="Sermon title" required>
              <Input value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Image: Knowing Who You Are" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preacher" required>
                <Input value={v.preacher_name} onChange={(e) => set("preacher_name", e.target.value)} required />
              </Field>
              <Field label="Date preached" required>
                <Input type="date" value={v.date_preached} onChange={(e) => set("date_preached", e.target.value)} required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Scripture reference">
                <Input value={v.scripture} onChange={(e) => set("scripture", e.target.value)} placeholder="Genesis 1:26-27" />
              </Field>
              <Field label="Series name">
                <Input value={v.series_name} onChange={(e) => set("series_name", e.target.value)} placeholder="Who Am I?" />
              </Field>
            </div>
            <Field label="Description / Summary">
              <RichTextEditor value={v.description} onChange={(html) => set("description", html)} placeholder="Write the sermon summary…" />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Media</h3>
            <Field label="Video URL (YouTube / Vimeo embed)">
              <Input value={v.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            </Field>

            <FileUploadField
              label="Audio file (MP3)"
              accept="audio/*"
              value={v.audio_url}
              uploading={uploading === "audio_url"}
              onClear={() => set("audio_url", "")}
              onPick={(f) => handleUpload("audio_url", "sermon-audio", f)}
            />
            <FileUploadField
              label="Sermon notes (PDF)"
              accept="application/pdf"
              value={v.notes_pdf_url}
              uploading={uploading === "notes_pdf_url"}
              onClear={() => set("notes_pdf_url", "")}
              onPick={(f) => handleUpload("notes_pdf_url", "sermon-pdfs", f)}
            />
            <FileUploadField
              label="Thumbnail image"
              accept="image/*"
              value={v.thumbnail_url}
              isImage
              uploading={uploading === "thumbnail_url"}
              onClear={() => set("thumbnail_url", "")}
              onPick={(f) => handleUpload("thumbnail_url", "sermon-thumbnails", f)}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Field label="Tags">
              <TagSelector
                options={TAG_PRESETS.sermon}
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
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Featured</Label>
                <p className="text-xs text-muted-foreground">Show at the top of the sermons page</p>
              </div>
              <Switch checked={v.featured} onCheckedChange={(c) => set("featured", c)} />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial?.id ? "Save changes" : "Create sermon"}
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function FileUploadField({
  label, accept, value, uploading, isImage, onPick, onClear,
}: {
  label: string;
  accept: string;
  value: string;
  uploading: boolean;
  isImage?: boolean;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {value ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-2">
          {isImage ? (
            <img src={value} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground truncate flex-1" title={value}>
              Uploaded: <code>{value}</code>
            </span>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Click to upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
          />
        </label>
      )}
    </div>
  );
}
