import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Stories, devotionals, and announcements from our ministry." },
      { property: "og:title", content: "Blog — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Stories, devotionals, and announcements from our ministry." },
    ],
  }),
  component: () => <Outlet />,
});
