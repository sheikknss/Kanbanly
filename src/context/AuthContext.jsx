import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getUserById } from "@/api/users";

/**
 * WHY CONTEXT HERE?
 * The current user changes rarely (login/logout) but is read almost
 * everywhere. Context is built into React, needs no library, and its
 * main downside — re-rendering all consumers on change — doesn't matter
 * for state that changes this infrequently.
 */
const AuthContext = createContext(null);
const KEY = "kanban.auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `ready` prevents a flash-redirect to /login before we've read storage.
  const [ready, setReady] = useState(false);

  // Browser storage must be read after hydration, never during render.
  useEffect(() => {
    const id = localStorage.getItem(KEY);
    if (id) setUser(getUserById(id));
    setReady(true);
  }, []);

  const login = useCallback((userId) => {
    localStorage.setItem(KEY, userId);
    setUser(getUserById(userId));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  // Memoize the value so consumers don't re-render when the provider's
  // parent re-renders but auth hasn't changed.
  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
