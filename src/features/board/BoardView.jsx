import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckCircle2, GripVertical, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  columnAdded,
  columnDeleted,
  columnRenamed,
  columnsReordered,
  isOverdue,
  makeSelectTasksByProject,
  selectColumnById,
  selectProjectById,
  selectTaskById,
  taskAdded,
  taskMoved,
} from "@/store/redux/workspaceSlice";
import { useUIStore } from "@/store/zustand/uiStore";
import { useAuth } from "@/context/AuthContext";
import { useFilteredTasks, usePermissions } from "@/hooks";
import { LabelChip, PriorityBadge, UserAvatar } from "@/components/common";
import { TaskDetail } from "@/features/tasks/TaskDetail";
import { FilterBar } from "./FilterBar";
import { formatDate } from "@/utils/filterTasks";
import { cn } from "@/lib/utils";

const COL = "col:";

/**
 * BOARD PERFORMANCE MODEL
 *  - Board selects the project + its tasks (for filtering) only.
 *  - Each <Column/> selects ITS column by id.
 *  - Each <TaskCard/> selects ITS task by id and is React.memo'd.
 * So editing one task re-renders one card, not the whole board.
 */
export default function BoardView({ projectId }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const can = usePermissions();
  const project = useSelector((s) => selectProjectById(s, projectId));
  const selectTasks = useMemo(makeSelectTasksByProject, []);
  const tasks = useSelector((s) => selectTasks(s, projectId));
  const filters = useUIStore((s) => s.filters);
  const activeTaskId = useUIStore((s) => s.activeTaskId);
  const closeTask = useUIStore((s) => s.closeTask);
  const columnEntities = useSelector((s) => s.workspace.columns.entities);

  const { filtered, isStale } = useFilteredTasks(tasks, filters);
  // A Set gives O(1) lookups; memoized so Column props stay referentially stable.
  const visible = useMemo(() => new Set(filtered.map((t) => t.id)), [filtered]);
  const labels = useMemo(() => [...new Set(tasks.flatMap((t) => t.labels))].sort(), [tasks]);

  const [dragging, setDragging] = useState(null);
  const [newCol, setNewCol] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback(({ active }) => setDragging(String(active.id)), []);

  const onDragEnd = useCallback(
    ({ active, over }) => {
      setDragging(null);
      if (!over || !project) return;
      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId.startsWith(COL)) {
        const from = project.columnIds.indexOf(activeId.slice(COL.length));
        const overColId = overId.startsWith(COL) ? overId.slice(COL.length) : columnEntities[over.data.current?.columnId]?.id;
        const to = project.columnIds.indexOf(overColId);
        if (from !== -1 && to !== -1 && from !== to) {
          dispatch(columnsReordered({ projectId, columnIds: arrayMove(project.columnIds, from, to) }));
        }
        return;
      }

      // Task drag: over may be another task or a column.
      const toColumnId = overId.startsWith(COL) ? overId.slice(COL.length) : over.data.current?.columnId;
      const target = columnEntities[toColumnId];
      if (!target) return;
      const toIndex = overId.startsWith(COL) ? target.taskIds.length : target.taskIds.indexOf(overId);
      dispatch(taskMoved({ taskId: activeId, toColumnId, toIndex, actor: user?.name }));
    },
    [project, projectId, columnEntities, dispatch, user],
  );

  if (!project) return null;

  return (
    <div>
      <FilterBar labels={labels} />
      <div className={cn("transition-opacity", isStale && "opacity-60")}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <SortableContext items={project.columnIds.map((id) => COL + id)} strategy={horizontalListSortingStrategy}>
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {project.columnIds.map((id) => (
                <Column key={id} columnId={id} projectId={projectId} visible={visible} />
              ))}
              {can.canManageColumns && (
                <form
                  className="w-72 shrink-0 rounded-xl border border-dashed p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCol.trim()) return;
                    dispatch(columnAdded({ projectId, title: newCol.trim() }));
                    setNewCol("");
                  }}
                >
                  <Input value={newCol} onChange={(e) => setNewCol(e.target.value)} placeholder="+ Add column" aria-label="New column name" className="h-8 text-sm" />
                </form>
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {dragging && !dragging.startsWith(COL) ? <TaskCardBody taskId={dragging} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Dialog open={!!activeTaskId} onOpenChange={(o) => !o && closeTask()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="sr-only">Task details</DialogTitle>
          <DialogDescription className="sr-only">Edit the task</DialogDescription>
          {activeTaskId && <TaskDetail key={activeTaskId} taskId={activeTaskId} onDeleted={closeTask} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Column = memo(function Column({ columnId, projectId, visible }) {
  const column = useSelector((s) => selectColumnById(s, columnId));
  const dispatch = useDispatch();
  const { user } = useAuth();
  const can = usePermissions();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const addRef = useRef(null);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: COL + columnId,
    data: { type: "column" },
  });

  // Derived: only the ids passing the filter, in board order.
  const ids = useMemo(() => (column ? column.taskIds.filter((id) => visible.has(id)) : []), [column, visible]);
  if (!column) return null;

  const saveTitle = () => {
    if (title.trim()) dispatch(columnRenamed({ id: columnId, title: title.trim() }));
    setEditing(false);
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={`${column.title} column`}
      className={cn("flex w-72 shrink-0 flex-col rounded-xl bg-column", isDragging && "opacity-50")}
    >
      <header className="flex items-center gap-1 px-3 pb-2 pt-3">
        {can.canManageColumns && (
          <button {...attributes} {...listeners} aria-label={`Reorder ${column.title}`} className="cursor-grab text-muted-foreground">
            <GripVertical className="size-4" />
          </button>
        )}
        {editing ? (
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => e.key === "Enter" && saveTitle()} className="h-7 text-sm" aria-label="Column name" />
        ) : (
          <h2 className="flex-1 truncate text-sm font-semibold">{column.title}</h2>
        )}
        <span className="font-mono text-xs text-muted-foreground">{ids.length}</span>
        {can.canManageColumns && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label={`${column.title} options`}><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { setTitle(column.title); setEditing(true); }}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => confirm(`Delete “${column.title}” and its ${column.taskIds.length} tasks?`) && dispatch(columnDeleted({ id: columnId, actor: user?.name }))}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-16 flex-col gap-2 px-2 pb-2">
          {ids.map((id) => <TaskCard key={id} taskId={id} columnId={columnId} />)}
        </ul>
      </SortableContext>
      <form
        className="px-2 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          dispatch(taskAdded({ projectId, columnId, title: draft.trim(), actor: user?.name }));
          setDraft("");
          addRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-1">
          <Plus className="size-4 text-muted-foreground" aria-hidden />
          <Input ref={addRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add task" aria-label={`Add task to ${column.title}`} className="h-8 border-transparent bg-transparent text-sm shadow-none focus-visible:bg-surface" />
        </div>
      </form>
    </section>
  );
});

const TaskCard = memo(function TaskCard({ taskId, columnId }) {
  const openTask = useUIStore((s) => s.openTask);
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: taskId,
    data: { type: "task", columnId },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
      onClick={() => openTask(taskId)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter") openTask(taskId);
      }}
    >
      <TaskCardBody taskId={taskId} />
    </li>
  );
});

