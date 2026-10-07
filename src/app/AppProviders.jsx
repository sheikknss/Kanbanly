import { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { makeStore } from "@/store/redux/store";
import { selectPersistable } from "@/store/redux/workspaceSlice";
import { saveWorkspace } from "@/api/mockApi";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

/**
 * Composition root: every global provider lives here, so the rest of the
 * tree doesn't care where state comes from.
 */
export function AppProviders({ children }) {
  // Lazy initializer → store is created once per mount, not on every render.
  const [store] = useState(() => makeStore());

  // Persistence: subscribe to the store and write a debounced snapshot.
  useEffect(() => {
    let timer;
    let last;
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (state.workspace.status !== "succeeded") return;
      const snapshot = selectPersistable(state);
      if (snapshot === last) return; // memoized selector → cheap equality check
      last = snapshot;
      clearTimeout(timer);
      timer = setTimeout(() => saveWorkspace(snapshot), 300);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [store]);

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
