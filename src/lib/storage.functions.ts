import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_BUCKETS = new Set([
  "sermon-audio",
  "sermon-pdfs",
  "study-pdfs",
]);

/**
 * Returns a short-lived signed URL for a gated storage asset.
 * Requires an authenticated user; the URL is not persisted in the database.
 */
export const getGatedAssetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bucket: string; path: string }) => {
    if (!data || typeof data.bucket !== "string" || typeof data.path !== "string") {
      throw new Error("Invalid input");
    }
    if (!ALLOWED_BUCKETS.has(data.bucket)) {
      throw new Error("Bucket not allowed");
    }
    // Reject already-signed absolute URLs and path traversal
    if (/^https?:\/\//i.test(data.path) || data.path.includes("..")) {
      throw new Error("Invalid path");
    }
    return { bucket: data.bucket, path: data.path.replace(/^\/+/, "") };
  })
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from(data.bucket)
      .createSignedUrl(data.path, 300); // 5 minutes
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl };
  });
