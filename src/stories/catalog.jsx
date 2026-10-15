import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ColorDot,
  EmptyState,
  ErrorBoundary,
  ErrorState,
  LabelChip,
  PageHeader,
  PageLoader,
  PriorityBadge,
  PROJECT_COLORS,
  PRIORITIES,
  UserAvatar,
} from "@/components/common";
import { FilterBar } from "@/features/board/FilterBar";
import BoardView, { TaskCardBody } from "@/features/board/BoardView";
import { TaskDetail } from "@/features/tasks/TaskDetail";
import { GlobalSearch } from "@/features/tasks/GlobalSearch";
import { NotificationCenter } from "@/features/notifications/NotificationCenter";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import DashboardCharts from "@/features/dashboard/DashboardCharts";
import { selectDashboardStats } from "@/store/redux/workspaceSlice";
import { useUIStore } from "@/store/zustand/uiStore";

/**
 * SINGLE SOURCE OF TRUTH for component stories.
 * - The in-app /components page renders this list.
 * - Storybook's *.stories.jsx files re-export the same entries.
 * Each story reads data from the store it's rendered in, so it works in both.
 */

const firstTaskId = (s) => s.workspace.tasks.ids[0];
const firstProjectId = (s) => s.workspace.projects.ids.find((id) => !s.workspace.projects.entities[id].archived);

function FirstTaskCard() {
  const ids = useSelector((s) => s.workspace.tasks.ids.slice(0, 3));
  return <div className="grid max-w-sm gap-2">{ids.map((id) => <TaskCardBody key={id} taskId={id} />)}</div>;
}
function FirstTaskDetail() {
  const id = useSelector(firstTaskId);
  return id ? <div className="max-w-2xl"><TaskDetail taskId={id} /></div> : null;
}
function FirstBoard() {
  const id = useSelector(firstProjectId);
  return id ? <BoardView projectId={id} /> : null;
}
function Charts() {
  const stats = useSelector(selectDashboardStats);
  return <DashboardCharts byPriority={stats.byPriority} byStatus={stats.byStatus} />;
}
function OpenProjectDialog() {
  const open = useUIStore((s) => s.openProjectDialog);
  return (
    <>
      <Button onClick={() => open()}>Open “New project” dialog</Button>
      <ProjectFormDialog />
    </>
  );
}
function Bomb() {
  throw new Error("Thrown on purpose to show the boundary.");
}
function BoundaryDemo() {
  const [crash, setCrash] = useState(false);
  return crash ? (
    <ErrorBoundary title="Caught by ErrorBoundary"><Bomb /></ErrorBoundary>
  ) : (
    <Button variant="outline" onClick={() => setCrash(true)}>Crash a child component</Button>
  );
}
function ControlledInput() {
  const [v, setV] = useState("Hello");
  return (
    <div className="max-w-xs space-y-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} aria-label="Demo input" />
      <p className="eyebrow">state: “{v}”</p>
    </div>
  );
}

