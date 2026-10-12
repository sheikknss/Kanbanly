import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { selectProjectById } from "@/store/redux/workspaceSlice";
import { ColorDot, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks";
import { useUIStore } from "@/store/zustand/uiStore";

/**
 * NESTED + DYNAMIC ROUTE: /projects/$projectId is a layout.
 * Its children (overview index and /board) render in <Outlet/>.
 */
export const Route = createFileRoute("/_authed/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project — Kanbanly" },
      { name: "description", content: "Project overview and Kanban board." },
      { property: "og:title", content: "Project — Kanbanly" },
      { property: "og:description", content: "Project overview and Kanban board." },
    ],
  }),
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const project = useSelector((s) => selectProjectById(s, projectId));
  const can = usePermissions();
  const openDialog = useUIStore((s) => s.openProjectDialog);

  if (!project) {
    return (
      <EmptyState title="Project not found" action={<Link to="/projects" className="text-sm text-primary underline">Back to projects</Link>}>
        It may have been deleted.
      </EmptyState>
    );
  }

  const tab = "border-b-2 border-transparent px-1 pb-2 text-sm text-muted-foreground hover:text-foreground";
  return (
    <div>
      <nav aria-label="Breadcrumb" className="eyebrow mb-2">
        <Link to="/projects" className="hover:text-foreground">Projects</Link> / {project.name}
      </nav>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <ColorDot color={project.color} className="size-3.5" /> {project.name}
          {project.archived && <span className="eyebrow">archived</span>}
        </h1>
        {can.canEditProject && <Button variant="outline" onClick={() => openDialog(project.id)}>Edit project</Button>}
      </div>
      <div className="mb-5 flex gap-5 border-b">
        <Link to="/projects/$projectId" params={{ projectId }} activeOptions={{ exact: true }} className={tab} activeProps={{ className: "!border-primary !text-foreground font-medium" }}>Overview</Link>
        <Link to="/projects/$projectId/board" params={{ projectId }} className={tab} activeProps={{ className: "!border-primary !text-foreground font-medium" }}>Board</Link>
      </div>
      <Outlet />
    </div>
  );
}
