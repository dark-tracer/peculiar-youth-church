import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ?? "bernieamponsah12@gmail.com"
).toLowerCase();

async function ensureSuperAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("email,status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (
    !profile ||
    profile.status !== "active" ||
    (profile.email ?? "").toLowerCase() !== SUPER_ADMIN_EMAIL
  ) {
    throw new Error("Forbidden: super admin only");
  }
  return supabaseAdmin;
}

export interface EditorRow {
  id: string;
  email: string | null;
  full_name: string | null;
  status: "active" | "disabled";
  created_at: string;
  last_sign_in_at: string | null;
}

export const listEditors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EditorRow[]> => {
    const admin = await ensureSuperAdmin(context.userId);
    const { data: roleRows, error: rErr } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "editor");
    if (rErr) throw new Error(rErr.message);
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];

    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id,email,full_name,status,created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);

    // Best-effort last_sign_in lookup via auth admin
    const out: EditorRow[] = [];
    for (const p of profiles ?? []) {
      let last: string | null = null;
      try {
        const { data: u } = await admin.auth.admin.getUserById(p.id);
        last = u.user?.last_sign_in_at ?? null;
      } catch {
        // ignore
      }
      out.push({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        status: (p.status as "active" | "disabled") ?? "active",
        created_at: p.created_at,
        last_sign_in_at: last,
      });
    }
    return out;
  });

export const inviteEditor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { email: string; firstName: string; lastName: string }) => {
      if (!d.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Valid email is required");
      if (!d.firstName?.trim() || !d.lastName?.trim())
        throw new Error("First and last name are required");
      if (d.email.toLowerCase() === SUPER_ADMIN_EMAIL)
        throw new Error("That email is reserved for the super admin");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const admin = await ensureSuperAdmin(context.userId);
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: fullName },
    });
    if (error) throw new Error(error.message);

    if (invited.user) {
      // The handle_new_user trigger created the profile + editor role.
      // Stamp full_name + created_by here (trigger has no invitation context).
      await admin
        .from("profiles")
        .update({ full_name: fullName, created_by: context.userId })
        .eq("id", invited.user.id);
    }
    return { ok: true };
  });

export const setEditorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { editorId: string; status: "active" | "disabled" }) => {
    if (!d.editorId) throw new Error("editorId required");
    if (d.status !== "active" && d.status !== "disabled")
      throw new Error("Invalid status");
    return d;
  })
  .handler(async ({ data, context }) => {
    const admin = await ensureSuperAdmin(context.userId);

    const { error: pErr } = await admin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.editorId);
    if (pErr) throw new Error(pErr.message);

    // Also ban/unban at auth layer to block immediate re-login
    try {
      await admin.auth.admin.updateUserById(data.editorId, {
        ban_duration: data.status === "disabled" ? "876000h" : "none",
      } as unknown as { ban_duration: string });
    } catch {
      // ignore — RLS-level status check still excludes them
    }
    return { ok: true };
  });

export const deleteEditor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { editorId: string }) => {
    if (!d.editorId) throw new Error("editorId required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const admin = await ensureSuperAdmin(context.userId);
    const { error } = await admin.auth.admin.deleteUser(data.editorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