export const STORIES = [
  /* ---- UI primitives (shadcn/ui) ---- */
  { id: "button", group: "UI primitives", name: "Button", file: "components/ui/button.tsx", description: "shadcn/ui button with variants.",
    usage: '<Button variant="outline">Cancel</Button>',
    render: () => (
      <div className="flex flex-wrap gap-2">
        <Button>Default</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button><Button size="sm">Small</Button>
      </div>
    ) },
  { id: "input", group: "UI primitives", name: "Input (controlled)", file: "components/ui/input.tsx", description: "Text input, used as a controlled component everywhere.",
    usage: "<Input value={v} onChange={e => setV(e.target.value)} />", render: () => <ControlledInput /> },
  { id: "badge", group: "UI primitives", name: "Badge", file: "components/ui/badge.tsx", description: "Small status label.",
    usage: '<Badge variant="secondary">New</Badge>',
    render: () => <div className="flex gap-2"><Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge></div> },
  { id: "switch", group: "UI primitives", name: "Switch", file: "components/ui/switch.tsx", description: "Toggle used in Settings.",
    usage: "<Switch checked={on} onCheckedChange={setOn} />", render: () => <Switch defaultChecked aria-label="Demo switch" /> },

  /* ---- Common ---- */
  { id: "priority-badge", group: "Common", name: "PriorityBadge", file: "components/common.jsx", description: "React.memo badge colored by priority token.",
    usage: '<PriorityBadge priority="urgent" />', render: () => <div className="flex gap-2">{PRIORITIES.map((p) => <PriorityBadge key={p} priority={p} />)}</div> },
  { id: "label-chip", group: "Common", name: "LabelChip", file: "components/common.jsx", description: "Task label/tag.",
    usage: '<LabelChip label="design" />', render: () => <div className="flex gap-2"><LabelChip label="design" /><LabelChip label="backend" /></div> },
  { id: "user-avatar", group: "Common", name: "UserAvatar", file: "components/common.jsx", description: "Initials avatar; '?' when unassigned.",
    usage: '<UserAvatar userId="u1" size="md" />',
    render: () => <div className="flex items-center gap-2"><UserAvatar userId="u1" /><UserAvatar userId="u2" size="md" /><UserAvatar userId={null} /></div> },
  { id: "color-dot", group: "Common", name: "ColorDot", file: "components/common.jsx", description: "Project color marker.",
    usage: '<ColorDot color="chart-1" />', render: () => <div className="flex gap-2">{PROJECT_COLORS.map((c) => <ColorDot key={c} color={c} />)}</div> },
  { id: "page-header", group: "Common", name: "PageHeader", file: "components/common.jsx", description: "Title + eyebrow + actions slot (composition via children).",
    usage: '<PageHeader eyebrow="3 projects" title="Projects"><Button/></PageHeader>',
    render: () => <PageHeader eyebrow="3 projects" title="Projects"><Button>New project</Button></PageHeader> },
  { id: "empty-state", group: "Common", name: "EmptyState", file: "components/common.jsx", description: "Shown when a list has nothing to display.",
    usage: '<EmptyState title="No projects here">Try another tab.</EmptyState>', render: () => <EmptyState title="No projects here">Try a different search or tab.</EmptyState> },
  { id: "page-loader", group: "Common", name: "PageLoader", file: "components/common.jsx", description: "Suspense / loading fallback.",
    usage: '<Suspense fallback={<PageLoader />}>', render: () => <PageLoader label="Loading board" /> },
  { id: "error-state", group: "Common", name: "ErrorState", file: "components/common.jsx", description: "Failure message with retry.",
    usage: "<ErrorState message={error} onRetry={retry} />", render: () => <ErrorState message="Simulated network error (503)." onRetry={() => {}} /> },
  { id: "error-boundary", group: "Common", name: "ErrorBoundary", file: "components/common.jsx", description: "Class component catching render errors.",
    usage: "<ErrorBoundary><Board /></ErrorBoundary>", render: () => <BoundaryDemo /> },

  /* ---- Features ---- */
  { id: "task-card", group: "Features", name: "TaskCard", file: "features/board/BoardView.jsx", description: "Memoized card that selects its own task by id.",
    usage: "<TaskCardBody taskId={id} />", render: () => <FirstTaskCard /> },
  { id: "filter-bar", group: "Features", name: "FilterBar", file: "features/board/FilterBar.jsx", description: "Controlled filters in Zustand, updates wrapped in startTransition.",
    usage: '<FilterBar labels={["design"]} />', render: () => <FilterBar labels={["design", "backend", "research"]} /> },
  { id: "board", group: "Features", name: "BoardView", file: "features/board/BoardView.jsx", description: "Full drag-and-drop board (dnd-kit). Changes here edit real data.",
    usage: "<BoardView projectId={id} />", render: () => <FirstBoard /> },
  { id: "task-detail", group: "Features", name: "TaskDetail", file: "features/tasks/TaskDetail.jsx", description: "Task editor with debounced auto-save and comments.",
    usage: "<TaskDetail taskId={id} />", render: () => <FirstTaskDetail /> },
  { id: "global-search", group: "Features", name: "GlobalSearch", file: "features/tasks/GlobalSearch.jsx", description: "Combobox search with useDeferredValue and '/' shortcut.",
    usage: "<GlobalSearch />", render: () => <div className="h-72"><GlobalSearch /></div> },
  { id: "notifications", group: "Features", name: "NotificationCenter", file: "features/notifications/NotificationCenter.jsx", description: "Popover of derived notifications.",
    usage: "<NotificationCenter />", render: () => <NotificationCenter /> },
  { id: "project-form", group: "Features", name: "ProjectFormDialog", file: "features/projects/ProjectFormDialog.jsx", description: "Validated create/edit form; open state in Zustand.",
    usage: "openProjectDialog(); <ProjectFormDialog />", render: () => <OpenProjectDialog /> },
  { id: "charts", group: "Features", name: "DashboardCharts", file: "features/dashboard/DashboardCharts.jsx", description: "Lazy-loaded Recharts bar + donut.",
    usage: "<DashboardCharts byPriority={…} byStatus={…} />", render: () => <Charts /> },
];

export const getStory = (id) => STORIES.find((s) => s.id === id);

/** Converts a catalog entry into a Storybook CSF story object. */
export const toCSF = (id) => {
  const s = getStory(id);
  return { name: s.name, render: s.render, parameters: { docs: { description: { story: `${s.description}\n\nFile: src/${s.file}\n\n\`${s.usage}\`` } } } };
};
