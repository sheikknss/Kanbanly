import { useTransition } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUIStore, selectActiveFilterCount } from "@/store/zustand/uiStore";
import { USERS } from "@/api/users";
import { PRIORITIES } from "@/components/common";

/**
 * Controlled filter inputs bound to Zustand.
 * Select changes are wrapped in startTransition: the dropdown closes
 * instantly (urgent update) and the board re-filters as a non-urgent update.
 */
export function FilterBar({ labels }) {
  const filters = useUIStore((s) => s.filters);
  const setFilter = useUIStore((s) => s.setFilter);
  const reset = useUIStore((s) => s.resetFilters);
  const active = useUIStore(selectActiveFilterCount);
  const [isPending, startTransition] = useTransition();

  const pick = (key) => (value) => startTransition(() => setFilter(key, value));

  const sel = (key, label, options) => (
    <Select value={filters[key]} onValueChange={pick(key)}>
      <SelectTrigger className="h-8 w-[130px] text-xs" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div role="search" className="mb-4 flex flex-wrap items-center gap-2" aria-busy={isPending}>
      <Input
        value={filters.search}
        onChange={(e) => setFilter("search", e.target.value)}
        placeholder="Filter by title…"
        aria-label="Filter tasks by title"
        className="h-8 w-48 text-xs"
      />
      {sel("priority", "Priority", [["all", "Any priority"], ...PRIORITIES.map((p) => [p, p[0].toUpperCase() + p.slice(1)])])}
      {sel("status", "Status", [["all", "Any status"], ["open", "Open"], ["completed", "Completed"]])}
      {sel("assigneeId", "Assignee", [["all", "Anyone"], ["unassigned", "Unassigned"], ...USERS.map((u) => [u.id, u.name])])}
      {sel("label", "Label", [["all", "Any label"], ...labels.map((l) => [l, `#${l}`])])}
      {sel("due", "Due date", [["all", "Any due date"], ["overdue", "Overdue"], ["week", "Due this week"], ["none", "No due date"]])}
      {active > 0 && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs">
          <X className="size-3" /> Clear {active}
        </Button>
      )}
      {isPending && <span className="eyebrow">filtering…</span>}
    </div>
  );
}
