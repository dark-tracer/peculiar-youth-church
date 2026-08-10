import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, Flag, Loader2, MessageSquare, Pin, Send, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitComment, reportComment, toggleCommentLike, checkNameConflict } from "@/lib/comments.functions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_LEN = 500;
const LIKE_KEY = "pyc-comment-likes";

type PublicComment = {
  id: string;
  parent_comment_id: string | null;
  commenter_name: string;
  comment_text: string;
  created_at: string;
  is_pinned: boolean;
  like_count: number;
  reply_count: number;
};

function readLikes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LIKE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

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
  const like = useServerFn(toggleCommentLike);
  const checkName = useServerFn(checkNameConflict);
  const mountedAt = useRef(Date.now());

  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => setLiked(readLikes()), []);

  const queryKey = useMemo(() => ["comments", contentType, contentId], [contentType, contentId]);

  const { data: comments, isLoading } = useQuery({
    queryKey,
    enabled: !!contentId,
    queryFn: async (): Promise<PublicComment[]> => {
      const { data, error } = await supabase.rpc("get_public_comments", {
        _content_type: contentType,
        _content_id: contentId!,
      });
      if (error) throw error;
      return (data ?? []) as PublicComment[];
    },
  });

  // Live like/reply counts without a page refresh.
  useEffect(() => {
    if (!contentId) return;
    const channel = supabase
      .channel(`comments-${contentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `content_id=eq.${contentId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId, qc, queryKey]);

  const topLevel = useMemo(() => {
    const list = (comments ?? []).filter((c) => !c.parent_comment_id);
    return [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [comments]);

  const repliesFor = (id: string) =>
    (comments ?? [])
      .filter((c) => c.parent_comment_id === id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  async function onLike(id: string) {
    const wasLiked = !!liked[id];
    setLiked((prev) => {
      const next = { ...prev, [id]: !wasLiked };
      if (!next[id]) delete next[id];
      try {
        window.localStorage.setItem(LIKE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    try {
      await like({ data: { commentId: id } });
      qc.invalidateQueries({ queryKey });
    } catch {
      toast.error("Could not register your like.");
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

  const total = comments?.length ?? 0;

  return (
    <section className="mt-16 border-t border-border pt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2 text-2xl font-bold">
        <MessageSquare className="h-5 w-5 text-brand" aria-hidden="true" />
        {total} {total === 1 ? "comment" : "comments"}
      </h2>

      <CommentForm
        key="root"
        busyLabel="Post comment"
        onSubmit={async (values) => {
          const res = await send({
            data: {
              contentType,
              contentId: contentId!,
              parentCommentId: null,
              ...values,
              elapsedMs: Date.now() - mountedAt.current,
            },
          });
          qc.invalidateQueries({ queryKey });
          return res;
        }}
        checkName={checkName}
        successMessage="Your comment is now live."
        disabled={!contentId}
      />


      <div className="mt-8 space-y-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
        {!isLoading && topLevel.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
        )}

        {topLevel.map((c) => {
          const replies = repliesFor(c.id);
          const open = !!expanded[c.id];
          return (
            <article key={c.id} className="rounded-xl border border-border bg-card/60 p-4">
              {c.is_pinned && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[oklch(0.68_0.20_40)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.20_40)]">
                  <Pin className="h-3 w-3" /> Pinned by Admin
                </span>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{c.commenter_name}</h3>
                <time dateTime={c.created_at} className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{c.comment_text}</p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <LikeButton liked={!!liked[c.id]} count={c.like_count} onClick={() => onLike(c.id)} />
                <button
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="hover:text-brand"
                >
                  Reply
                </button>
                {replies.length > 0 && (
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [c.id]: !open }))}
                    className="inline-flex items-center gap-1 font-medium hover:text-brand"
                    aria-expanded={open}
                  >
                    {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {replies.length} {replies.length === 1 ? "reply" : "replies"}
                  </button>
                )}
                <ReportButton onConfirm={() => onReport(c.id)} />
              </div>

              {open && replies.length > 0 && (
                <div className="mt-4 space-y-4 border-l-2 border-border pl-6" style={{ marginLeft: 0 }}>
                  {replies.map((r) => (
                    <div key={r.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold">{r.commenter_name}</h4>
                        <time dateTime={r.created_at} className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed">{r.comment_text}</p>
                      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                        <LikeButton liked={!!liked[r.id]} count={r.like_count} onClick={() => onLike(r.id)} />
                        <ReportButton onConfirm={() => onReport(r.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {replyTo === c.id && (
                <div className="mt-4 border-l-2 border-border pl-6">
                  <CommentForm
                    compact
                    busyLabel="Post reply"
                    onSubmit={async (values) => {
                      const res = await send({
                        data: {
                          contentType,
                          contentId: contentId!,
                          parentCommentId: c.id,
                          ...values,
                          elapsedMs: Date.now() - mountedAt.current,
                        },
                      });
                      setReplyTo(null);
                      qc.invalidateQueries({ queryKey });
                      return res;
                    }}
                    checkName={checkName}
                    successMessage="Your reply is now live."

                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function LikeButton({ liked, count, onClick }: { liked: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={liked}
      className={`inline-flex items-center gap-1 ${liked ? "text-brand" : "hover:text-brand"}`}
    >
      <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> {count}
    </button>
  );
}

function ReportButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center gap-1 hover:text-brand">
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
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type FormValues = { name: string; email: string; comment: string; website: string };

function CommentForm({
  onSubmit,
  checkName,
  successMessage,
  busyLabel,
  compact = false,
  disabled = false,
}: {
  onSubmit: (v: FormValues) => Promise<unknown>;
  checkName: (args: { data: { name: string; email: string } }) => Promise<{ conflict: boolean }>;
  successMessage: string;
  busyLabel: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [nameWarning, setNameWarning] = useState<string | null>(null);

  const remaining = MAX_LEN - text.length;
  const canSubmit =
    !disabled && name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && text.trim().length > 1 && remaining >= 0;

  async function verifyIdentity() {
    if (name.trim().length < 2 || !/\S+@\S+\.\S+/.test(email)) return;
    try {
      const res = await checkName({ data: { name: name.trim(), email: email.trim() } });
      setNameWarning(
        res.conflict
          ? `The name ${name.trim()} has been used before with a different email address. Please use your original email to keep your identity consistent, or choose a different name.`
          : null,
      );
    } catch {
      setNameWarning(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), comment: text.trim(), website });
      setText("");
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post your comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "mt-2" : "mt-6 rounded-2xl border border-border bg-card p-5 md:p-6"}
    >
      <div className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input
            required value={name} onChange={(e) => setName(e.target.value)} onBlur={verifyIdentity}
            maxLength={80} autoComplete="name"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
        <div>
          <label className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>Email address</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} onBlur={verifyIdentity}
            maxLength={255} autoComplete="email"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Your email is used only for comment verification and is never displayed publicly.
          </p>
        </div>
      </div>

      {nameWarning && (
        <p className="mt-3 rounded-md border border-[oklch(0.68_0.20_40)]/40 bg-[oklch(0.68_0.20_40)]/10 px-3 py-2 text-xs text-[oklch(0.68_0.20_40)]">
          {nameWarning}
        </p>
      )}

      {/* Honeypot — hidden from humans, catches bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium">{compact ? "Reply" : "Comment"}</label>
        <textarea
          required rows={compact ? 3 : 4} value={text} maxLength={MAX_LEN}
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
        {busyLabel}
      </button>
    </form>
  );
}
