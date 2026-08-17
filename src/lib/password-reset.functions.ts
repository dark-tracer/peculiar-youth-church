import { createServerFn } from "@tanstack/react-start";

/**
 * Returns whether an email belongs to an approved (active) console account.
 * Always call this from a UI that shows a generic message, so the endpoint
 * cannot be used to enumerate accounts.
 */
export const isApprovedConsoleEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => {
    if (!d?.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Valid email is required");
    return { email: d.email.trim().toLowerCase() };
  })
  .handler(async ({ data }): Promise<{ approved: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id,status")
      .ilike("email", data.email)
      .maybeSingle();

    if (!profile || profile.status !== "active") return { approved: false };

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);

    const approved = !!roles?.some((r) =>
      ["super_admin", "admin", "editor"].includes(r.role as unknown as string),
    );
    return { approved };
  });
