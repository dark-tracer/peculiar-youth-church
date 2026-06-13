import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

/**
 * Allows both Super Admin and Admin roles. Editors and unauthenticated users
 * are redirected to /admin/not-authorized.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = role === "super_admin" || role === "admin";

  useEffect(() => {
    if (!loading && !allowed) {
      navigate({ to: "/admin/not-authorized", replace: true });
    }
  }, [allowed, loading, navigate]);

  if (loading || !allowed) return null;
  return <>{children}</>;
}
