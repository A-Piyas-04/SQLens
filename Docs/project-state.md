# PostgreSQL Learning Platform Roadmap

> A browser-based PostgreSQL playground with real SQL execution, persistence, and future AI-powered learning features.

---

# ✅ Current Working Features

Users can currently:

- ✅ Run real PostgreSQL queries
- ✅ Create tables
- ✅ Insert data
- ✅ Perform joins
- ✅ Persist database after refresh
- ✅ View rich schema sidebar (columns, types, NULL/default constraints, foreign keys)
- ✅ View query history
- ✅ Reset database
- ✅ Use browser-based PostgreSQL without a backend
- ✅ Results table with sticky headers, NULL styling, copy/export JSON
- ✅ Terminal-style loading banner during query execution
- ✅ Mobile-responsive layout (stacked sidebar, responsive header and buttons)
- ✅ Interactive ERD viewer — live schema visualised as a React Flow graph with FK arrows, zoom, pan, fit view, and minimap
- ✅ Project workspaces — isolated PGlite databases per project with independent schema, ERD, history, and editor draft
- ✅ Selected query runner — run only selected SQL (or fall back to full editor content); Ctrl+Enter shortcut

---

# ✅ Completed Phases

## Phase 1 — Core SQL Playground

All core features shipped. Database persists via IndexedDB (PGlite). Schema extracted from `information_schema` on every query run and DB reset.

## Phase 1.5 — ERD Viewer v1

**Shipped.** An interactive, live Entity Relationship Diagram rendered beside the query workspace.

### Phase 1.5a — ERD Viewer v1

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Extended with `primaryKeys: string[]` per table via `information_schema` PK query |
| `src/lib/erd/buildErdGraph.ts` | Converts `SchemaTable[]` into React Flow `Node[]` and `Edge[]` with auto grid layout |
| `src/components/erd/ErdTableNode.tsx` | Custom React Flow node — table name header, column rows with PK/FK badges and data types |
| `src/components/erd/ErdViewer.tsx` | ReactFlow canvas with Background, Controls, MiniMap, fitView on schema change |
| `src/App.tsx` | ERD panel added below the results table, receives `workspace.tables` |
| `src/index.css` | Dark-theme CSS variable overrides for ReactFlow Controls and MiniMap |

Capabilities: live schema refresh, zoom/pan/fit-view, minimap, FK arrows with labels, PK/FK column badges, empty-state message. No export, no manual editing, no AI (intentionally scoped out).

**Dependency added:** `@xyflow/react` (MIT)

### Phase 1.5b — Project Workspaces

| File | Purpose |
|------|---------|
| `src/lib/projects/projectStore.ts` | `Project` type, CRUD, draft/history localStorage keys, `ensureDefaultProject()` |
| `src/lib/db/createDatabase.ts` | Module-level PGlite instance registry — `getDatabase(projectId)` |
| `src/hooks/useActiveProject.ts` | React state for project list + active project + live `db` instance |
| `src/components/projects/ProjectSwitcher.tsx` | Sidebar dropdown: switch, inline rename, inline delete-confirm, new project |
| `src/lib/db/query.ts` | Refactored to accept `db: PGlite` parameter |
| `src/lib/db/schema.ts` | Refactored to accept `db: PGlite` parameter |
| `src/hooks/useQueryHistory.ts` | Per-project keys (`sqlens-history-{id}`) |
| `src/hooks/useSqlWorkspace.ts` | Accepts `(db, projectId)`; resets on project switch; auto-saves draft |

Each project has its own `idb://sqlens-{projectId}` IndexedDB database, editor draft, and query history.

### Phase 1.5c — Selected Query Runner

| File | Change |
|------|--------|
| `src/components/editor/SqlEditor.tsx` | `onSelectionChange` prop via `onUpdate`; `onRun` prop wired to `Mod-Enter` keymap |
| `src/components/features/QueryToolbar.tsx` | `hasSelection` prop; button label "Run Selection" vs "Run Query"; hint/indicator row |
| `src/hooks/useSqlWorkspace.ts` | `selectedText` + `setSelectedText` state; `handleRunQuery` uses selection if present |
| `src/App.tsx` | Wires `setSelectedText` and `handleRunQuery` into `SqlEditor` and `QueryToolbar` |

Behavior: if selected text is non-empty, only that SQL runs and is saved to history; otherwise the full editor content runs. `Ctrl+Enter` / `Cmd+Enter` triggers the run.

---

# 🚧 Remaining Phase 1 Tasks

## Small Polish Remaining

### 1. Initial Deployment

Deployment target:

- Vercel

---

# 🧠 Future Roadmap

---

# Phase 2 — Beginner Experience Layer

## Goal

Make the platform beginner-friendly.

## Planned Features

- Sample databases
- Query templates
- Interactive onboarding
- SQL snippets
- Error simplification
- Beginner query explanations

---

# Phase 3 — AI Features

## Goal

Enable AI-assisted SQL learning.

## Planned Features

- Natural language → SQL
- Natural language → Schema generation
- AI query explanation
- AI error explanation

## Potential API

- Anthropic

---

# Phase 4 — Visual SQL Simulator *(Core Feature)*

## Goal

Visually animate SQL execution.

> This will become the main differentiator of the product.

## Planned Features

- AST parsing
- Execution pipeline visualization
- Row-level animation
- JOIN visualization
- WHERE filtering animation
- GROUP BY visualization
- ORDER BY animation

---

## SQL Execution Order Visualization

The simulator will visually demonstrate query execution order:

1. `FROM`
2. `JOIN`
3. `WHERE`
4. `GROUP BY`
5. `HAVING`
6. `SELECT`
7. `ORDER BY`
8. `LIMIT`

---

# Phase 5 — Public MVP Launch

## Planned Features

- Landing page
- Analytics
- Documentation
- Public deployment
- Feedback collection

---

# Phase 6 — Advanced Features

## Future Scope

- Authentication
- Saved projects
- Shared links
- Classroom mode
- Multiplayer learning
- MySQL support
- Interview practice mode

---

# 🎯 Long-Term Vision

Build an interactive SQL learning platform that combines:

- Real PostgreSQL execution
- Visual query understanding
- Beginner-friendly education
- AI-assisted learning
- Collaborative learning experiences

into a modern browser-native developer education product.
