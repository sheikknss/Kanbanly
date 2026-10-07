/**
 * Mock user directory. In a real app this would come from GET /users.
 * Roles drive permissions — see src/hooks/usePermissions.js.
 */
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
};

export const ROLE_LABELS = {
  admin: "Admin",
  manager: "Project Manager",
  member: "Member",
};

export const USERS = [
  { id: "u1", name: "Ada Okafor", email: "ada@kanban.dev", role: ROLES.ADMIN },
  { id: "u2", name: "Mateo Ruiz", email: "mateo@kanban.dev", role: ROLES.MANAGER },
  { id: "u3", name: "Priya Shah", email: "priya@kanban.dev", role: ROLES.MEMBER },
  { id: "u4", name: "Jonas Berg", email: "jonas@kanban.dev", role: ROLES.MEMBER },
];

export const getUserById = (id) => USERS.find((u) => u.id === id) ?? null;

export const initials = (name = "") =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
