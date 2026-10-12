import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { selectActivity, selectAllProjects, selectDashboardStats } from "@/store/redux/workspaceSlice";
import { PageHeader, PageLoader, ColorDot } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/utils/filterTasks";
import { cn } from "@/lib/utils";

// Code splitting: recharts lives in its own chunk.
const DashboardCharts = lazy(() => import("@/features/dashboard/DashboardCharts"));

export const Route = createFileRoute("/_authed/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kanbanly" },
      { name: "description", content: "Projects, tasks, overdue work and recent activity at a glance." },
      { property: "og:title", content: "Dashboard — Kanbanly" },
      { property: "og:description", content: "Projects, tasks, overdue work and recent activity at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useSelector(selectDashboardStats);
  const activity = useSelector(selectActivity);
  const projects = useSelector(selectAllProjects);
  const { user } = useAuth();

  const cards = [
    ["Total projects", stats.totalProjects],
    ["Active projects", stats.activeProjects],
    ["Total tasks", stats.totalTasks],
    ["Completed", stats.completed],
    ["Overdue", stats.overdue, stats.overdue > 0],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow={new Date().toDateString()} title={`Hello, ${user?.name.split(" ")[0]}`} />
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(([label, value, alert]) => (
          <div key={label} className={cn("rounded-xl border bg-card p-4", alert && "border-destructive/40 bg-destructive/5")}>
            <dt className="eyebrow">{label}</dt>
            <dd className={cn("mt-2 font-display text-3xl font-bold", alert && "text-destructive")}>{value}</dd>
          </div>
        ))}
      </dl>
      <Suspense fallback={<PageLoader label="Loading charts" />}>
        <DashboardCharts byPriority={stats.byPriority} byStatus={stats.byStatus} />
      </Suspense>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-5 lg:col-span-2" aria-labelledby="act">
          <h2 id="act" className="eyebrow mb-3">Recent activity</h2>
          <ol className="divide-y">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <span><span className="font-medium">{a.actor}</span> {a.message}</span>
                <time className="shrink-0 font-mono text-xs text-muted-foreground" dateTime={a.at}>{timeAgo(a.at)}</time>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border bg-card p-5" aria-labelledby="proj">
          <h2 id="proj" className="eyebrow mb-3">Active projects</h2>
          <ul className="space-y-1">
            {projects.filter((p) => !p.archived).map((p) => (
              <li key={p.id}>
                <Link to="/projects/$projectId/board" params={{ projectId: p.id }} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                  <ColorDot color={p.color} /> {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