const TaskCardBody = memo(function TaskCardBody({ taskId, overlay }) {
  const task = useSelector((s) => selectTaskById(s, taskId));
  if (!task) return null;
  const overdue = isOverdue(task);
  return (
    <article className={cn("cursor-pointer space-y-2 rounded-lg border bg-card p-3 text-sm shadow-sm transition hover:border-primary/40", overlay && "rotate-2 shadow-xl", task.completed && "opacity-70")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn("font-medium leading-snug", task.completed && "line-through")}>{task.title}</h3>
        {task.completed && <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Completed" />}
      </div>
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">{task.labels.map((l) => <LabelChip key={l} label={l} />)}</div>
      )}
      <div className="flex items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={cn("flex items-center gap-1 font-mono text-[11px]", overdue ? "text-destructive" : "text-muted-foreground")}>
            <CalendarDays className="size-3" aria-hidden />
            {formatDate(task.dueDate)}
            {overdue && <span className="sr-only">(overdue)</span>}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="flex items-center gap-0.5 font-mono text-[11px] text-muted-foreground">
            <MessageSquare className="size-3" aria-hidden />
            {task.comments.length}
          </span>
        )}
        <span className="ml-auto"><UserAvatar userId={task.assigneeId} /></span>
      </div>
    </article>
  );
});
