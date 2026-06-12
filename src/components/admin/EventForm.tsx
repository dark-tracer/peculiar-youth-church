import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/FormField";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, slugify } from "@/lib/admin-storage";
import { useAuth } from "@/hooks/use-auth";

export interface EventValues {
  id?: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  cover_url: string;
  registration_url: string;
  contact_info: string;
  status: "draft" | "published";
  featured: boolean;
}

const empty: EventValues = {
  title: "",
  description: "",
  start_at: "",
  end_at: "",
  location: "",
  cover_url: "",
  registration_url: "",
  contact_info: "",
  status: "draft",
  featured: false,
};

function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function EventForm({ initial }: { initial?: Partial<EventValues> & { id?: string } }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState<EventValues>({ ...empty, ...initial });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) setV({ ...empty, ...initial });
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof EventValues>(k: K, val: EventValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("media-library", file);
      set("cover_url", url);
      toast.success("Event image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !v.start_at) {
      toast.error("Title and start date are required");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: v.title.trim(),
        description: v.description || null,
        start_at: new Date(v.start_at).toISOString(),
        end_at: toIsoOrNull(v.end_at),
        location: v.location || null,
        cover_url: v.cover_url || null,
        registration_url: v.registration_url || null,
        contact_info: v.contact_info || null,
        status: v.status,
        featured: v.featured,
      };
      if (initial?.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Event saved");
      } else {
        const { error } = await supabase.from("events").insert({
          ...payload,
          slug: `${slugify(v.title)}-${Date.now().toString(36).slice(-5)}`,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
        toast.success("Event created");
      }
      navigate({ to: "/admin/events" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <Field label="Title" required><Input value={v.title} onChange={(e) => set("title", e.target.value)} required /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Start" required><Input type="datetime-local" value={v.start_at} onChange={(e) => set("start_at", e.target.value)} required /></Field>
              <Field label="End"><Input type="datetime-local" value={v.end_at} onChange={(e) => set("end_at", e.target.value)} /></Field>
            </div>
            <Field label="Location"><Input value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="Church hall, park, online…" /></Field>
            <Field label="Description"><Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={7} /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Registration link"><Input value={v.registration_url} onChange={(e) => set("registration_url", e.target.value)} placeholder="https://…" /></Field>
              <Field label="Contact info"><Input value={v.contact_info} onChange={(e) => set("contact_info", e.target.value)} /></Field>
            </div>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">Publish</h3>
            <Field label="Status">
              <Select value={v.status} onValueChange={(val) => set("status", val as "draft" | "published")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured event</label>
            <Button type="submit" disabled={busy} className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              {initial?.id ? "Save changes" : "Create event"}
            </Button>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">Event image</h3>
            {v.cover_url ? <div className="space-y-2"><img src={v.cover_url} alt="" className="aspect-[16/10] w-full rounded-md border border-border object-cover" /><Button type="button" size="sm" variant="ghost" onClick={() => set("cover_url", "")}><X className="mr-1 h-4 w-4" /> Remove</Button></div> : <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:bg-muted/30">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? "Uploading…" : "Click to upload"}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} /></label>}
          </div>
        </aside>
      </div>
    </form>
  );
}

export { toLocalInputValue };