/**
 * Pure function → trivially unit-testable and reusable from hooks,
 * selectors or a server. Filters combine with AND semantics.
 */
export function filterTasks(tasks, filters, today = new Date().toISOString().slice(0, 10)) {
  const q = filters.search.trim().toLowerCase();
  const weekAhead = addDays(today, 7);
  return tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority) return false;
    if (filters.assigneeId === "unassigned" && t.assigneeId) return false;
    if (filters.assigneeId !== "all" && filters.assigneeId !== "unassigned" && t.assigneeId !== filters.assigneeId) return false;
    if (filters.label !== "all" && !t.labels.includes(filters.label)) return false;
    if (filters.status === "open" && t.completed) return false;
    if (filters.status === "completed" && !t.completed) return false;
    if (filters.due === "overdue" && !(t.dueDate && t.dueDate < today && !t.completed)) return false;
    if (filters.due === "week" && !(t.dueDate && t.dueDate >= today && t.dueDate <= weekAhead)) return false;
    if (filters.due === "none" && t.dueDate) return false;
    return true;
  });
}

export function addDays(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
