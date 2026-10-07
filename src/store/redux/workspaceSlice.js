import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
  createSelector,
  nanoid,
} from "@reduxjs/toolkit";
import * as api from "@/api/mockApi";
import { getUserById } from "@/api/users";

/**
 * WHY REDUX TOOLKIT HERE?
 * Projects, columns and tasks are the app's core *business* data:
 *  - many entities that reference each other (project → columns → tasks)
 *  - many different actions mutate them (move, reorder, cascade delete…)
 *  - we want a predictable, inspectable history (Redux DevTools, time travel)
 *
 * RTK gives us:
 *  - createEntityAdapter → normalized { ids, entities } storage + selectors
 *  - Immer → "mutating" syntax that produces immutable updates
 *  - createAsyncThunk → standard pending / fulfilled / rejected lifecycle
 */

const projectsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});
const columnsAdapter = createEntityAdapter();
const tasksAdapter = createEntityAdapter();

export const fetchWorkspace = createAsyncThunk(
  "workspace/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchWorkspace();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

/**
 * Reducers must be pure, so random IDs and timestamps are created in
 * `prepare` callbacks — never inside the reducer body.
 */
const withMeta = (payload) => ({
  payload,
  meta: { id: nanoid(), at: new Date().toISOString() },
});

function log(state, action, type, message) {
  state.activity.unshift({
    id: nanoid(),
    type,
    message,
    actor: action.payload.actor ?? "Someone",
    at: action.meta?.at ?? new Date().toISOString(),
  });
  if (state.activity.length > 80) state.activity.length = 80;
}

const initialState = {
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  projects: projectsAdapter.getInitialState(),
  columns: columnsAdapter.getInitialState(),
  tasks: tasksAdapter.getInitialState(),
  activity: [],
  lastReadAt: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    /* ---------------- Projects ---------------- */
    projectAdded: {
      prepare: (data) =>
        withMeta({
          ...data,
          columns: api.DEFAULT_COLUMNS.map((title) => ({ id: nanoid(), title })),
        }),
      reducer(state, action) {
        const { name, description, color, dueDate, ownerId, columns } = action.payload;
        const id = action.meta.id;
        columns.forEach((c) =>
          columnsAdapter.addOne(state.columns, { ...c, projectId: id, taskIds: [] }),
        );
        projectsAdapter.addOne(state.projects, {
          id,
          name,
          description,
          color,
          dueDate,
          ownerId,
          archived: false,
          createdAt: action.meta.at,
          columnIds: columns.map((c) => c.id),
        });
        log(state, action, "project", `created project “${name}”`);
      },
    },
    projectUpdated: {
      prepare: withMeta,
      reducer(state, action) {
        const { id, changes } = action.payload;
        projectsAdapter.updateOne(state.projects, { id, changes });
        log(state, action, "project", `updated project “${state.projects.entities[id]?.name}”`);
      },
    },
    projectArchiveToggled: {
      prepare: withMeta,
      reducer(state, action) {
        const project = state.projects.entities[action.payload.id];
        if (!project) return;
        project.archived = !project.archived;
        log(state, action, "project", `${project.archived ? "archived" : "restored"} “${project.name}”`);
      },
    },
    projectDeleted: {
      prepare: withMeta,
      reducer(state, action) {
        const project = state.projects.entities[action.payload.id];
        if (!project) return;
        // Cascade delete — exactly the kind of cross-entity logic Redux is good at.
        const taskIds = state.tasks.ids.filter(
          (tid) => state.tasks.entities[tid].projectId === project.id,
        );
        tasksAdapter.removeMany(state.tasks, taskIds);
        columnsAdapter.removeMany(state.columns, project.columnIds);
        projectsAdapter.removeOne(state.projects, project.id);
        log(state, action, "project", `deleted project “${project.name}”`);
      },
    },

    /* ---------------- Columns ---------------- */
    columnAdded: {
      prepare: withMeta,
      reducer(state, action) {
        const { projectId, title } = action.payload;
        const project = state.projects.entities[projectId];
        if (!project) return;
        columnsAdapter.addOne(state.columns, { id: action.meta.id, projectId, title, taskIds: [] });
        project.columnIds.push(action.meta.id);
      },
    },
    columnRenamed(state, action) {
      const { id, title } = action.payload;
      columnsAdapter.updateOne(state.columns, { id, changes: { title } });
    },
    columnDeleted: {
      prepare: withMeta,
      reducer(state, action) {
        const column = state.columns.entities[action.payload.id];
        if (!column) return;
        tasksAdapter.removeMany(state.tasks, column.taskIds);
        const project = state.projects.entities[column.projectId];
        project.columnIds = project.columnIds.filter((id) => id !== column.id);
        columnsAdapter.removeOne(state.columns, column.id);
        log(state, action, "column", `deleted column “${column.title}”`);
      },
    },
    columnsReordered(state, action) {
      const { projectId, columnIds } = action.payload;
      const project = state.projects.entities[projectId];
      if (project) project.columnIds = columnIds;
    },

    /* ---------------- Tasks ---------------- */
    taskAdded: {
      prepare: withMeta,
      reducer(state, action) {
        const { projectId, columnId, title, priority = "medium", assigneeId = null } =
          action.payload;
        const column = state.columns.entities[columnId];
        if (!column) return;
        tasksAdapter.addOne(state.tasks, {
          id: action.meta.id,
          projectId,
          columnId,
          title,
          description: action.payload.description ?? "",
          priority,
          assigneeId,
          labels: action.payload.labels ?? [],
          dueDate: action.payload.dueDate ?? null,
          completed: /done/i.test(column.title),
          comments: [],
          createdAt: action.meta.at,
        });
        column.taskIds.push(action.meta.id);
        log(state, action, "task", `added task “${title}”`);
      },
    },
    taskUpdated: {
      prepare: withMeta,
      reducer(state, action) {
        const { id, changes } = action.payload;
        const task = state.tasks.entities[id];
        if (!task) return;
        if ("assigneeId" in changes && changes.assigneeId !== task.assigneeId && changes.assigneeId) {
          log(state, action, "assign", `assigned “${task.title}” to ${getUserById(changes.assigneeId)?.name}`);
        }
        tasksAdapter.updateOne(state.tasks, { id, changes });
      },
    },
    taskToggled: {
      prepare: withMeta,
      reducer(state, action) {
        const task = state.tasks.entities[action.payload.id];
        if (!task) return;
        task.completed = !task.completed;
        log(state, action, "task", `${task.completed ? "completed" : "reopened"} “${task.title}”`);
      },
    },
    taskDeleted: {
      prepare: withMeta,
      reducer(state, action) {
        const task = state.tasks.entities[action.payload.id];
        if (!task) return;
        const column = state.columns.entities[task.columnId];
        if (column) column.taskIds = column.taskIds.filter((id) => id !== task.id);
        tasksAdapter.removeOne(state.tasks, task.id);
        log(state, action, "task", `deleted task “${task.title}”`);
      },
    },
    /**
     * Single reducer handles both "reorder within column" and
     * "move across columns". Final position = toIndex in the target list.
     */
    taskMoved: {
      prepare: withMeta,
      reducer(state, action) {
        const { taskId, toColumnId, toIndex } = action.payload;
        const task = state.tasks.entities[taskId];
        const from = task && state.columns.entities[task.columnId];
        const to = state.columns.entities[toColumnId];
        if (!task || !from || !to) return;
        from.taskIds = from.taskIds.filter((id) => id !== taskId);
        const index = Math.max(0, Math.min(toIndex ?? to.taskIds.length, to.taskIds.length));
        to.taskIds.splice(index, 0, taskId);
        if (from.id !== to.id) {
          task.columnId = to.id;
          task.completed = /done/i.test(to.title);
          log(state, action, "move", `moved “${task.title}” to ${to.title}`);
        }
      },
    },
    commentAdded: {
      prepare: withMeta,
      reducer(state, action) {
        const { taskId, text, authorId } = action.payload;
        const task = state.tasks.entities[taskId];
        if (!task) return;
        task.comments.push({ id: action.meta.id, text, authorId, at: action.meta.at });
        log(state, action, "comment", `commented on “${task.title}”`);
      },
    },
    notificationsRead(state) {
      state.lastReadAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspace.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        projectsAdapter.setAll(state.projects, payload.projects);
        columnsAdapter.setAll(state.columns, payload.columns);
        tasksAdapter.setAll(state.tasks, payload.tasks);
        state.activity = payload.activity ?? [];
        state.lastReadAt = payload.lastReadAt ?? null;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load workspace";
      });
  },
});

