import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin/sermons")({
  ssr: false,
  component: () => (
    <AdminGate>
      <Outlet />
    </AdminGate>
  ),
});
