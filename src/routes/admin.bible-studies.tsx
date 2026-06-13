import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin/bible-studies")({
  ssr: false,
  component: () => (
    <AdminGate>
      <Outlet />
    </AdminGate>
  ),
});
