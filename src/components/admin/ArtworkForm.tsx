import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadFile, slugify } from "@/lib/admin-storage";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export interface ArtworkValues {
  id?: string;
  title: string;
  artist_name: string;
  description: string;
  scripture: string;
  image_url: string;
  category: string;
  tags: string[];
  allow_download: boolean;
  watermark: boolean;
  featured: boolean;
  status: "draft" | "published";
}

const empty: ArtworkValues = {
  title: "",
  artist_name: "Peculiar Youth Creative Team",
  description: "",
  scripture: "",
  image_url: "",
  category: "",
  tags: [],
  allow_download: true,
  watermark: false,
  featured: false,
  status: "draft",
};

export function ArtworkForm({ initial }: { initial?: Partial<ArtworkValues> & { id?: string } }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState<ArtworkValues>({ ...empty, ...initial });
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) setV({ ...empty, ...initial });
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof ArtworkValues>(k: K, val: ArtworkValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("artwork-images", file);
      set("image_url", url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || v.tags.includes(t)) return;
    set("tags", [...v.tags, t]);
    setTagInput("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !v.image_url) {
      toast.error("Title and image are required");
      return;
    }
    if (v.status === "published" && role !== "super_admin") {
      toast.error("Only Super Admins can publish content.");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: v.title.trim(),
        artist_name: v.artist_name || null,
        description: v.description || null,
        scripture: v.scripture || null,
        image_url: v.image_url,
        category: v.category || null,
        tags: v.tags,
        allow_download: v.allow_download,
        watermark: v.watermark,
        featured: v.featured,
        status: v.status,
      };
      if (initial?.id) {
        const { error } = await supabase.from("artworks").update(payload as never).eq("id", initial.id);
        if (error) throw error;
        toast.success("Saved");
      } else {
        const slug = `${slugify(v.title)}-${Date.now().toString(36).slice(-5)}`;
        const { error } = await supabase.from("artworks").insert({
          ...payload, slug, created_by: user!.id,
        } as never);
        if (error) throw error;
        toast.success("Created");
      }
      navigate({ to: "/admin/artworks" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}{required && <span className="text-[oklch(0.68_0.20_40)] ml-1">*</span>}</Label>
      {children}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Field label="Title" required>
              <Input value={v.title} onChange={(e) => set("title", e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Artist">
                <Input value={v.artist_name} onChange={(e) => set("artist_name", e.target.value)} />
              </Field>
              <Field label="Category">
                <Input value={v.category} onChange={(e) => set("category", e.target.value)} placeholder="Wallpaper, Poster, Flyer" />
              </Field>
            </div>
            <Field label="Scripture">
              <Input value={v.scripture} onChange={(e) => set("scripture", e.target.value)} placeholder="Psalm 23:1" />
            </Field>
            <Field label="Description">
              <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Story or inspiration behind the artwork." />
            </Field>
            <Field label="Tags">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Worship, Identity, Hope"
                />
                <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {v.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                    {t}
                    <button type="button" onClick={() => set("tags", v.tags.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
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
            <div className="flex items-center justify-between pt-1">
              <Label className="text-sm">Featured</Label>
              <Switch checked={v.featured} onCheckedChange={(c) => set("featured", c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Allow download</Label>
              <Switch checked={v.allow_download} onCheckedChange={(c) => set("allow_download", c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Watermark</Label>
              <Switch checked={v.watermark} onCheckedChange={(c) => set("watermark", c)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial?.id ? "Save changes" : "Create"}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold">Artwork image <span className="text-[oklch(0.68_0.20_40)]">*</span></h3>
            {v.image_url ? (
              <div className="space-y-2">
                <img src={v.image_url} alt="" className="w-full aspect-square object-cover rounded-md border border-border" />
                <Button type="button" size="sm" variant="ghost" onClick={() => set("image_url", "")}>
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Click to upload"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              </label>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
