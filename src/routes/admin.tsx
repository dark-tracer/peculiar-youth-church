import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/admin/login" });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
  component: () => <Outlet />,
});
