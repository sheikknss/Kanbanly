import { create } from "zustand";

/**
 * WHY ZUSTAND HERE?
 * This is ephemeral *UI* state: is the sidebar open, which task dialog is
 * showing, what the user typed in the filters. It:
 *  - changes often (every keystroke)
 *  - is read by a few scattered components
 *  - doesn't need an action log, middleware or normalization
 *
 * Zustand components subscribe with a selector — `useUIStore(s => s.filters)`
 * — and only re-render when THAT slice changes. Putting this in Context
 * would re-render every consumer on every keystroke; putting it in Redux
 * would add ceremony for no benefit.
 */

export const DEFAULT_FILTERS = {
  search: "",
  priority: "all",
  assigneeId: "all",
  label: "all",
  status: "all", // all | open | completed
  due: "all", // all | overdue | week | none
};

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  filters: DEFAULT_FILTERS,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  activeTaskId: null,
  openTask: (id) => set({ activeTaskId: id }),
  closeTask: () => set({ activeTaskId: null }),

  projectDialog: { open: false, projectId: null },
  openProjectDialog: (projectId = null) => set({ projectDialog: { open: true, projectId } }),
  closeProjectDialog: () => set({ projectDialog: { open: false, projectId: null } }),
}));

/** Derived helper selector: how many filters are not default. */
export const selectActiveFilterCount = (s) =>
  Object.entries(s.filters).filter(([k, v]) => v !== DEFAULT_FILTERS[k]).length;
