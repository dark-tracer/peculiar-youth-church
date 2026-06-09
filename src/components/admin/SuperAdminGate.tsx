import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

/**
 * Wrap any restricted admin page content. Editors and unauthenticated users
 * are redirected to /admin/not-authorized. While auth is loading, renders nothing.
 */
export function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== "super_admin") {
      navigate({ to: "/admin/not-authorized", replace: true });
    }
  }, [role, loading, navigate]);

  if (loading || role !== "super_admin") return null;
  return <>{children}</>;
}
