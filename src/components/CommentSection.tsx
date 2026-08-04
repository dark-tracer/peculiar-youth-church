import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Flag, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitComment, reportComment } from "@/lib/comments.functions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_LEN = 500;

type PublicComment = {
  id: string;
  commenter_name: string;
  comment_text: string;
  created_at: string;
};

export function CommentSection({
  contentType,
  contentId,
}: {
  contentType: "blog" | "article";
  contentId: string | undefined;
}) {
  const qc = useQueryClient();
  const send = useServerFn(submitComment);
  const report = useServerFn(reportComment);
  const mountedAt = useRef(Date.now());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);

  const queryKey = useMemo(() => ["comments", contentType, contentId], [contentType, contentId]);

  const { data: comments, isLoading } = useQuery({
    queryKey,
    enabled: !!contentId,
    queryFn: async (): Promise<PublicComment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, commenter_name, comment_text, created_at")
        .eq("content_type", contentType)
        .eq("content_id", contentId!)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contentId || busy) return;
    setBusy(true);
    try {
      await send({
        data: {
          contentType,
          contentId,
          name,
          email,
          comment: text,
          website,
          elapsedMs: Date.now() - mountedAt.current,
        },
      });
      setText("");
      toast.success("Comment posted. Thanks for joining the conversation!");
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post your comment.");
    } finally {
      setBusy(false);
    }
  }

  async function onReport(id: string) {
    try {
      await report({ data: { commentId: id } });
      toast.success("Thanks — our team will review this comment.");
    } catch {
      toast.error("Could not report this comment.");
    }
  }

  const remaining = MAX_LEN - text.length;
  const canSubmit = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && text.trim().length > 1 && remaining >= 0;

  return (
    <section className="mt-16 border-t border-border pt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2 text-2xl font-bold">
        <MessageSquare className="h-5 w-5 text-brand" aria-hidden="true" />
        Comments {comments && comments.length > 0 && <span className="text-muted-foreground text-lg">({comments.length})</span>}
      </h2>

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-name" className="text-sm font-medium">Full name</label>
            <input
              id="c-name" required value={name} onChange={(e) => setName(e.target.value)}
              maxLength={80} autoComplete="name"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <div>
            <label htmlFor="c-email" className="text-sm font-medium">
              Email address <span className="text-muted-foreground font-normal">(never shown publicly)</span>
            </label>
            <input
              id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              maxLength={255} autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Honeypot — hidden from humans, catches bots */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="c-website">Website</label>
          <input id="c-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="mt-4">
          <label htmlFor="c-text" className="text-sm font-medium">Comment</label>
          <textarea
            id="c-text" required rows={4} value={text} maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          />
          <div className={`mt-1 text-right text-xs ${remaining < 50 ? "text-brand" : "text-muted-foreground"}`}>
            {remaining} characters left
          </div>
        </div>

        <button
          type="submit" disabled={!canSubmit || busy}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post comment
        </button>
      </form>

      <div className="mt-8 space-y-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
        {!isLoading && (!comments || comments.length === 0) && (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
        )}
        {comments?.map((c) => (
          <article key={c.id} className="rounded-xl border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{c.commenter_name}</h3>
              <time dateTime={c.created_at} className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{c.comment_text}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand">
                  <Flag className="h-3 w-3" /> Report
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Report this comment as inappropriate?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Our team will review it and take action if it breaks our community guidelines.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onReport(c.id)}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </article>
        ))}
      </div>
    </section>
  );
}
