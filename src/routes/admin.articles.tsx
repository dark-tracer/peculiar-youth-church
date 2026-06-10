import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/articles")({
  ssr: false,
  component: () => <Outlet />,
});
