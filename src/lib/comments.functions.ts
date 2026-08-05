import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SubmitInput = {
  contentType: "blog" | "article";
  contentId: string;
  name: string;
  email: string;
  comment: string;
  /** Honeypot field — must stay empty for real humans. */
  website?: string;
  /** Milliseconds the form was on screen before submit. */
  elapsedMs?: number;
};

/**
 * Public comment submission.
 * Spam protection without a paid/keyed captcha: honeypot field, minimum
 * time-on-form, per-visitor rate limiting, and link-count heuristics.
 * Writes go through SECURITY DEFINER database routines, so no service-role
 * key is required at runtime.
 */
export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((data: SubmitInput) => {
    if (!data) throw new Error("Invalid input");
    if (data.contentType !== "blog" && data.contentType !== "article") {
      throw new Error("Invalid content type");
    }
    if (!UUID_RE.test(String(data.contentId))) throw new Error("Invalid content id");

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
      name,
      email,
      comment,
      website: String(data.website ?? ""),
      elapsedMs: Number(data.elapsedMs ?? 0),
    };
  })
  .handler(async ({ data }) => {
    // Honeypot + too-fast submissions are silently accepted but never stored.
    if (data.website.trim().length > 0 || data.elapsedMs < 1500) {
      return { ok: true as const, skipped: true as const };
    }
    // Obvious link spam
    const linkCount = (data.comment.match(/https?:\/\//gi) ?? []).length;
    if (linkCount > 1) throw new Error("Comments cannot contain multiple links.");

    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();

    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const ua = getRequestHeader("user-agent") ?? "unknown";
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`comment::${ip}::${ua}`),
    );
    const visitorHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Rate limit: max 3 comments per visitor per 10 minutes.
    const { data: recent } = await client.rpc("recent_comment_count", {
      _visitor_hash: visitorHash,
    });
    if ((recent ?? 0) >= 3) {
      throw new Error("You're commenting too quickly. Please try again in a few minutes.");
    }

    // Records the throttle marker (also counts as a view row for this content).
    await client.rpc("record_content_view", {
      _content_type: data.contentType,
      _content_id: data.contentId,
      _visitor_hash: visitorHash,
    });

    const { data: id, error } = await client.rpc("submit_public_comment", {
      _content_type: data.contentType,
      _content_id: data.contentId,
      _name: data.name,
      _email: data.email,
      _comment: data.comment,
    });
    if (error) throw new Error(error.message);

    return { ok: true as const, skipped: false as const, id };
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
