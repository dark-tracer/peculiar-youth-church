import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

type ViewInput = { contentType: "blog" | "article"; contentId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Records a unique view (one per visitor fingerprint per 24h) and returns
 * the current unique read count for the content.
 */
export const recordContentView = createServerFn({ method: "POST" })
  .inputValidator((data: ViewInput) => {
    if (!data || (data.contentType !== "blog" && data.contentType !== "article")) {
      throw new Error("Invalid content type");
    }
    if (typeof data.contentId !== "string" || !UUID_RE.test(data.contentId)) {
      throw new Error("Invalid content id");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const ua = getRequestHeader("user-agent") ?? "unknown";
    const visitorHash = await sha256(`${ip}::${ua}::${data.contentId}`);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from("content_views")
      .select("id")
      .eq("content_id", data.contentId)
      .eq("visitor_hash", visitorHash)
      .gte("viewed_at", since)
      .limit(1);

    let counted = false;
    if (!existing || existing.length === 0) {
      await supabaseAdmin.from("content_views").insert({
        content_type: data.contentType,
        content_id: data.contentId,
        visitor_hash: visitorHash,
      });
      counted = true;
    }

    const { data: row } = await supabaseAdmin
      .from("content_view_counts")
      .select("unique_view_count")
      .eq("content_id", data.contentId)
      .eq("content_type", data.contentType)
      .maybeSingle();

    const current = row?.unique_view_count ?? 0;
    const next = counted ? current + 1 : current;

    if (counted) {
      await supabaseAdmin.from("content_view_counts").upsert(
        {
          content_id: data.contentId,
          content_type: data.contentType,
          unique_view_count: next,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "content_id,content_type" },
      );
    }

    return { count: next };
  });
