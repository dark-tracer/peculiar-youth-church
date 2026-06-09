import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "editor" | null;

export interface AuthState {
  user: User | null;
  role: AdminRole;
  fullName: string | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    fullName: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function loadRole(user: User | null) {
      if (!user) {
        if (mounted) setState({ user: null, role: null, fullName: null, loading: false });
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      const role: AdminRole =
        roles?.some((r) => r.role === "super_admin")
          ? "super_admin"
          : roles?.some((r) => r.role === "editor")
            ? "editor"
            : null;
      if (mounted)
        setState({ user, role, fullName: profile?.full_name ?? null, loading: false });
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