export const {
  projectAdded,
  projectUpdated,
  projectArchiveToggled,
  projectDeleted,
  columnAdded,
  columnRenamed,
  columnDeleted,
  columnsReordered,
  taskAdded,
  taskUpdated,
  taskToggled,
  taskDeleted,
  taskMoved,
  commentAdded,
  notificationsRead,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;

/* ---------------- Selectors ---------------- */

export const { selectAll: selectAllProjects, selectById: selectProjectById } =
  projectsAdapter.getSelectors((s) => s.workspace.projects);
export const { selectById: selectColumnById } = columnsAdapter.getSelectors(
  (s) => s.workspace.columns,
);
export const { selectAll: selectAllTasks, selectById: selectTaskById } =
  tasksAdapter.getSelectors((s) => s.workspace.tasks);

export const selectStatus = (s) => s.workspace.status;
export const selectActivity = (s) => s.workspace.activity;

/** Plain snapshot used by the persistence subscriber. */
export const selectPersistable = createSelector(
  [(s) => s.workspace],
  (w) => ({
    projects: Object.values(w.projects.entities),
    columns: Object.values(w.columns.entities),
    tasks: Object.values(w.tasks.entities),
    activity: w.activity,
    lastReadAt: w.lastReadAt,
  }),
);

/**
 * Selector *factory*: each component instance gets its own memoized
 * selector so two boards don't thrash a shared cache.
 */
export const makeSelectTasksByProject = () =>
  createSelector([selectAllTasks, (_, projectId) => projectId], (tasks, projectId) =>
    tasks.filter((t) => t.projectId === projectId),
  );

export const makeSelectColumnTitles = () =>
  createSelector(
    [(s) => s.workspace.columns.entities, (_, columnIds) => columnIds],
    (entities, ids) => ids.map((id) => ({ id, title: entities[id]?.title ?? "" })),
  );

const todayISO = () => new Date().toISOString().slice(0, 10);

export const isOverdue = (task) =>
  !task.completed && !!task.dueDate && task.dueDate < todayISO();

export const selectDashboardStats = createSelector(
  [selectAllProjects, selectAllTasks, (s) => s.workspace.columns.entities],
  (projects, tasks, columns) => {
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    const byStatus = {};
    let completed = 0;
    let overdue = 0;
    for (const t of tasks) {
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
      const status = t.completed ? "Done" : (columns[t.columnId]?.title ?? "Unknown");
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      if (t.completed) completed++;
      if (isOverdue(t)) overdue++;
    }
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => !p.archived).length,
      totalTasks: tasks.length,
      completed,
      overdue,
      byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    };
  },
);

export const selectUnreadCount = createSelector(
  [selectActivity, (s) => s.workspace.lastReadAt],
  (activity, lastReadAt) =>
    lastReadAt ? activity.filter((a) => a.at > lastReadAt).length : activity.length,
);

export const selectDueSoon = createSelector([selectAllTasks], (tasks) => {
  const today = todayISO();
  const soon = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  return tasks.filter((t) => !t.completed && t.dueDate && t.dueDate >= today && t.dueDate <= soon);
});
