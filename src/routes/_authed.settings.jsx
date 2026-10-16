import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks";
import { useMenuVisibilityStore } from "@/store/zustand/uiStore";
import { isErrorSimulationOn, resetWorkspace, setErrorSimulation } from "@/api/mockApi";
import { fetchWorkspace } from "@/store/redux/workspaceSlice";
import { ROLE_LABELS, USERS } from "@/api/users";
import { ErrorBoundary, PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kanbanly" },
      { name: "description", content: "Theme, account and developer tools." },
      { property: "og:title", content: "Settings — Kanbanly" },
      { property: "og:description", content: "Theme, account and developer tools." },
    ],
  }),
  component: SettingsPage,
});

function Bomb() {
  throw new Error("Boom! Thrown during render on purpose.");
}

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, login } = useAuth();
  const can = usePermissions();
  const dispatch = useDispatch();
  const hiddenMenuItems = useMenuVisibilityStore((s) => s.hiddenMenuItems);
  const setMenuItemHidden = useMenuVisibilityStore((s) => s.setMenuItemHidden);
  const [simError, setSimError] = useState(false);
  const [explode, setExplode] = useState(false);

  useEffect(() => setSimError(isErrorSimulationOn()), []);

  const row = "flex items-center justify-between gap-4 border-b py-4 last:border-0";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Preferences" title="Settings" />
      <section className="rounded-xl border bg-card px-5">
        <div className={row}>
          <Label htmlFor="dark">
            Dark theme{" "}
            <span className="block text-xs font-normal text-muted-foreground">
              Stored via ThemeContext
            </span>
          </Label>
          <Switch id="dark" checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
        <div className={row}>
          <div className="text-sm font-medium">
            Switch account{" "}
            <span className="block text-xs font-normal text-muted-foreground">
              Try each role’s permissions
            </span>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {USERS.map((u) => (
              <Button
                key={u.id}
                size="sm"
                variant={u.id === user?.id ? "default" : "outline"}
                onClick={() => login(u.id)}
              >
                {ROLE_LABELS[u.role].split(" ")[0]} · {u.name.split(" ")[0]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <h2 className="eyebrow mb-2 mt-8">Menu</h2>
      <section className="rounded-xl border bg-card px-5">
        <div className={row}>
          <Label htmlFor="hide-react-concepts">Hide React Concepts menu</Label>
          <Switch
            id="hide-react-concepts"
            checked={hiddenMenuItems.reactConcepts}
            onCheckedChange={(hidden) => setMenuItemHidden("reactConcepts", hidden)}
          />
        </div>
        <div className={row}>
          <Label htmlFor="hide-state-management">Hide State Management menu</Label>
          <Switch
            id="hide-state-management"
            checked={hiddenMenuItems.stateManagement}
            onCheckedChange={(hidden) => setMenuItemHidden("stateManagement", hidden)}
          />
        </div>
        <div className={row}>
          <Label htmlFor="hide-components">Hide Components menu</Label>
          <Switch
            id="hide-components"
            checked={hiddenMenuItems.components}
            onCheckedChange={(hidden) => setMenuItemHidden("components", hidden)}
          />
        </div>
      </section>

      <h2 className="eyebrow mb-2 mt-8">Developer tools</h2>
      <section className="rounded-xl border bg-card px-5">
        <div className={row}>
          <Label htmlFor="err">
            Simulate API failure{" "}
            <span className="block text-xs font-normal text-muted-foreground">
              Next workspace load will fail
            </span>
          </Label>
          <Switch
            id="err"
            checked={simError}
            onCheckedChange={(v) => {
              setErrorSimulation(v);
              setSimError(v);
            }}
          />
        </div>
        <div className={row}>
          <div className="text-sm font-medium">
            Reload workspace{" "}
            <span className="block text-xs font-normal text-muted-foreground">
              Re-runs the async thunk (loading / error states)
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch(fetchWorkspace())}>
            Reload
          </Button>
        </div>
        <div className={row}>
          <div className="text-sm font-medium">
            Test error boundary{" "}
            <span className="block text-xs font-normal text-muted-foreground">
              Crash a component on purpose
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setExplode(true)}>
            Crash it
          </Button>
        </div>
        {explode && (
          <div className="pb-4">
            <ErrorBoundary title="Caught by the boundary">
              <Bomb />
            </ErrorBoundary>
          </div>
        )}
        {can.canResetData && (
          <div className={row}>
            <div className="text-sm font-medium">
              Reset demo data{" "}
              <span className="block text-xs font-normal text-muted-foreground">Admins only</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!confirm("Reset all data to the demo seed?")) return;
                resetWorkspace();
                dispatch(fetchWorkspace());
                toast.success("Demo data restored");
              }}
            >
              Reset
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
