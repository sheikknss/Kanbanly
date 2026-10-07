import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { filterTasks } from "@/utils/filterTasks";

/** Debounce any value — e.g. to avoid saving on every keystroke. */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t); // cleanup cancels the previous timer
  }, [value, delay]);
  return debounced;
}

/** useState that survives reloads. Reads storage after mount (SSR-safe). */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw !== null) setValue(JSON.parse(raw));
  }, [key]);
  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const v = typeof next === "function" ? next(prev) : next;
        localStorage.setItem(key, JSON.stringify(v));
        return v;
      });
    },
    [key],
  );
  return [value, set];
}

/**
 * Global keyboard shortcut. The handler is stored in a ref so the
 * listener is attached ONCE, yet always calls the latest handler —
 * a common useRef pattern ("latest ref").
 */
export function useKeyboardShortcut(key, handler, { ignoreInputs = true } = {}) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (ignoreInputs && (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable)) return;
      if (e.key === key) handlerRef.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, ignoreInputs]);
}

/**
 * Filters tasks with two performance tools:
 *  - useDeferredValue: typing stays instant; the expensive filtered list
 *    renders at lower priority with the "stale" search until React catches up.
 *  - useMemo: the filter only re-runs when tasks or filters change,
 *    not on unrelated re-renders (e.g. a dialog opening).
 */
export function useFilteredTasks(tasks, filters) {
  const deferredFilters = useDeferredValue(filters);
  const filtered = useMemo(() => filterTasks(tasks, deferredFilters), [tasks, deferredFilters]);
  return { filtered, isStale: filters !== deferredFilters };
}

/** Role-based permissions derived from the current user. */
export function usePermissions() {
  const { user } = useAuth();
  return useMemo(() => {
    const role = user?.role;
    const isAdmin = role === "admin";
    const isManager = role === "manager" || isAdmin;
    return {
      role,
      canCreateProject: isManager,
      canEditProject: isManager,
      canDeleteProject: isAdmin,
      canArchiveProject: isManager,
      canManageColumns: isManager,
      canDeleteTask: isManager,
      canEditTask: !!role,
      canResetData: isAdmin,
    };
  }, [user]);
}

/** Tracks whether a media query matches (resize-aware). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
