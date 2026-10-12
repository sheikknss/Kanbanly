import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { USERS, ROLE_LABELS } from "@/api/users";
import { UserAvatar } from "@/components/common";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Kanbanly" },
      { name: "description", content: "Pick a demo account to explore Kanbanly." },
      { property: "og:title", content: "Sign in — Kanbanly" },
      { property: "og:description", content: "Pick a demo account to explore Kanbanly." },
    ],
  }),
  component: LoginPage,
});

const PERMS = {
  admin: "Everything, including deleting projects and resetting data.",
  manager: "Create, edit and archive projects; manage columns.",
  member: "Work on tasks: create, move, edit and comment.",
};

function LoginPage() {
  const { user, ready, login } = useAuth();
  if (ready && user) return <Navigate to="/dashboard" />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="grid-paper hidden flex-col justify-between border-r bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded bg-primary font-display font-bold text-primary-foreground">K</span>
          <span className="font-display text-xl font-bold">Kanbanly</span>
        </div>
        <div>
          <p className="eyebrow mb-3">React learning project</p>
          <h1 className="max-w-md text-5xl font-bold leading-tight">Move the work, not the meeting.</h1>
          <p className="mt-4 max-w-sm text-muted-foreground">Context, Zustand and Redux Toolkit — each doing the job it’s best at.</p>
        </div>
        <p className="eyebrow">Mock sign-in · data stays in your browser</p>
      </div>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">Choose a demo account</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Each role sees different actions.</p>
          <ul className="space-y-2">
            {USERS.map((u) => (
              <li key={u.id}>
                <button onClick={() => login(u.id)} className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary">
                  <UserAvatar userId={u.id} size="md" />
                  <span>
                    <span className="block text-sm font-semibold">{u.name} <span className="eyebrow ml-1">{ROLE_LABELS[u.role]}</span></span>
                    <span className="block text-xs text-muted-foreground">{PERMS[u.role]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
