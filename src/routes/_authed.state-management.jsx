import { createFileRoute } from "@tanstack/react-router";
import { STATE_TOOLS } from "@/data/concepts";
import { PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authed/state-management")({
  head: () => ({
    meta: [
      { title: "State Management — Kanbanly" },
      { name: "description", content: "Context API vs Zustand vs Redux Toolkit, compared with real code." },
      { property: "og:title", content: "State Management — Kanbanly" },
      { property: "og:description", content: "Context API vs Zustand vs Redux Toolkit, compared with real code." },
    ],
  }),
  component: StatePage,
});

function List({ title, items }) {
  return (
    <div>
      <p className="eyebrow mb-1">{title}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

function StatePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Context · Zustand · Redux Toolkit" title="State management, compared" />
      <div className="mb-6 rounded-xl border bg-card p-5 font-mono text-xs leading-6">
        <p className="eyebrow mb-2">Architecture</p>
        <pre className="overflow-x-auto">{`<AppProviders>
 ├─ Redux <Provider>     → projects · columns · tasks · activity
 ├─ <ThemeProvider>      → theme
 └─ <AuthProvider>       → current user
useUIStore (no provider) → sidebar · filters · dialogs`}</pre>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {STATE_TOOLS.map((t) => (
          <article key={t.name} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <header>
              <h2 className="text-xl font-bold">{t.name}</h2>
              <p className="text-sm text-muted-foreground">Here: {t.usedFor}</p>
            </header>
            <p className="rounded-lg bg-accent p-3 text-xs text-accent-foreground"><span className="eyebrow block">State flow</span>{t.flow}</p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed"><code>{t.code}</code></pre>
            <List title="When to use" items={t.when} />
            <List title="When not to" items={t.whenNot} />
            <List title="Pros" items={t.pros} />
            <List title="Cons" items={t.cons} />
            <p className="text-sm"><span className="eyebrow block">Performance</span>{t.perf}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
