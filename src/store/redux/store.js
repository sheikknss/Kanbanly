import { configureStore } from "@reduxjs/toolkit";
import workspaceReducer from "./workspaceSlice";

/**
 * Store FACTORY rather than a module-level singleton.
 * With server rendering, a singleton would be shared between requests.
 * Each browser session creates exactly one store in <AppProviders/>.
 */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: { workspace: workspaceReducer },
    preloadedState,
  });
}
