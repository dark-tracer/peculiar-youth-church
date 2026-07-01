import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Field } from "@/components/admin/FormField";
import { uploadFile, slugify } from "@/lib/admin-storage";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export interface StudyValues {
  id?: string;
  title: string;
  series_name: string;
  study_number: string;
  leader_name: string;
  scripture: string;
  objective: string;
  body: string;
  discussion_questions: string[];
  key_takeaway: string;
  pdf_url: string;
  resource_url: string;
  audience: string;
  status: "draft" | "published";
}

const empty: StudyValues = {
  title: "",
  series_name: "",
  study_number: "",
  leader_name: "",
  scripture: "",
  objective: "",
  body: "",
  discussion_questions: [],
  key_takeaway: "",
  pdf_url: "",
  resource_url: "",
  audience: "",
  status: "draft",
};

export function BibleStudyForm({ initial }: { initial?: Partial<StudyValues> & { id?: string } }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState<StudyValues>({ ...empty, ...initial });
  const [qInput, setQInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) setV({ ...empty, ...initial });
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof StudyValues>(k: K, val: StudyValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  async function handlePdfUpload(file: File) {
    setUploading(true);
    try {
      const { path } = await uploadGatedFile("study-pdfs", file);
      set("pdf_url", path);
      toast.success("PDF uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addQuestion() {
    const t = qInput.trim();
    if (!t) return;
    set("discussion_questions", [...v.discussion_questions, t]);
    setQInput("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !v.scripture.trim()) {
      toast.error("Title and scripture reference are required");
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
        series_name: v.series_name || null,
        study_number: v.study_number ? Number(v.study_number) : null,
        leader_name: v.leader_name || null,
        scripture: v.scripture || null,
        objective: v.objective || null,
        body: v.body || null,
        discussion_questions: v.discussion_questions,
        key_takeaway: v.key_takeaway || null,
        pdf_url: v.pdf_url || null,
        resource_url: v.resource_url || null,
        audience: v.audience || null,
        status: v.status,
      };
      if (initial?.id) {
        const { error } = await supabase.from("bible_studies").update(payload as never).eq("id", initial.id);
        if (error) throw error;
        toast.success("Saved");
      } else {
        const slug = `${slugify(v.title)}-${Date.now().toString(36).slice(-5)}`;
        const { error } = await supabase.from("bible_studies").insert({
          ...payload, slug, created_by: user!.id,
        } as never);
        if (error) throw error;
        toast.success("Created");
      }
      navigate({ to: "/admin/bible-studies" });
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
              <Field label="Series name">
                <Input value={v.series_name} onChange={(e) => set("series_name", e.target.value)} placeholder="Foundations of Faith" />
              </Field>
              <Field label="Study #">
                <Input type="number" value={v.study_number} onChange={(e) => set("study_number", e.target.value)} placeholder="1" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Leader">
                <Input value={v.leader_name} onChange={(e) => set("leader_name", e.target.value)} />
              </Field>
              <Field label="Audience">
                <Input value={v.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Teens, Young Adults" />
              </Field>
            </div>
            <Field label="Scripture reference" required>
              <Input value={v.scripture} onChange={(e) => set("scripture", e.target.value)} placeholder="Romans 12:1-2" required />
            </Field>
            <Field label="Objective">
              <Textarea value={v.objective} onChange={(e) => set("objective", e.target.value)} rows={2} placeholder="What participants will learn." />
            </Field>
            <Field label="Study body">
              <RichTextEditor value={v.body} onChange={(html) => set("body", html)} placeholder="Teaching notes, exposition…" />
            </Field>
            <Field label="Key takeaway">
              <Textarea value={v.key_takeaway} onChange={(e) => set("key_takeaway", e.target.value)} rows={2} />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Field label="Discussion questions">
              <div className="flex gap-2">
                <Input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuestion(); } }}
                  placeholder="Type a question and press Enter"
                />
                <Button type="button" variant="secondary" onClick={addQuestion}>Add</Button>
              </div>
              <ol className="mt-3 space-y-2 list-decimal list-inside text-sm">
                {v.discussion_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 group">
                    <span className="flex-1">{q}</span>
                    <button type="button" onClick={() => set("discussion_questions", v.discussion_questions.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ol>
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
            <Button type="submit" disabled={busy} className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial?.id ? "Save changes" : "Create"}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold">Study PDF</h3>
            {v.pdf_url ? (
              <div className="text-sm space-y-2">
                <a href={v.pdf_url} target="_blank" rel="noreferrer" className="block text-[oklch(0.68_0.20_40)] underline truncate">View PDF</a>
                <Button type="button" size="sm" variant="ghost" onClick={() => set("pdf_url", "")}>
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload PDF"}
                <input type="file" accept="application/pdf" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
              </label>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Field label="External resource link">
              <Input value={v.resource_url} onChange={(e) => set("resource_url", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
        </aside>
      </div>
    </form>
  );
}
