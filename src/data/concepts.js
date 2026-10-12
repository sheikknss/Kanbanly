/**
 * Content for the /react-concepts page. Each entry points at real code
 * in this project so you can open the file and study it.
 */
export const CONCEPTS = [
  { name: "Components", what: "Functions that return UI.", where: "src/features/board/BoardView.jsx → Board, Column, TaskCard", why: "Split the board into small pieces with one job each.", code: "function TaskCard({ taskId }) {\n  return <article>…</article>;\n}", q: "What's the difference between a component and an element?" },
  { name: "Props", what: "Read-only inputs passed from parent to child.", where: "<Column columnId visible />", why: "Columns don't know where data comes from — they get IDs.", code: "<Column columnId={id} visible={visible} />", q: "Why should props never be mutated?" },
  { name: "State / useState", what: "Data that changes over time and triggers a re-render.", where: "GlobalSearch query, column rename draft", why: "Local, short-lived UI values belong in the component.", code: "const [query, setQuery] = useState(\"\");", q: "Why use the functional updater setX(prev => …)?" },
  { name: "useEffect", what: "Syncs a component with something outside React.", where: "ThemeContext (DOM class), useDebounce (timer), AppProviders (store subscription)", why: "Side effects must run after render, with cleanup.", code: "useEffect(() => {\n  const t = setTimeout(…);\n  return () => clearTimeout(t);\n}, [value]);", q: "When does the cleanup function run?" },
  { name: "useMemo", what: "Caches a computed value between renders.", where: "BoardView: visible task Set, labels; useFilteredTasks", why: "Filtering is skipped when tasks & filters haven't changed, and memoized values keep props stable for React.memo children.", code: "const visible = useMemo(\n  () => new Set(filtered.map(t => t.id)),\n  [filtered]\n);", q: "Is useMemo a semantic guarantee or a performance hint?" },
  { name: "useCallback", what: "Caches a function identity.", where: "BoardView onDragEnd, AuthContext login/logout", why: "Stable functions avoid breaking memoization of consumers/effects.", code: "const login = useCallback(id => …, []);", q: "When is useCallback useless?" },
  { name: "useRef", what: "A mutable box that persists without re-rendering.", where: "GlobalSearch input focus, useKeyboardShortcut latest-handler", why: "Imperative DOM access and values that must not trigger renders.", code: "const inputRef = useRef(null);\ninputRef.current?.focus();", q: "useRef vs useState — when to pick which?" },
  { name: "useContext", what: "Reads the nearest Provider's value.", where: "useAuth(), useTheme()", why: "Avoids prop-drilling stable global values.", code: "const { user } = useAuth();", q: "What re-renders when a context value changes?" },
  { name: "Custom Hooks", what: "Functions that compose hooks into reusable logic.", where: "src/hooks/index.js", why: "useFilteredTasks, usePermissions, useDebounce are shared by many components.", code: "export function useDebounce(v, ms) { … }", q: "Do two components using the same custom hook share state?" },
  { name: "React.memo", what: "Skips re-rendering when props are shallow-equal.", where: "Column, TaskCard, UserAvatar, PriorityBadge", why: "Dragging/editing one card shouldn't re-render 50 others.", code: "const TaskCard = memo(function TaskCard(p) { … });", q: "Why can an inline object prop defeat React.memo?" },
  { name: "lazy + Suspense", what: "Load a component's code on demand and show a fallback meanwhile.", where: "Board route (BoardView), Dashboard (charts)", why: "dnd-kit and recharts stay out of the initial bundle.", code: "const Board = lazy(() => import(\"…/BoardView\"));\n<Suspense fallback={<PageLoader/>}><Board/></Suspense>", q: "How does code splitting improve first load?" },
  { name: "useTransition / startTransition", what: "Marks a state update as non-urgent.", where: "FilterBar selects, Projects page tabs", why: "UI stays responsive; React can interrupt the heavy render.", code: "const [isPending, start] = useTransition();\nstart(() => setFilter(k, v));", q: "useTransition vs debouncing?" },
  { name: "useDeferredValue", what: "Gives you a lagging copy of a value.", where: "useFilteredTasks, GlobalSearch", why: "Input updates instantly; the expensive list renders with the deferred value.", code: "const deferred = useDeferredValue(query);", q: "When do you prefer useDeferredValue over useTransition?" },
  { name: "Controlled components", what: "Form inputs whose value lives in React state.", where: "ProjectFormDialog, FilterBar", why: "Enables validation, derived errors and reset.", code: "<Input value={v} onChange={e => setV(e.target.value)} />", q: "Controlled vs uncontrolled inputs?" },
  { name: "Derived state", what: "Values computed from state instead of stored.", where: "Form errors, unread notification count, dashboard stats", why: "One source of truth — nothing to keep in sync.", code: "const errors = validateProject(values);", q: "Why is copying props into state an anti-pattern?" },
  { name: "Lifting state", what: "Moving state to the closest common parent.", where: "Filters lifted out of the board into Zustand", why: "FilterBar and every Column read the same filters.", code: "const filters = useUIStore(s => s.filters);", q: "When does lifting state become prop-drilling?" },
  { name: "Composition", what: "Building UI by nesting components / passing children.", where: "AppShell({children}), TaskDetail reused in modal & page", why: "Reuse without inheritance.", code: "<AppShell><Outlet /></AppShell>", q: "Composition vs inheritance in React?" },
  { name: "Error boundaries", what: "Class components that catch render errors in children.", where: "src/components/common.jsx → ErrorBoundary around routes", why: "One crashed widget doesn't blank the whole app.", code: "static getDerivedStateFromError(e) { return { error: e }; }", q: "Which errors do boundaries NOT catch?" },
  { name: "Client-side routing", what: "Changing views without full page reloads.", where: "src/routes/* — nested, dynamic ($projectId), protected (_authed)", why: "Fast navigation, shareable URLs.", code: "<Link to=\"/projects/$projectId\" params={{ projectId }} />", q: "How do you implement a protected route?" },
  { name: "State management", what: "Choosing where state lives.", where: "Context (auth/theme), Zustand (UI), Redux Toolkit (business data)", why: "Each tool fits a different shape of state — see /state-management.", code: "useAuth() · useUIStore() · useSelector()", q: "Context vs Zustand vs Redux — how do you decide?" },
];

