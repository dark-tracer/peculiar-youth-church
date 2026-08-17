import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export interface ResetRequestRow {
  id: string;
  email: string;
  status: string;
  created_at: string;
  handled_at: string | null;
  full_name: string | null;
  role: string | null;
}

async function assertAdmin(context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Pending + recent password reset requests, for the admin console. */
export const listResetRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResetRequestRow[]> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("password_reset_requests")
      .select("id,email,status,created_at,handled_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const emails = (rows ?? []).map((r) => r.email.toLowerCase());
    const { data: profiles } = emails.length
      ? await supabaseAdmin.from("profiles").select("id,email,full_name").in("email", emails)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = ids.length
      ? await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids)
      : { data: [] as { user_id: string; role: string }[] };

    return (rows ?? []).map((r) => {
      const p = (profiles ?? []).find((x) => (x.email ?? "").toLowerCase() === r.email.toLowerCase());
      const role = p ? (roles ?? []).find((x) => x.user_id === p.id)?.role ?? null : null;
      return {
        id: r.id,
        email: r.email,
        status: r.status,
        created_at: r.created_at,
        handled_at: r.handled_at,
        full_name: p?.full_name ?? null,
        role: (role as string | null) ?? null,
      };
    });
  });

/** Count of pending requests, for the sidebar badge. */
export const countPendingResetRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("password_reset_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return count ?? 0;
  });

/**
 * Admin sets a temporary password for a console account. The user is then
 * forced to choose their own password on next sign-in.
 */
export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId?: string; email: string; password: string }) => {
    if (!d?.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Valid email is required");
    if (!d.password || d.password.length < 8) throw new Error("Password must be at least 8 characters");
    return {
      requestId: d.requestId ?? null,
      email: d.email.trim().toLowerCase(),
      password: d.password,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id,email")
      .ilike("email", data.email)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("No console account with that email");

    const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: data.password,
    });
    if (uErr) throw new Error(uErr.message);

    const { error: mErr } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", profile.id);
    if (mErr) throw new Error(mErr.message);

    if (data.requestId) {
      await supabaseAdmin
        .from("password_reset_requests")
        .update({ status: "resolved", handled_by: context.userId, handled_at: new Date().toISOString() })
        .eq("id", data.requestId);
    } else {
      await supabaseAdmin
        .from("password_reset_requests")
        .update({ status: "resolved", handled_by: context.userId, handled_at: new Date().toISOString() })
        .eq("status", "pending")
        .ilike("email", data.email);
    }

    return { ok: true };
  });

/** Dismiss a request without changing the password. */
export const dismissResetRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("id required");
    return { id: d.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("password_reset_requests")
      .update({ status: "dismissed", handled_by: context.userId, handled_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
