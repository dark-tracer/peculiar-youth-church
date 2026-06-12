import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Long-form articles, columns, and editions." },
      { property: "og:title", content: "Articles — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Long-form articles, columns, and editions." },
    ],
  }),
  component: () => <Outlet />,
});
