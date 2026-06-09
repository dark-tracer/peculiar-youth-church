import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdminEmail } from "@/lib/super-admin";
import type { User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "editor" | null;
export type AdminStatus = "active" | "disabled" | null;

export interface AuthState {
  user: User | null;
  role: AdminRole;
  status: AdminStatus;
  fullName: string | null;
  email: string | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    status: null,
    fullName: null,
    email: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function loadRole(user: User | null) {
      if (!user) {
        if (mounted)
          setState({ user: null, role: null, status: null, fullName: null, email: null, loading: false });
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("full_name, email, status")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      const hasSuper = !!roles?.some((r) => r.role === "super_admin");
      const hasEditor = !!roles?.some((r) => r.role === "editor");
      const email = profile?.email ?? user.email ?? null;

      // Defense-in-depth: super_admin role is only honored when the email matches.
      let role: AdminRole = null;
      if (hasSuper && isSuperAdminEmail(email)) role = "super_admin";
      else if (hasEditor) role = "editor";

      const status = (profile?.status as AdminStatus) ?? "active";

      if (mounted)
        setState({
          user,
          role,
          status,
          fullName: profile?.full_name ?? null,
          email,
          loading: false,
        });
    }

    supabase.auth.getSession().then(({ data }) => loadRole(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadRole(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
