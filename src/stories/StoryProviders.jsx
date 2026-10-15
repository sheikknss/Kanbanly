import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { makeStore } from "@/store/redux/store";
import { fetchWorkspace } from "@/store/redux/workspaceSlice";
import { createSeed } from "@/api/mockApi";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

/**
 * Wraps a story in everything a component expects from the real app:
 * a seeded Redux store, Theme + Auth context (signed in as the Admin)
 * and a memory router so <Link/> works. Used by Storybook's preview.
 */
export function StoryProviders({ children }) {
  const [store] = useState(() => {
    const s = makeStore();
    s.dispatch({ type: fetchWorkspace.fulfilled.type, payload: createSeed() });
    return s;
  });
  const [router] = useState(() =>
    createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() }),
  );
  return (
    <ReduxProvider store={store}>
      <RouterContextProvider router={router}>
        <ThemeProvider>
          <AuthProvider initialUserId="u1">{children}</AuthProvider>
        </ThemeProvider>
      </RouterContextProvider>
    </ReduxProvider>
  );
}
