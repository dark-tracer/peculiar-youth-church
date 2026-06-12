import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bible-studies")({
  head: () => ({
    meta: [
      { title: "Bible Studies — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Discipleship lessons, scripture-based studies, and discussion guides." },
      { property: "og:title", content: "Bible Studies — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Discipleship lessons, scripture-based studies, and discussion guides." },
    ],
  }),
  component: () => <Outlet />,
});
