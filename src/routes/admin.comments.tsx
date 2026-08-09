import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/admin/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2, Eye, ShieldCheck, Flag, Pin, PinOff, ListTree } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/comments")({
  ssr: false,
  component: () => (
    <AdminGate>
      <CommentsAdmin />
    </AdminGate>
  ),
});

type Row = {
  id: string;
  content_type: string;
  content_id: string;
  parent_comment_id: string | null;
  commenter_name: string;
  comment_text: string;
  is_flagged: boolean;
  is_pinned: boolean;
  reply_count: number;
  created_at: string;
};

function CommentsAdmin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "flagged" | "threads">("all");
  const [viewing, setViewing] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content_type, content_id, parent_comment_id, commenter_name, comment_text, is_flagged, is_pinned, reply_count, created_at")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: titles } = useQuery({
    queryKey: ["admin-comment-titles"],
    queryFn: async () => {
      const [blog, articles] = await Promise.all([
        supabase.from("blog_posts").select("id, title"),
        supabase.from("articles").select("id, title"),
      ]);
      const map: Record<string, string> = {};
      for (const b of blog.data ?? []) map[b.id] = b.title;
      for (const a of articles.data ?? []) map[a.id] = a.title;
      return map;
    },
  });

  const rows = useMemo(() => {
    const all = data ?? [];
    if (tab === "flagged") return all.filter((c) => c.is_flagged);
    if (tab === "threads") return all.filter((c) => !c.parent_comment_id);
    return all;
  }, [data, tab]);
  const flaggedCount = (data ?? []).filter((c) => c.is_flagged).length;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-comments"] });
    qc.invalidateQueries({ queryKey: ["admin-flagged-count"] });
  }

  async function softDelete(id: string) {
    const { error } = await supabase.from("comments").update({ is_deleted: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Comment removed from the site");
    refresh();
  }

  async function deleteThread(id: string) {
    const { error } = await supabase.rpc("delete_comment_thread", { _comment_id: id });
    if (error) return toast.error(error.message);
    toast.success("Thread and all replies deleted");
    refresh();
  }

  async function setPinned(id: string, pinned: boolean) {
    const { error } = await supabase.rpc("set_pinned_comment", { _comment_id: id, _pinned: pinned });
    if (error) return toast.error(error.message);
    toast.success(pinned ? "Comment pinned to the top" : "Comment unpinned");
    refresh();
  }

  async function resolveFlag(id: string) {
    const { error } = await supabase.from("comments").update({ is_flagged: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Flag cleared");
    refresh();
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every comment across blog posts and articles. Reader emails are stored privately and never shown here or publicly.
        </p>
      </header>

      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
        {(["all", "flagged", "threads"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              tab === t
                ? "bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All Comments" : t === "flagged" ? `Flagged Only${flaggedCount ? ` (${flaggedCount})` : ""}` : "Threads"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Content Title</th>
                <th className="px-4 py-3 font-semibold">Commenter</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Comment</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
                {tab === "threads" && <th className="px-4 py-3 font-semibold">Replies</th>}
                <th className="px-4 py-3 font-semibold">Pinned</th>
                <th className="px-4 py-3 font-semibold">Flagged</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  {tab === "flagged" ? "No flagged comments." : "No comments yet."}
                </td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">
                    {c.parent_comment_id && (
                      <span className="mr-1 inline-flex items-center text-[10px] uppercase tracking-wider text-muted-foreground">
                        <ListTree className="mr-1 h-3 w-3" /> reply
                      </span>
                    )}
                    {titles?.[c.content_id] ?? "—"}
                  </td>
                  <td className="px-4 py-3">{c.commenter_name}</td>
                  <td className="px-4 py-3 hidden md:table-cell max-w-xs truncate text-muted-foreground">{c.comment_text}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {format(new Date(c.created_at), "MMM d, yyyy")}
                  </td>
                  {tab === "threads" && <td className="px-4 py-3">{c.reply_count}</td>}
                  <td className="px-4 py-3">
                    {c.is_pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.68_0.20_40)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.20_40)]">
                        <Pin className="h-3 w-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.is_flagged ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.30_0.10_25)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.85_0.15_25)]">
                        <Flag className="h-3 w-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setViewing(c)} aria-label="View full comment"
                        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                      {!c.parent_comment_id && (
                        <button
                          onClick={() => setPinned(c.id, !c.is_pinned)}
                          aria-label={c.is_pinned ? "Unpin comment" : "Pin comment"}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {c.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                      )}
                      {c.is_flagged && (
                        <button onClick={() => resolveFlag(c.id)} aria-label="Resolve flag"
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      )}
                      {!c.parent_comment_id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive">
                              Delete Thread
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete this comment and all its replies permanently. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteThread(c.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button aria-label="Delete comment" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{c.parent_comment_id ? "Delete this reply?" : "Delete this comment?"}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {c.parent_comment_id
                                ? "Only this reply is removed. The parent comment and other replies stay in place."
                                : "It will be removed from the public page immediately."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => softDelete(c.id)}>Delete</AlertDialogAction>
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.commenter_name}</DialogTitle>
            <DialogDescription>
              {viewing && `${titles?.[viewing.content_id] ?? "Content"} · ${format(new Date(viewing.created_at), "MMM d, yyyy p")}`}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm leading-relaxed">{viewing?.comment_text}</p>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
