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
        .select("status,email")
        .eq("id", data.user.id)
        .maybeSingle(),
    ]);
    const hasSuper = !!roles?.some((r) => r.role === "super_admin");
    const hasEditor = !!roles?.some((r) => r.role === "editor");
    const email = profile?.email ?? data.user.email;
    const authorized =
      (hasSuper && isSuperAdminEmail(email)) ||
      (hasEditor && profile?.status === "active");

    if (!authorized) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
  component: () => <Outlet />,
});
