import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { CONCEPTS } from "@/data/concepts";
import { PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authed/react-concepts")({
  head: () => ({
    meta: [
      { title: "React Concepts — Kanbanly" },
      { name: "description", content: "Every React concept used in this project, with code and interview questions." },
      { property: "og:title", content: "React Concepts — Kanbanly" },
      { property: "og:description", content: "Every React concept used in this project, with code and interview questions." },
    ],
  }),
  component: ConceptsPage,
});

function ConceptsPage() {
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);
  const list = useMemo(
    () => CONCEPTS.filter((c) => (c.name + c.what + c.where).toLowerCase().includes(dq.toLowerCase())),
    [dq],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={`${CONCEPTS.length} concepts`} title="React concepts in this project">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter concepts…" aria-label="Filter concepts" className="h-9 w-56" />
      </PageHeader>
      <div className="space-y-3">
        {list.map((c) => (
          <details key={c.name} className="group rounded-xl border bg-card open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span className="font-display font-semibold">{c.name}</span>
              <span className="text-sm text-muted-foreground">{c.what}</span>
            </summary>
            <div className="grid gap-4 border-t px-5 py-4 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                <p><span className="eyebrow block">Where</span>{c.where}</p>
                <p><span className="eyebrow block">Why</span>{c.why}</p>
                <p className="rounded-lg bg-accent p-3 text-accent-foreground"><span className="eyebrow block">Interview question</span>{c.q}</p>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed"><code>{c.code}</code></pre>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
