import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdminEmail } from "@/lib/super-admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/admin/login" });
    }
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      supabase
        .from("profiles")
        .select("status,email,must_change_password")
        .eq("id", data.user.id)
        .maybeSingle(),
    ]);
    const hasSuper = !!roles?.some((r) => r.role === "super_admin");
    const hasAdmin = !!roles?.some((r) => (r.role as string) === "admin");
    const hasEditor = !!roles?.some((r) => r.role === "editor");
    const email = profile?.email ?? data.user.email;
    const authorized =
      (hasSuper && isSuperAdminEmail(email)) ||
      (hasAdmin && profile?.status === "active") ||
      (hasEditor && profile?.status === "active");


    if (!authorized) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }

    // Force first-login password change (skip if already on the change route)
    if (
      (profile as { must_change_password?: boolean } | null)?.must_change_password &&
      location.pathname !== "/admin/account" &&
      location.pathname !== "/admin/change-password"
    ) {
      throw redirect({ to: "/admin/change-password" });
    }
  },
  component: () => <Outlet />,
});
