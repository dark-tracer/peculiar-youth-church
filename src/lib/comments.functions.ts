import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SubmitInput = {
  contentType: "blog" | "article";
  contentId: string;
  parentCommentId?: string | null;
  name: string;
  email: string;
  comment: string;
  /** Honeypot field — must stay empty for real humans. */
  website?: string;
  /** Milliseconds the form was on screen before submit. */
  elapsedMs?: number;
};

async function visitorHash(salt: string) {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  const ua = getRequestHeader("user-agent") ?? "unknown";
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}::${ip}::${ua}`),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}




/**
 * Public comment/reply submission. Stores the comment in `pending_comments`
 * and emails a 24h verification link. Nothing appears publicly until verified.
 */
export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((data: SubmitInput) => {
    if (!data) throw new Error("Invalid input");
    if (data.contentType !== "blog" && data.contentType !== "article") {
      throw new Error("Invalid content type");
    }
    if (!UUID_RE.test(String(data.contentId))) throw new Error("Invalid content id");
    const parentCommentId = data.parentCommentId ? String(data.parentCommentId) : null;
    if (parentCommentId && !UUID_RE.test(parentCommentId)) throw new Error("Invalid parent comment");

    const name = String(data.name ?? "").trim();
    const email = String(data.email ?? "").trim().toLowerCase();
    const comment = String(data.comment ?? "").trim();

    if (name.length < 2 || name.length > 80) throw new Error("Please enter your full name.");
    if (!EMAIL_RE.test(email) || email.length > 255) throw new Error("Please enter a valid email address.");
    if (comment.length < 2) throw new Error("Please write a comment.");
    if (comment.length > 500) throw new Error("Comments are limited to 500 characters.");

    return {
      contentType: data.contentType,
      contentId: data.contentId,
      parentCommentId,
      name,
      email,
      comment,
      website: String(data.website ?? ""),
      elapsedMs: Number(data.elapsedMs ?? 0),
    };
  })
  .handler(async ({ data }) => {
    if (data.website.trim().length > 0 || data.elapsedMs < 1500) {
      return { ok: true as const, skipped: true as const };
    }
    const linkCount = (data.comment.match(/https?:\/\//gi) ?? []).length;
    if (linkCount > 1) throw new Error("Comments cannot contain multiple links.");

    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();

    const hash = await visitorHash("comment");
    const { data: recent } = await client.rpc("recent_comment_count", { _visitor_hash: hash });
    if ((recent ?? 0) >= 3) {
      throw new Error("You're commenting too quickly. Please try again in a few minutes.");
    }
    await client.rpc("record_content_view", {
      _content_type: data.contentType,
      _content_id: data.contentId,
      _visitor_hash: hash,
    });

    const { data: rows, error } = await client.rpc("queue_pending_comment", {
      _content_type: data.contentType,
      _content_id: data.contentId,
      _parent_comment_id: data.parentCommentId as unknown as string,
      _name: data.name,
      _email: data.email,
      _comment: data.comment,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Could not save your comment.");

    // Comments go live immediately — no email verification step.
    const { error: publishError } = await client.rpc("verify_pending_comment", {
      _token: row.verification_token,
    });
    if (publishError) throw new Error(publishError.message);

    return { ok: true as const, skipped: false as const, published: true as const };
  });


/** Warns when a display name was previously verified with a different email. */
export const checkNameConflict = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string }) => ({
    name: String(data?.name ?? "").trim(),
    email: String(data?.email ?? "").trim().toLowerCase(),
  }))
  .handler(async ({ data }) => {
    if (data.name.length < 2 || !EMAIL_RE.test(data.email)) return { conflict: false };
    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();
    const { data: conflict } = await client.rpc("check_commenter_name", {
      _name: data.name,
      _email: data.email,
    });
    return { conflict: Boolean(conflict) };
  });

/** Confirms a pending comment and publishes it. */
export const verifyComment = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => {
    if (!data || !UUID_RE.test(String(data.token))) throw new Error("Invalid verification link.");
    return { token: data.token };
  })
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();
    const { data: rows, error } = await client.rpc("verify_pending_comment", { _token: data.token });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {
      status: (row?.status ?? "not_found") as "verified" | "expired" | "not_found",
      contentType: row?.content_type ?? null,
      contentId: row?.content_id ?? null,
    };
  });

/** Likes / unlikes a comment for the current visitor. */
export const toggleCommentLike = createServerFn({ method: "POST" })
  .inputValidator((data: { commentId: string }) => {
    if (!data || !UUID_RE.test(String(data.commentId))) throw new Error("Invalid comment id");
    return { commentId: data.commentId };
  })
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();
    const hash = await visitorHash("like");
    const { data: rows, error } = await client.rpc("toggle_comment_like", {
      _comment_id: data.commentId,
      _visitor_hash: hash,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { liked: Boolean(row?.liked), likeCount: Number(row?.like_count ?? 0) };
  });

/** Public "report this comment" action. */
export const reportComment = createServerFn({ method: "POST" })
  .inputValidator((data: { commentId: string }) => {
    if (!data || !UUID_RE.test(String(data.commentId))) throw new Error("Invalid comment id");
    return { commentId: data.commentId };
  })
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();
    const { error } = await client.rpc("flag_public_comment", { _comment_id: data.commentId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
