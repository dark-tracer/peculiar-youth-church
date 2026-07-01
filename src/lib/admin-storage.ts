import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Upload a display asset (image) and return a long-lived signed URL that can
 * be embedded directly in <img src>. Only use for non-sensitive display media.
 */
export async function uploadFile(
  bucket: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (error) throw error;
  return { path, url: data.signedUrl };
}

/**
 * Upload a gated document (audio/PDF) and return only the storage PATH.
 * Signed URLs for these assets must be minted server-side at request time
 * for authenticated users via `getGatedAssetUrl`. Never persist signed URLs
 * for these buckets in the database.
 */
export async function uploadGatedFile(
  bucket: "sermon-audio" | "sermon-pdfs" | "study-pdfs",
  file: File,
): Promise<{ path: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) throw upErr;
  return { path };
}
