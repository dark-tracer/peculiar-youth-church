import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sermons")({
  head: () => ({
    meta: [
      { title: "Sermons — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Browse our latest sermons and download notes." },
    ],
  }),
  component: () => <Outlet />,
});
