import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Archive, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { projectArchiveToggled, projectDeleted, selectAllProjects, selectAllTasks } from "@/store/redux/workspaceSlice";
import { useUIStore } from "@/store/zustand/uiStore";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks";
import { ColorDot, EmptyState, PageHeader } from "@/components/common";
import { formatDate } from "@/utils/filterTasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Kanbanly" },
      { name: "description", content: "Search, filter, create and archive your projects." },
      { property: "og:title", content: "Projects — Kanbanly" },
      { property: "og:description", content: "Search, filter, create and archive your projects." },
    ],
  }),
  component: ProjectsPage,
});

const TABS = [["active", "Active"], ["archived", "Archived"], ["all", "All"]];

function ProjectsPage() {
  const projects = useSelector(selectAllProjects);
  const tasks = useSelector(selectAllTasks);
  const openDialog = useUIStore((s) => s.openProjectDialog);
  const can = usePermissions();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("active");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  // Per-project task counts — computed once per tasks change.
  const counts = useMemo(() => {
    const m = {};
    for (const t of tasks) {
      m[t.projectId] ??= { total: 0, done: 0 };
      m[t.projectId].total++;
      if (t.completed) m[t.projectId].done++;
    }
    return m;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (tab === "active" && p.archived) return false;
      if (tab === "archived" && !p.archived) return false;
      return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
  }, [projects, tab, deferredQuery]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={`${projects.length} projects`} title="Projects">
        {can.canCreateProject && (
          <Button onClick={() => openDialog()}><Plus className="size-4" /> New project</Button>
        )}
      </PageHeader>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" aria-label="Search projects" className="h-9 w-64" />
        <div role="tablist" aria-label="Project status" className="flex rounded-lg border p-0.5">
          {TABS.map(([v, l]) => (
            <button
              key={v}
              role="tab"
              aria-selected={tab === v}
              onClick={() => startTransition(() => setTab(v))}
              className={cn("rounded-md px-3 py-1 text-sm", tab === v ? "bg-secondary font-medium" : "text-muted-foreground")}
            >
              {l}
            </button>
          ))}
        </div>
        {isPending && <span className="eyebrow">updating…</span>}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No projects here">Try a different search or tab.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => <ProjectCard key={p.id} project={p} count={counts[p.id]} />)}
        </ul>
      )}
    </div>
  );
}

function ProjectCard({ project, count = { total: 0, done: 0 } }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const can = usePermissions();
  const openDialog = useUIStore((s) => s.openProjectDialog);
  const pct = count.total ? Math.round((count.done / count.total) * 100) : 0;

  return (
    <li className={cn("group relative flex flex-col rounded-xl border bg-card p-5 transition hover:border-primary/40", project.archived && "opacity-70")}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2"><ColorDot color={project.color} />{project.archived && <span className="eyebrow">archived</span>}</span>
        {(can.canEditProject || can.canDeleteProject) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-10 size-7" aria-label={`${project.name} options`}><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can.canEditProject && <DropdownMenuItem onSelect={() => openDialog(project.id)}><Pencil className="size-4" /> Edit</DropdownMenuItem>}
              {can.canArchiveProject && (
                <DropdownMenuItem onSelect={() => dispatch(projectArchiveToggled({ id: project.id, actor: user?.name }))}>
                  <Archive className="size-4" /> {project.archived ? "Restore" : "Archive"}
                </DropdownMenuItem>
              )}
              {can.canDeleteProject && (
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => {
                    if (!confirm(`Delete “${project.name}” and all its tasks?`)) return;
                    dispatch(projectDeleted({ id: project.id, actor: user?.name }));
                    toast("Project deleted");
                  }}
                >
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <h2 className="text-lg font-semibold">
        <Link to="/projects/$projectId" params={{ projectId: project.id }} className="after:absolute after:inset-0">{project.name}</Link>
      </h2>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{project.description}</p>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{count.done}/{count.total} done</span>
          {project.dueDate && <span>due {formatDate(project.dueDate)}</span>}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </li>
  );
}
