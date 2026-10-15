# Kanbanly — Advanced React Learning Project

A collaborative Kanban / project-management app built to study and explain modern React in interviews. Feature code is plain JavaScript (`.js` / `.jsx`).

## Tech stack
React 19 · Vite · TanStack Router (file-based routes in `src/routes`) · Tailwind CSS v4 · shadcn/ui · dnd-kit · Redux Toolkit · Zustand · Context API · Recharts · Vitest

## State management
| Tool | Owns | Why |
|---|---|---|
| Context | auth user, theme | rarely changes, read everywhere |
| Zustand | sidebar, filters, dialogs | frequent UI updates, selector subscriptions |
| Redux Toolkit | projects, columns, tasks, comments, activity | relational business data, many actions, devtools |

## Structure
```
src/api          mock API service (localStorage + latency) and users
src/store/redux  workspaceSlice (entity adapters, thunks, memoized selectors)
src/store/zustand uiStore
src/context      AuthContext, ThemeContext
src/hooks        useDebounce, useLocalStorage, useKeyboardShortcut, useFilteredTasks, usePermissions, useMediaQuery
src/features     board, tasks, projects, dashboard, notifications
src/layouts      AppShell
src/routes       _authed (protected layout), dashboard, projects/$projectId(/board), tasks/$taskId, settings, react-concepts, state-management
src/tests        reducer, filter and validation tests
```

## Performance
Normalized state, select-by-id leaf components, `React.memo` cards, `useMemo` filtering, `useDeferredValue` search, `useTransition` filters, lazy-loaded board and charts.

## Testing
`bunx vitest run`

## Future improvements
Real backend, realtime collaboration, optimistic updates with rollback, E2E tests.
