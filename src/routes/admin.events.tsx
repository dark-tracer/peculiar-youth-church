import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/events")({
  ssr: false,
  component: () => <Outlet />,
});