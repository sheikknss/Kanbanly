import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { isOverdue, makeSelectTasksByProject, selectProjectById } from "@/store/redux/workspaceSlice";
import { getUserById } from "@/api/users";
import { PriorityBadge, UserAvatar } from "@/components/common";
import { formatDate } from "@/utils/filterTasks";

export const Route = createFileRoute("/_authed/projects/$projectId/")({
  component: ProjectOverview,
});

function ProjectOverview() {
  const { projectId } = Route.useParams();
  const project = useSelector((s) => selectProjectById(s, projectId));
  const selectTasks = useMemo(makeSelectTasksByProject, []);
  const tasks = useSelector((s) => selectTasks(s, projectId));
  if (!project) return null;

  const done = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter(isOverdue);
  const people = [...new Set(tasks.map((t) => t.assigneeId).filter(Boolean))];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-xl border bg-card p-5 lg:col-span-2">
        <h2 className="eyebrow mb-2">About</h2>
        <p className="text-sm">{project.description || "No description."}</p>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="eyebrow">Tasks</dt><dd className="font-display text-2xl font-bold">{tasks.length}</dd></div>
          <div><dt className="eyebrow">Done</dt><dd className="font-display text-2xl font-bold">{done}</dd></div>
          <div><dt className="eyebrow">Due</dt><dd className="font-display text-2xl font-bold">{project.dueDate ? formatDate(project.dueDate) : "—"}</dd></div>
        </dl>
        <Link to="/projects/$projectId/board" params={{ projectId }} className="mt-5 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">Open board →</Link>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="eyebrow mb-3">Team</h2>
        <ul className="space-y-2">
          {people.map((id) => (
            <li key={id} className="flex items-center gap-2 text-sm"><UserAvatar userId={id} /> {getUserById(id)?.name}</li>
          ))}
          {people.length === 0 && <li className="text-sm text-muted-foreground">Nobody assigned yet.</li>}
        </ul>
      </section>
      <section className="rounded-xl border bg-card p-5 lg:col-span-3">
        <h2 className="eyebrow mb-3">Overdue ({overdue.length})</h2>
        <ul className="divide-y">
          {overdue.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
              <Link to="/tasks/$taskId" params={{ taskId: t.id }} className="flex-1 hover:underline">{t.title}</Link>
              <PriorityBadge priority={t.priority} />
              <span className="font-mono text-xs text-destructive">{formatDate(t.dueDate)}</span>
            </li>
          ))}
          {overdue.length === 0 && <li className="text-sm text-muted-foreground">Nothing overdue. Nice.</li>}
        </ul>
      </section>
    </div>
  );
}
