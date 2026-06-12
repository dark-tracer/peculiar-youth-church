import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Upcoming youth and children's events — camps, game nights, outreaches and more." },
    ],
  }),
  component: () => <Outlet />,
});
