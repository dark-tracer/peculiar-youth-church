import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/admin/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/admin-storage";
import { CHATBOT_CATEGORIES } from "@/lib/chatbot-match";
import { Plus, Edit, Trash2, Upload, Loader2, FileText, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/chatbot")({
  ssr: false,
  component: () => (
    <AdminGate>
      <ChatbotAdmin />
    </AdminGate>
  ),
});

type QAForm = {
  id?: string;
  question: string;
  answer: string;
  category: string;
  keywords: string;
};

const EMPTY_FORM: QAForm = { question: "", answer: "", category: "General", keywords: "" };

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value ?? "";
  }
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
    }
    return out;
  }
  throw new Error("Only PDF and DOCX files are supported.");
}

function ChatbotAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<QAForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docCategory, setDocCategory] = useState("General");
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["admin-chatbot-qa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_knowledge")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["admin-chatbot-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("id, file_name, file_url, category, uploaded_at")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: unanswered } = useQuery({
    queryKey: ["admin-chatbot-unanswered"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unanswered_questions")
        .select("*")
        .order("asked_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pendingCount = useMemo(
    () => (unanswered ?? []).filter((q) => q.status === "pending").length,
    [unanswered],
  );

  function openForm(next: QAForm) {
    setForm(next);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  async function saveQA(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    };
    const { error } = form.id
      ? await supabase.from("chatbot_knowledge").update(payload).eq("id", form.id)
      : await supabase.from("chatbot_knowledge").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Q&A updated" : "Q&A added");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["admin-chatbot-qa"] });
  }

  async function deleteQA(id: string) {
    const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Q&A deleted");
    qc.invalidateQueries({ queryKey: ["admin-chatbot-qa"] });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const text = await extractText(file);
      const { url } = await uploadFile("knowledge-docs", file);
      const { error } = await supabase.from("knowledge_documents").insert({
        file_name: file.name,
        file_url: url,
        extracted_text: text.replace(/\s+/g, " ").trim(),
        category: docCategory,
      });
      if (error) throw error;
      toast.success(`"${file.name}" added to the knowledge base`);
      qc.invalidateQueries({ queryKey: ["admin-chatbot-docs"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteDoc(id: string) {
    const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Document removed");
    qc.invalidateQueries({ queryKey: ["admin-chatbot-docs"] });
  }

  async function setStatus(id: string, status: "pending" | "resolved") {
    const { error } = await supabase.from("unanswered_questions").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-chatbot-unanswered"] });
    qc.invalidateQueries({ queryKey: ["admin-unanswered-count"] });
  }

  const inputCls =
    "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.68_0.20_40)]/50";

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">Chatbot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage what the Peculiar Youth assistant knows and review questions it could not answer.
        </p>
      </header>

      {/* ---------- Section 1: Q&A Manager ---------- */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold">Q&amp;A Manager</h2>
          <button
            onClick={() => openForm({ ...EMPTY_FORM })}
            className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] px-4 py-2 text-sm font-semibold text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
          >
            <Plus className="h-4 w-4" /> Add Q&amp;A
          </button>
        </div>

        {form && (
          <div ref={formRef} className="mb-4 rounded-xl border border-border bg-card p-5">
            <form onSubmit={saveQA} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question</label>
                <input
                  required value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Answer</label>
                <textarea
                  required rows={4} value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputCls}
                  >
                    {CHATBOT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Keywords (comma separated)</label>
                  <input
                    value={form.keywords} placeholder="service, time, sunday"
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] px-4 py-2 text-sm font-semibold text-[oklch(0.10_0.01_250)] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
                <button type="button" onClick={() => setForm(null)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Question</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Answer</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
                {!isLoading && (entries?.length ?? 0) === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No Q&amp;A pairs yet.</td></tr>
                )}
                {entries?.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold">{e.question}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground max-w-md truncate">{e.answer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.category}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          aria-label="Edit"
                          onClick={() => openForm({
                            id: e.id, question: e.question, answer: e.answer,
                            category: e.category ?? "General", keywords: (e.keywords ?? []).join(", "),
                          })}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button aria-label="Delete" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this Q&amp;A?</AlertDialogTitle>
                              <AlertDialogDescription>"{e.question}" will be removed from the chatbot.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteQA(e.id)}>Delete</AlertDialogAction>
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
      </section>

      {/* ---------- Section 2: Document Upload ---------- */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Document Upload</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className={inputCls}>
                {CHATBOT_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-2.5 text-sm hover:bg-muted">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Extracting text…" : "Upload PDF or DOCX"}
              <input
                ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
            </label>
          </div>

          <ul className="mt-5 divide-y divide-border">
            {(documents?.length ?? 0) === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">No documents uploaded yet.</li>
            )}
            {documents?.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{d.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.category} · {format(new Date(d.uploaded_at), "MMM d, yyyy")}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button aria-label="Delete document" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                      <AlertDialogDescription>The chatbot will stop using "{d.file_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteDoc(d.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Section 3: Unanswered Questions ---------- */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
          Unanswered Questions
          {pendingCount > 0 && (
            <span className="rounded-full bg-[oklch(0.68_0.20_40)] px-2 py-0.5 text-[11px] font-bold text-[oklch(0.10_0.01_250)]">
              {pendingCount} pending
            </span>
          )}
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Question</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date Asked</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(unanswered?.length ?? 0) === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Nothing here — the chatbot has answered every question so far.
                  </td></tr>
                )}
                {unanswered?.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{q.question_text}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {format(new Date(q.asked_at), "MMM d, yyyy p")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        q.status === "resolved"
                          ? "bg-[oklch(0.30_0.10_150)] text-[oklch(0.85_0.15_150)]"
                          : "bg-[oklch(0.30_0.05_85)] text-[oklch(0.85_0.15_85)]"
                      }`}>{q.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          onClick={() => openForm({ ...EMPTY_FORM, question: q.question_text })}
                          className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
                        >
                          <Plus className="mr-1 inline h-3 w-3" /> Add to Knowledge Base
                        </button>
                        {q.status === "pending" ? (
                          <button
                            onClick={() => setStatus(q.id, "resolved")}
                            className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
                          >
                            <Check className="mr-1 inline h-3 w-3" /> Mark Resolved
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatus(q.id, "pending")}
                            className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
                          >
                            <X className="mr-1 inline h-3 w-3" /> Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
