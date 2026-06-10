import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SuperAdminGate } from "@/components/admin/SuperAdminGate";

export const Route = createFileRoute("/admin/bible-studies")({
  ssr: false,
  component: () => (
    <SuperAdminGate>
      <Outlet />
    </SuperAdminGate>
  ),
});
