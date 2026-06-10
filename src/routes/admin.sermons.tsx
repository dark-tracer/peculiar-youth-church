import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SuperAdminGate } from "@/components/admin/SuperAdminGate";

export const Route = createFileRoute("/admin/sermons")({
  ssr: false,
  component: () => (
    <SuperAdminGate>
      <Outlet />
    </SuperAdminGate>
  ),
});
