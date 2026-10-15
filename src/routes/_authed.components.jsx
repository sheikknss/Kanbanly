import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageHeader, PageLoader } from "@/components/common";
import { STORIES } from "@/stories/catalog";

const ComponentsGallery = lazy(() => import("@/features/components-gallery/ComponentsGallery"));

export const Route = createFileRoute("/_authed/components")({
  head: () => ({
    meta: [
      { title: "Components — Kanbanly" },
      { name: "description", content: "Storybook-style catalog of every React component in the project." },
      { property: "og:title", content: "Components — Kanbanly" },
      { property: "og:description", content: "Storybook-style catalog of every React component in the project." },
    ],
  }),
  component: ComponentsPage,
});

function ComponentsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={`${STORIES.length} components · same stories as Storybook`} title="Component library">
        <code className="rounded border bg-muted px-2 py-1 font-mono text-xs">bun run storybook</code>
      </PageHeader>
      <Suspense fallback={<PageLoader label="Loading components" />}>
        <ComponentsGallery />
      </Suspense>
    </div>
  );
}
