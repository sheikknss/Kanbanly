import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { STORIES } from "@/stories/catalog";
import { ErrorBoundary } from "@/components/common";
import { SourceSnippet } from "@/components/SourceSnippet";
import { cn } from "@/lib/utils";

/**
 * In-app, Storybook-style component explorer. It renders the SAME story
 * catalog that Storybook uses (src/stories/catalog.jsx).
 */
export default function ComponentsGallery() {
  const [activeId, setActiveId] = useState(STORIES[0].id);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("preview");

  const groups = useMemo(() => {
    const list = STORIES.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
    return list.reduce((acc, s) => ((acc[s.group] ??= []).push(s), acc), {});
  }, [q]);
  const story = STORIES.find((s) => s.id === activeId);
  const Render = story.render;

  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border bg-card md:flex-row">
      <aside className="border-b bg-sidebar p-3 md:w-60 md:shrink-0 md:border-b-0 md:border-r" aria-label="Stories">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find component…" aria-label="Find component" className="mb-3 h-8 text-xs" />
        <nav className="max-h-56 space-y-4 overflow-y-auto md:max-h-none">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="eyebrow mb-1 px-2">{group}</p>
              <ul>
                {items.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActiveId(s.id)}
                      aria-current={s.id === activeId}
                      className={cn("w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent", s.id === activeId && "bg-sidebar-accent font-medium")}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="border-b px-5 py-4">
          <p className="eyebrow">{story.group}</p>
          <h2 className="text-xl font-bold">{story.name}</h2>
          <p className="text-sm text-muted-foreground">{story.description}</p>
          <div role="tablist" className="mt-3 flex gap-4 text-sm">
            {["preview", "usage", "source"].map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("border-b-2 pb-1 capitalize", tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground")}>
                {t}
              </button>
            ))}
          </div>
        </header>
        <div className="p-5">
          {tab === "preview" && (
            <div className="grid-paper rounded-lg border bg-background p-6">
              {/* key resets the boundary when switching stories */}
              <ErrorBoundary key={story.id}><Render /></ErrorBoundary>
            </div>
          )}
          {tab === "usage" && <pre className="rounded-lg bg-muted p-4 font-mono text-xs"><code>{story.usage}</code></pre>}
          {tab === "source" && (
            story.file.endsWith(".tsx")
              ? <p className="text-sm text-muted-foreground">Library component at src/{story.file} (shadcn/ui).</p>
              : <SourceSnippet file={story.file} match={story.name.replace(/ .*/, "")} lines={40} />
          )}
        </div>
      </section>
    </div>
  );
}
