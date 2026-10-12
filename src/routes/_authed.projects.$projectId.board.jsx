import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ErrorBoundary, PageLoader } from "@/components/common";

// LAZY ROUTE CONTENT: dnd-kit + board code download only when a board is opened.
const BoardView = lazy(() => import("@/features/board/BoardView"));

export const Route = createFileRoute("/_authed/projects/$projectId/board")({
  head: () => ({
    meta: [
      { title: "Board — Kanbanly" },
      { name: "description", content: "Drag tasks between columns on the project board." },
      { property: "og:title", content: "Board — Kanbanly" },
      { property: "og:description", content: "Drag tasks between columns on the project board." },
    ],
  }),
  component: BoardPage,
});

function BoardPage() {
  const { projectId } = Route.useParams();
  return (
    <ErrorBoundary title="The board crashed">
      <Suspense fallback={<PageLoader label="Loading board" />}>
        <BoardView projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}
