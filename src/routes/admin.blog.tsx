import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/blog")({
  ssr: false,
  component: () => <Outlet />,
});
