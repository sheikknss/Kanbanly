import { Component, memo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById, initials } from "@/api/users";
import { cn } from "@/lib/utils";

/**
 * Error boundaries must be class components — there is no hook equivalent
 * for componentDidCatch / getDerivedStateFromError (yet).
 * They catch errors thrown while RENDERING children, not in event handlers.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry/Datadog.
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title={this.props.title ?? "This section crashed"}
          message={this.state.error.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="size-6 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="grid-paper flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action}
    </div>
  );
}

/** React.memo: avatar props rarely change, so skip re-rendering when the parent does. */
export const UserAvatar = memo(function UserAvatar({ userId, size = "sm" }) {
  const user = getUserById(userId);
  const dims = size === "sm" ? "size-6 text-[10px]" : "size-9 text-xs";
  if (!user) {
    return (
      <span className={cn("inline-flex items-center justify-center rounded-full border border-dashed text-muted-foreground", dims)} aria-label="Unassigned">
        ?
      </span>
    );
  }
  return (
    <span
      title={user.name}
      aria-label={user.name}
      className={cn("inline-flex items-center justify-center rounded-full bg-secondary font-mono font-semibold text-secondary-foreground ring-2 ring-surface", dims)}
    >
      {initials(user.name)}
    </span>
  );
});

const PRIORITY_STYLES = {
  low: "bg-priority-low/15 text-priority-low",
  medium: "bg-priority-medium/15 text-priority-medium",
  high: "bg-priority-high/15 text-priority-high",
  urgent: "bg-priority-urgent/15 text-priority-urgent",
};

export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const PriorityBadge = memo(function PriorityBadge({ priority }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider", PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  );
});

export function LabelChip({ label }) {
  return (
    <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">#{label}</span>
  );
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export const PROJECT_COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
const COLOR_BG = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
};
export function ColorDot({ color, className }) {
  return <span aria-hidden className={cn("inline-block size-2.5 rounded-sm", COLOR_BG[color] ?? "bg-chart-5", className)} />;
}