export const STATE_TOOLS = [
  {
    name: "Context API",
    usedFor: "Auth user, theme",
    flow: "Provider value → useContext → every consumer re-renders on change",
    code: "const AuthContext = createContext(null);\n<AuthContext.Provider value={value}>…\nconst { user } = useContext(AuthContext);",
    when: ["Rarely-changing global values", "Dependency injection (theme, i18n, current user)"],
    whenNot: ["High-frequency updates (typing, dragging)", "Large app data with many writers"],
    pros: ["Built into React", "No dependencies", "Simple mental model"],
    cons: ["All consumers re-render on any change", "No devtools / middleware", "Provider nesting"],
    perf: "Memoize the value object and split contexts by concern to limit re-renders.",
  },
  {
    name: "Zustand",
    usedFor: "Sidebar, filters, open dialogs",
    flow: "set() → store → components subscribed via selector re-render only if their slice changed",
    code: "const useUIStore = create(set => ({\n  filters: DEFAULT,\n  setFilter: (k, v) => set(s => ({ filters: { ...s.filters, [k]: v } })),\n}));\nconst filters = useUIStore(s => s.filters);",
    when: ["UI state shared by scattered components", "Frequently-changing values", "Tiny boilerplate wanted"],
    whenNot: ["You need strict action logs / time travel", "Large teams wanting enforced conventions"],
    pros: ["~1KB", "No provider", "Selector-based subscriptions"],
    cons: ["Fewer conventions", "Less structured for complex domains"],
    perf: "Select the smallest slice; avoid returning new objects from selectors.",
  },
  {
    name: "Redux Toolkit",
    usedFor: "Projects, columns, tasks, comments, activity",
    flow: "dispatch(action) → reducer (Immer) → new state → useSelector subscribers compare results",
    code: "dispatch(taskMoved({ taskId, toColumnId, toIndex }));\nconst task = useSelector(s => selectTaskById(s, id));",
    when: ["Complex, relational business data", "Many actions touching the same entities", "Need devtools, middleware, async thunks"],
    whenNot: ["Small apps", "Purely local UI state"],
    pros: ["Predictable", "Great devtools", "Entity adapters + memoized selectors", "Standard async lifecycle"],
    cons: ["More concepts to learn", "More files"],
    perf: "Normalize data, select by id in leaf components, memoize derived data with createSelector.",
  },
];
