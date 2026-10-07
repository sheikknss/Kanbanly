import { nanoid } from "@reduxjs/toolkit";

/**
 * Mock API layer.
 *
 * WHY: Components never talk to localStorage directly. They dispatch Redux
 * thunks, and thunks call this "service". Swapping this file for real
 * fetch() calls would not require touching any component — that's the
 * point of a service layer.
 *
 * Every call is async with an artificial delay so loading states are real.
 */

const STORAGE_KEY = "kanban.workspace.v1";
const ERROR_FLAG_KEY = "kanban.simulateError";
const LATENCY_MS = 550;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isErrorSimulationOn() {
  return localStorage.getItem(ERROR_FLAG_KEY) === "1";
}

export function setErrorSimulation(on) {
  localStorage.setItem(ERROR_FLAG_KEY, on ? "1" : "0");
}

export async function fetchWorkspace() {
  await delay(LATENCY_MS);
  if (isErrorSimulationOn()) {
    throw new Error("Simulated network error (503). Turn it off in Settings.");
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Corrupt storage — fall through to seed data.
    }
  }
  const seed = createSeed();
  saveWorkspace(seed);
  return seed;
}

export function saveWorkspace(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetWorkspace() {
  localStorage.removeItem(STORAGE_KEY);
}

export const DEFAULT_COLUMNS = ["To Do", "In Progress", "Review", "Done"];

/**
 * Builds demo data lazily (never at module scope: edge runtimes forbid
 * random IDs / Date at import time, and it keeps the module pure).
 */
export function createSeed() {
  const now = Date.now();
  const day = 86_400_000;
  const dateIn = (d) => new Date(now + d * day).toISOString().slice(0, 10);
  const at = (d) => new Date(now + d * day).toISOString();

  const projects = [];
  const columns = [];
  const tasks = [];

  const blueprint = [
    {
      name: "Website Relaunch",
      description: "Rebuild the marketing site with the new brand system.",
      color: "chart-1",
      dueDate: dateIn(21),
      archived: false,
      created: -30,
      tasks: [
        ["Audit existing pages", 3, "low", "u3", ["research"], -6],
        ["Design hero variations", 1, "high", "u2", ["design"], 2],
        ["Set up CMS content model", 1, "medium", "u4", ["backend"], 5],
        ["Write homepage copy", 0, "medium", "u3", ["content"], 8],
        ["Accessibility review", 0, "urgent", "u1", ["a11y", "qa"], 1],
        ["Implement pricing page", 2, "high", "u4", ["frontend"], -1],
        ["Analytics events plan", 0, "low", null, ["research"], 14],
      ],
    },
    {
      name: "Mobile App v2",
      description: "Offline mode, push notifications and a refreshed onboarding.",
      color: "chart-2",
      dueDate: dateIn(45),
      archived: false,
      created: -20,
      tasks: [
        ["Offline sync strategy", 1, "urgent", "u1", ["backend"], 3],
        ["Onboarding flow wireframes", 3, "medium", "u2", ["design"], -4],
        ["Push notification service", 0, "high", "u4", ["backend"], 10],
        ["Crash reporting setup", 2, "medium", "u3", ["qa"], 0],
        ["Dark mode polish", 0, "low", "u3", ["frontend", "design"], 18],
      ],
    },
    {
      name: "Q4 Marketing",
      description: "Campaign planning for the end-of-year launch.",
      color: "chart-3",
      dueDate: dateIn(60),
      archived: false,
      created: -10,
      tasks: [
        ["Campaign brief", 3, "high", "u2", ["content"], -8],
        ["Partner outreach list", 1, "medium", "u3", ["research"], 6],
        ["Launch video storyboard", 0, "medium", null, ["design"], 12],
      ],
    },
    {
      name: "Legacy Billing Migration",
      description: "Moved off the old billing provider. Kept for reference.",
      color: "chart-5",
      dueDate: dateIn(-15),
      archived: true,
      created: -90,
      tasks: [["Final data export", 3, "medium", "u1", ["backend"], -20]],
    },
  ];

  for (const bp of blueprint) {
    const projectId = nanoid();
    const cols = DEFAULT_COLUMNS.map((title) => ({
      id: nanoid(),
      projectId,
      title,
      taskIds: [],
    }));
    for (const [title, colIdx, priority, assigneeId, labels, due] of bp.tasks) {
      const col = cols[colIdx];
      const task = {
        id: nanoid(),
        projectId,
        columnId: col.id,
        title,
        description: "",
        priority,
        assigneeId,
        labels,
        dueDate: dateIn(due),
        completed: col.title === "Done",
        comments: [],
        createdAt: at(bp.created + 1),
      };
      col.taskIds.push(task.id);
      tasks.push(task);
    }
    columns.push(...cols);
    projects.push({
      id: projectId,
      name: bp.name,
      description: bp.description,
      color: bp.color,
      dueDate: bp.dueDate,
      archived: bp.archived,
      ownerId: "u2",
      createdAt: at(bp.created),
      columnIds: cols.map((c) => c.id),
    });
  }

  const activity = [
    { id: nanoid(), type: "project", message: "created project “Q4 Marketing”", actor: "Mateo Ruiz", at: at(-10) },
    { id: nanoid(), type: "move", message: "moved “Campaign brief” to Done", actor: "Mateo Ruiz", at: at(-1) },
    { id: nanoid(), type: "assign", message: "assigned “Accessibility review” to Ada Okafor", actor: "Ada Okafor", at: at(-0.2) },
  ];

  return { projects, columns, tasks, activity, lastReadAt: null };
}
