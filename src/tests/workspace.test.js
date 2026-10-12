import { describe, expect, it } from "vitest";
import { makeStore } from "@/store/redux/store";
import {
  fetchWorkspace,
  projectAdded,
  projectDeleted,
  selectAllProjects,
  selectAllTasks,
  taskAdded,
  taskMoved,
} from "@/store/redux/workspaceSlice";
import { createSeed } from "@/api/mockApi";
import { filterTasks } from "@/utils/filterTasks";
import { DEFAULT_FILTERS } from "@/store/zustand/uiStore";
import { validateProject } from "@/features/projects/ProjectFormDialog";

function seededStore() {
  const store = makeStore();
  store.dispatch({ type: fetchWorkspace.fulfilled.type, payload: createSeed() });
  return store;
}

describe("workspace slice", () => {
  it("adds a project with default columns", () => {
    const store = makeStore();
    store.dispatch({ type: fetchWorkspace.fulfilled.type, payload: { projects: [], columns: [], tasks: [] } });
    store.dispatch(projectAdded({ name: "Test", description: "", color: "chart-1" }));
    const [p] = selectAllProjects(store.getState());
    expect(p.name).toBe("Test");
    expect(p.columnIds).toHaveLength(4);
  });

  it("moves a task across columns and marks Done as completed", () => {
    const store = seededStore();
    const project = selectAllProjects(store.getState())[0];
    const [todo, , , done] = project.columnIds;
    store.dispatch(taskAdded({ projectId: project.id, columnId: todo, title: "Move me" }));
    const task = selectAllTasks(store.getState()).find((t) => t.title === "Move me");
    store.dispatch(taskMoved({ taskId: task.id, toColumnId: done, toIndex: 0 }));
    const s = store.getState().workspace;
    expect(s.columns.entities[done].taskIds[0]).toBe(task.id);
    expect(s.columns.entities[todo].taskIds).not.toContain(task.id);
    expect(s.tasks.entities[task.id].completed).toBe(true);
  });

  it("cascade-deletes a project's tasks", () => {
    const store = seededStore();
    const project = selectAllProjects(store.getState())[0];
    store.dispatch(projectDeleted({ id: project.id }));
    expect(selectAllTasks(store.getState()).some((t) => t.projectId === project.id)).toBe(false);
  });
});

describe("filterTasks", () => {
  const tasks = [
    { id: "1", title: "Write docs", priority: "high", assigneeId: "u1", labels: ["docs"], completed: false, dueDate: "2020-01-01" },
    { id: "2", title: "Fix bug", priority: "low", assigneeId: null, labels: [], completed: true, dueDate: null },
  ];
  it("combines filters", () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: "docs" }).map((t) => t.id)).toEqual(["1"]);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, assigneeId: "unassigned" }).map((t) => t.id)).toEqual(["2"]);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, due: "overdue" }, "2024-01-01").map((t) => t.id)).toEqual(["1"]);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, priority: "high", status: "completed" })).toEqual([]);
  });
});

describe("validateProject", () => {
  it("requires a name of 3+ chars", () => {
    expect(validateProject({ name: "", description: "" }).name).toBeTruthy();
    expect(validateProject({ name: "ab", description: "" }).name).toBeTruthy();
    expect(validateProject({ name: "Good name", description: "" })).toEqual({});
  });
});
