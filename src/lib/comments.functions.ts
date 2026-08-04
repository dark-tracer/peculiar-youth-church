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

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Public comment submission.
 * Spam protection without a paid/keyed captcha: honeypot field, minimum
 * time-on-form, per-visitor rate limiting, and link-count heuristics.
 * (Swap in reCAPTCHA v3 here later by verifying a token before the insert.)
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const ua = getRequestHeader("user-agent") ?? "unknown";
    const visitorHash = await sha256(`comment::${ip}::${ua}`);

    // Rate limit: max 3 comments per visitor per 10 minutes (tracked in content_views)
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("content_views")
      .select("id", { count: "exact", head: true })
      .eq("visitor_hash", visitorHash)
      .gte("viewed_at", since);
    if ((count ?? 0) >= 3) {
      throw new Error("You're commenting too quickly. Please try again in a few minutes.");
    }
    await supabaseAdmin.from("content_views").insert({
      content_type: data.contentType,
      content_id: data.contentId,
      visitor_hash: visitorHash,
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("comments")
      .insert({
        content_type: data.contentType,
        content_id: data.contentId,
        commenter_name: data.name,
        commenter_email: data.email,
        comment_text: data.comment,
      })
      .select("id, commenter_name, comment_text, created_at, is_flagged")
      .single();

    if (error) throw new Error(error.message);
    return { ok: true as const, skipped: false as const, comment: inserted };
  });

/** Public "report this comment" action. */
export const reportComment = createServerFn({ method: "POST" })
  .inputValidator((data: { commentId: string }) => {
    if (!data || !UUID_RE.test(String(data.commentId))) throw new Error("Invalid comment id");
    return { commentId: data.commentId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("comments")
      .update({ is_flagged: true })
      .eq("id", data.commentId)
      .eq("is_deleted", false);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
