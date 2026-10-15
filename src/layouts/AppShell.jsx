import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BookOpen,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  Component as ComponentIcon,
  Settings,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUIStore } from "@/store/zustand/uiStore";
import { useMediaQuery } from "@/hooks";
import { ROLE_LABELS } from "@/api/users";
import { UserAvatar } from "@/components/common";
import { NotificationCenter } from "@/features/notifications/NotificationCenter";
import { GlobalSearch } from "@/features/tasks/GlobalSearch";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/react-concepts", label: "React Concepts", icon: BookOpen },
  { to: "/state-management", label: "State Management", icon: Network },
  { to: "/components", label: "Components", icon: ComponentIcon },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  // Selector subscriptions: this component re-renders only when these change.
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Sidebar defaults: open on desktop, closed on mobile.
  useEffect(() => setSidebarOpen(isDesktop), [isDesktop, setSidebarOpen]);
  // Close the mobile drawer after navigating.
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [pathname, isDesktop, setSidebarOpen]);

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>

      {!isDesktop && sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/30" onClick={toggleSidebar} aria-hidden />
      )}

      <aside
        aria-label="Primary"
        className={cn(
          "z-40 flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform",
          isDesktop ? "sticky top-0 h-screen" : "fixed inset-y-0 left-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isDesktop && !sidebarOpen && "hidden",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="grid size-7 place-items-center rounded bg-primary font-display text-sm font-bold text-primary-foreground">K</span>
          <span className="font-display text-lg font-bold">Kanbanly</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent font-medium !text-sidebar-accent-foreground" }}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="flex items-center gap-2 border-t p-3">
            <UserAvatar userId={user.id} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="eyebrow">{ROLE_LABELS[user.role]}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur md:px-5">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar" aria-expanded={sidebarOpen}>
            <Menu className="size-4" />
          </Button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>
        <main id="main" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
