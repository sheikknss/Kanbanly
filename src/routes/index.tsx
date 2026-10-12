import { createFileRoute, redirect } from "@tanstack/react-router";

// "/" has no content of its own — send people to the dashboard.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanbanly — Collaborative Kanban board" },
      { name: "description", content: "Plan projects on drag-and-drop Kanban boards." },
      { property: "og:title", content: "Kanbanly — Collaborative Kanban board" },
      { property: "og:description", content: "Plan projects on drag-and-drop Kanban boards." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
