import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/layouts/AppShell";
import { ErrorBoundary, ErrorState, PageLoader } from "@/components/common";
import { fetchWorkspace } from "@/store/redux/workspaceSlice";

/**
 * PROTECTED LAYOUT ROUTE.
 * The "_" prefix makes it pathless: it wraps /dashboard, /projects… without
 * adding to the URL. It (1) guards auth, (2) loads workspace data once,
 * (3) renders the app shell around <Outlet/>.
 */
export const Route = createFileRoute("/_authed")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, ready } = useAuth();
  const dispatch = useDispatch();
  const status = useSelector((s) => s.workspace.status);
  const error = useSelector((s) => s.workspace.error);

  useEffect(() => {
    if (user && status === "idle") dispatch(fetchWorkspace());
  }, [user, status, dispatch]);

  if (!ready) return <PageLoader label="Checking session" />;
  if (!user) return <Navigate to="/login" />;

  return (
    <AppShell>
      {status === "failed" ? (
        <ErrorState title="Couldn’t load your workspace" message={error} onRetry={() => dispatch(fetchWorkspace())} />
      ) : status !== "succeeded" ? (
        <PageLoader label="Loading workspace" />
      ) : (
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      )}
    </AppShell>
  );
}
