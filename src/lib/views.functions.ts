import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

type ViewInput = { contentType: "blog" | "article"; contentId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { createPublicServerClient } = await import("@/lib/supabase-public.server");
    const client = createPublicServerClient();

    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const ua = getRequestHeader("user-agent") ?? "unknown";
    const raw = `${ip}::${ua}::${data.contentId}`;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    const visitorHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: total, error } = await client.rpc("record_content_view", {
      _content_type: data.contentType,
      _content_id: data.contentId,
      _visitor_hash: visitorHash,
    });
    if (error) throw new Error(error.message);

    return { count: total ?? 0 };
  });
