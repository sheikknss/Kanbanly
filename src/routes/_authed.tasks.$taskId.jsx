import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { selectProjectById, selectTaskById } from "@/store/redux/workspaceSlice";
import { TaskDetail } from "@/features/tasks/TaskDetail";
import { EmptyState } from "@/components/common";

export const Route = createFileRoute("/_authed/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Task — Kanbanly" },
      { name: "description", content: "Task details, comments and assignment." },
      { property: "og:title", content: "Task — Kanbanly" },
      { property: "og:description", content: "Task details, comments and assignment." },
    ],
  }),
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = Route.useParams();
  const task = useSelector((s) => selectTaskById(s, taskId));
  const project = useSelector((s) => (task ? selectProjectById(s, task.projectId) : null));
  const navigate = useNavigate();

  if (!task) {
    return <EmptyState title="Task not found" action={<Link to="/projects" className="text-sm text-primary underline">Browse projects</Link>}>It may have been deleted.</EmptyState>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="eyebrow mb-4">
        <Link to="/projects/$projectId/board" params={{ projectId: task.projectId }} className="hover:text-foreground">← {project?.name} board</Link>
      </nav>
      <div className="rounded-xl border bg-card p-6">
        <TaskDetail taskId={taskId} onDeleted={() => navigate({ to: "/projects/$projectId/board", params: { projectId: task.projectId } })} />
      </div>
    </div>
  );
}
