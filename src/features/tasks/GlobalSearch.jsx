import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { selectAllTasks, selectAllProjects } from "@/store/redux/workspaceSlice";
import { useKeyboardShortcut } from "@/hooks";
import { PriorityBadge } from "@/components/common";

/**
 * Global task search across every project.
 * - Controlled input (`value` + `onChange`) — React owns the value.
 * - useRef gives imperative focus for the "/" shortcut.
 * - useDeferredValue keeps typing snappy while results lag slightly.
 */
export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const tasks = useSelector(selectAllTasks);
  const projects = useSelector(selectAllProjects);
  const deferredQuery = useDeferredValue(query);

  useKeyboardShortcut("/", (e) => {
    e.preventDefault();
    inputRef.current?.focus();
  });

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return [];
    return tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [tasks, deferredQuery]);

  const go = (task) => {
    setOpen(false);
    setQuery("");
    navigate({ to: "/tasks/$taskId", params: { taskId: task.id } });
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlight]) {
      go(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        ref={inputRef}
        role="combobox"
        aria-expanded={showList}
        aria-controls="global-search-results"
        aria-label="Search all tasks"
        placeholder="Search tasks…"
        className="h-9 pl-8 pr-8"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border px-1 font-mono text-[10px] text-muted-foreground">/</kbd>
      {showList && (
        <ul id="global-search-results" role="listbox" className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {results.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No tasks match “{query}”.</li>}
          {results.map((t, i) => (
            <li
              key={t.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={() => go(t)}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${i === highlight ? "bg-accent text-accent-foreground" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{t.title}</span>
                <span className="eyebrow">{projectNames[t.projectId]}</span>
              </span>
              <PriorityBadge priority={t.priority} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
