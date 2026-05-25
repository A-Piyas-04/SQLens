# SQLens — Project State

> A browser-based SQL practice and visualization platform with real PostgreSQL execution, project workspaces, AI-assisted SQL generation, and a visual SQL execution simulator.

---

# ✅ Current Working Features

Users can currently:

- ✅ Run real PostgreSQL queries in the browser (PGlite — no backend required)
- ✅ Create tables, insert data, perform joins
- ✅ Persist database state after page refresh (IndexedDB via PGlite)
- ✅ View rich schema sidebar (columns, types, NULL/default constraints, foreign keys)
- ✅ View query history per project
- ✅ Reset database to empty state
- ✅ Results table with sticky headers, NULL styling, copy JSON, export JSON
- ✅ Terminal-style loading banner during query execution
- ✅ Concise PostgreSQL error messages (FK, syntax, missing table/column, etc.)
- ✅ Mobile-responsive layout (stacked sidebar, responsive header and buttons)
- ✅ Interactive ERD viewer — live schema as a React Flow graph with FK arrows, zoom, pan, fit view, minimap
- ✅ Project workspaces — isolated PGlite databases per project with independent schema, ERD, history, and editor draft
- ✅ Selected query runner — run only selected SQL (or fall back to full editor); Ctrl+Enter shortcut
- ✅ Practice sidebar — sample databases, query templates, SQL snippets, visualization presets
- ✅ One-click sample DB loaders (Students, E-commerce, Library, HR) with relational schemas and seed data
- ✅ AI SQL Generator — natural language → SQL via Gemini, inserted into editor for manual review and run
- ✅ SQL Execution Simulator — parse SQL into a logical execution pipeline and step through stage-by-stage table snapshots

---

# ✅ Completed Phases

## Phase 1 — Core SQL Playground

All core features shipped. Database persists via IndexedDB (PGlite). Schema extracted from `information_schema` on every query run and DB reset.

## Phase 1.5 — Platform Foundation

### Phase 1.5a — ERD Viewer

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Extended with `primaryKeys: string[]` per table via `information_schema` PK query |
| `src/lib/erd/buildErdGraph.ts` | Converts `SchemaTable[]` into React Flow `Node[]` and `Edge[]` with auto grid layout |
| `src/components/erd/ErdTableNode.tsx` | Custom React Flow node — table name header, column rows with PK/FK badges and data types |
| `src/components/erd/ErdViewer.tsx` | ReactFlow canvas with Background, Controls, MiniMap, fitView on schema change |
| `src/App.tsx` | ERD panel added below the results table, receives `workspace.tables` |
| `src/index.css` | Dark-theme CSS variable overrides for ReactFlow Controls and MiniMap |

Capabilities: live schema refresh, zoom/pan/fit-view, minimap, FK arrows with labels, PK/FK column badges, empty-state message.

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

Behavior: if selected text is non-empty, only that SQL runs and is saved to history; otherwise the full editor content runs.

## Phase 2 — Practice Acceleration Layer

**Shipped.** Fast experimentation tooling — not a tutorial platform.

| Area | Files |
|------|-------|
| Sample databases | `src/data/sampleDatabases.ts` — 4 bundled schemas (Students, E-commerce, Library, HR) with DDL, seed data, starter queries |
| Query templates | `src/data/queryTemplates.ts` — 12 categorized example queries (JOINs, GROUP BY, subqueries, NULL handling) |
| SQL snippets | `src/data/sqlSnippets.ts` — Short clause fragments inserted at CodeMirror cursor position |
| Visualization presets | `src/data/visualizationPresets.ts` — Demo queries tied to sample databases for ERD/result exploration |
| Error simplification | `src/lib/sql/simplifyError.ts` — Short readable messages for FK, missing table/column, syntax, etc. |
| Practice sidebar shell | `src/components/practice/PracticeSidebar.tsx`, `PracticeCategoryContent.tsx`, `PracticeNavList.tsx` |
| Practice radial menu | `src/components/practice/PracticeRadialMenu.tsx` — Animated hub in the app header |
| Workspace actions | `useSqlWorkspace` — `loadSampleDatabase`, `loadQuery`, `applyVisualizationPreset` |
| Editor insert API | `SqlEditor` — `insertAtCursor` via ref |

## Phase 3 — AI Features

**Shipped.** Natural language → SQL via Gemini, inserted into the editor for manual review.

### Architecture

```
User prompt (textarea in popover)
  → POST /api/generate-sql  (Express backend)
  → Google Gemini API       (gemini-2.5-flash-lite by default)
  → sanitizeGeneratedSql()  (backend — strips markdown fences, trims)
  → assertSafeSql()         (frontend — blocks DROP DATABASE, TRUNCATE, ALTER SYSTEM, etc.)
  → workspace.loadQuery()   (inserts into editor; user runs manually)
```

### Frontend

| File | Purpose |
|------|---------|
| `src/components/ai/AiSqlGeneratorPopover.tsx` | Floating Sparkles FAB → popover with textarea + Generate SQL button; Escape to close |
| `src/lib/api/aiClient.ts` | `generateSql(prompt)` — POST to `VITE_API_URL/api/generate-sql`; throws on error or empty result |
| `src/lib/sql/assertSafeSql.ts` | Blocks destructive SQL from AI-generated output before inserting into editor |

### Backend (`backend/`)

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express 5 app — CORS, JSON body parsing, mounts AI router |
| `backend/src/routes/aiRoutes.ts` | `POST /generate-sql` — validates prompt, calls Gemini, returns `{ sql }`; maps quota/model/bad-prompt errors to HTTP status codes |
| `backend/src/services/gemini.ts` | `generateWithGemini(prompt)` — singleton Gemini client; `AiQuotaExceededError`, `AiModelUnavailableError` custom errors |

**Env vars required:**
- `backend/.env`: `GEMINI_API_KEY`, optionally `GEMINI_MODEL` (default `gemini-2.5-flash-lite`)
- `.env` (root): `VITE_API_URL` (default `http://localhost:3001`)

**Dependency added:** `node-sql-parser` (frontend); `@google/generative-ai` (backend)

## Phase 4.1 — SQL Simulation Foundation

**Shipped.** SQL query → AST → logical execution pipeline → UI display.

### Engine layer (`src/lib/simulator/`)

| File | Purpose |
|------|---------|
| `simulatorTypes.ts` | Core types: `SimulatorStageType` union, `SimulatorStage`, `SimulatorPipeline`, `SimulatorResult` |
| `parseSql.ts` | `parseSql(sql)` — lazy `node-sql-parser` singleton; PostgreSQL dialect; returns `{ ok, ast }` or `{ ok, error }` |
| `supportedSql.ts` | `validateSqlSupport(ast)` — rejects non-SELECT, CTE, GROUP BY, HAVING, UNION, window functions, subqueries, RIGHT/FULL/CROSS joins |
| `buildPipeline.ts` | `buildPipeline(ast, sql)` — builds ordered `SimulatorStage[]` in logical execution order: FROM → JOIN → WHERE → SELECT → ORDER BY → LIMIT |

### UI layer (`src/components/simulator/`)

| File | Purpose |
|------|---------|
| `SimulatorPanel.tsx` | Panel with "Simulate Query" / "Simulate Selection" button; idle/loading/error/success states |
| `SimulatorStageList.tsx` | Vertical list of color-coded stage cards with connector arrows (available; currently superseded by snapshot viewer in the success state) |

### Supported query structures

| Clause | Supported |
|--------|-----------|
| SELECT (any columns or `*`) | ✅ |
| FROM (single table) | ✅ |
| WHERE | ✅ |
| INNER JOIN, LEFT JOIN | ✅ pipeline detection |
| ORDER BY | ✅ |
| LIMIT | ✅ |
| GROUP BY / HAVING | ❌ not supported yet |
| CTEs (WITH) | ❌ not supported yet |
| UNION | ❌ not supported yet |
| Subqueries | ❌ not supported yet |
| Window functions | ❌ not supported yet |
| RIGHT / FULL / CROSS JOIN | ❌ not supported yet |

## Phase 4.2 — Snapshot Engine

**Shipped.** Per-stage SQL generation → PGlite execution → stage-by-stage table snapshots.

### Engine layer (`src/lib/simulator/`)

| File | Purpose |
|------|---------|
| `snapshotTypes.ts` | `SimulatorSnapshot` (stageId, stageType, label, sql, rows, rowCount, annotation) and `SnapshotResult` discriminated union |
| `buildStageSql.ts` | `buildStageSql(select, stageType)` — pure SQL builder; deep-clones AST via JSON round-trip; uses `sqlify` for clause reconstruction; appends LIMIT explicitly (PostgreSQL sqlify LIMIT omission workaround); clears both `limit`/`_limit` and `orderby`/`_orderby` field pairs |
| `generateSnapshots.ts` | `generateSnapshots({ sql, db })` — orchestrates full pipeline: parse → validate → build stages → generate per-stage SQL → execute each via `runQuery()` → return `SimulatorSnapshot[]` |

**Stage SQL behavior:**

| Stage | Generated SQL |
|-------|--------------|
| FROM | `SELECT * FROM table` |
| WHERE | `SELECT * FROM table WHERE …` |
| SELECT | `SELECT cols FROM table WHERE …` |
| ORDER_BY | `SELECT cols FROM table WHERE … ORDER BY …` |
| LIMIT | `SELECT cols FROM table WHERE … ORDER BY … LIMIT n` |
| JOIN | ❌ returns unsupported error (pipeline detects it; snapshot fails gracefully) |

### UI layer (`src/components/simulator/`)

| File | Purpose |
|------|---------|
| `SimulatorSnapshotViewer.tsx` | Stage pills nav (clickable, shows row count per stage) + active stage card (icon, label, annotation, generated SQL, result table) + Previous/Next navigation |
| `SimulatorSnapshotTable.tsx` | Compact dark table: sticky header, alternating rows, NULL styling, horizontal scroll |

### Integration in `App.tsx`

`SimulatorPanel` is placed after `ResultTable` and before `QueryHistory`. It receives `query`, `selectedText`, and `db` from the workspace. It is fully isolated from the query execution pipeline.

**Dependency added:** `node-sql-parser` (already added in Phase 4.1)

---

# 🧩 Current Architecture

## Frontend stack

| Technology | Version | Role |
|------------|---------|------|
| React | ^19.2 | UI framework |
| Vite | ^8.0 | Build tool |
| TypeScript | ~6.0 | Type safety |
| Tailwind CSS | ^4.3 | Styling |
| PGlite (`@electric-sql/pglite`) | ^0.4 | In-browser PostgreSQL |
| CodeMirror (`@uiw/react-codemirror`) | ^4.25 | SQL editor |
| React Flow (`@xyflow/react`) | ^12.10 | ERD visualization |
| node-sql-parser | ^5.4 | SQL → AST parsing for simulator |
| lucide-react | ^1.16 | Icons |
| clsx | ^2.1 | Conditional class names |
| react-hot-toast | ^2.6 | Toast notifications |

## Backend stack

| Technology | Role |
|------------|------|
| Express 5 | REST API server |
| `@google/generative-ai` | Gemini integration |
| Docker / docker-compose | Dev environment |

## Source structure

```
src/
├── App.tsx                        # Root — composes all panels
├── main.tsx                       # Entry point
├── index.css                      # Global styles, view transitions, scrollbar
├── constants/
│   ├── layout.ts                  # Sidebar width constants
│   ├── practiceCategories.ts      # Practice hub category definitions
│   └── queries.ts                 # Default starter SQL
├── data/
│   ├── sampleDatabases.ts         # 4 bundled sample schemas
│   ├── queryTemplates.ts          # 12 example queries
│   ├── sqlSnippets.ts             # SQL clause snippets
│   └── visualizationPresets.ts    # Demo query + database combos
├── hooks/
│   ├── useActiveProject.ts        # Project list + active project + db instance
│   ├── useQueryHistory.ts         # Per-project history (localStorage)
│   ├── useResizablePanel.ts       # Sidebar drag-resize
│   └── useSqlWorkspace.ts         # Central workspace state hook
├── lib/
│   ├── api/aiClient.ts            # generateSql() — POST to backend
│   ├── db/
│   │   ├── createDatabase.ts      # PGlite instance registry per project
│   │   ├── pglite.ts              # Legacy singleton (superseded)
│   │   ├── query.ts               # runQuery, resetDatabase, execSqlScript
│   │   └── schema.ts              # getSchema() from information_schema
│   ├── erd/buildErdGraph.ts       # SchemaTable[] → React Flow nodes/edges
│   ├── projects/projectStore.ts   # Project CRUD + localStorage helpers
│   ├── simulator/
│   │   ├── simulatorTypes.ts      # Stage types, pipeline types
│   │   ├── snapshotTypes.ts       # Snapshot + result types
│   │   ├── parseSql.ts            # SQL → AST (node-sql-parser)
│   │   ├── supportedSql.ts        # Validation gate
│   │   ├── buildPipeline.ts       # AST → ordered stage list
│   │   ├── buildStageSql.ts       # Stage → executable SQL string
│   │   └── generateSnapshots.ts   # Orchestrates parse→execute→collect
│   ├── sql/
│   │   ├── assertSafeSql.ts       # Blocks destructive AI-generated SQL
│   │   └── simplifyError.ts       # User-friendly PG error messages
│   └── utils/
│       ├── cn.ts                  # clsx wrapper
│       └── viewTransition.ts      # document.startViewTransition wrapper
└── components/
    ├── ai/AiSqlGeneratorPopover.tsx
    ├── common/               # Button, Panel, StatusMessage, AnimatedReveal
    ├── editor/SqlEditor.tsx
    ├── erd/                  # ErdViewer, ErdTableNode
    ├── features/             # QueryToolbar, QueryHistory
    ├── layout/               # AppHeader, WorkspaceLayout, ResizableSidebar, …
    ├── practice/             # PracticeSidebar, PracticeRadialMenu, …
    ├── projects/ProjectSwitcher.tsx
    ├── results/ResultTable.tsx
    ├── schema/               # SchemaSidebar, SchemaTableCard
    └── simulator/
        ├── SimulatorPanel.tsx
        ├── SimulatorStageList.tsx
        ├── SimulatorSnapshotViewer.tsx
        └── SimulatorSnapshotTable.tsx
```

---

# 🚧 Phase 4 — Remaining Simulator Work

## Phase 4.3 — JOIN Snapshots *(next)*

Currently, queries with INNER JOIN / LEFT JOIN are parsed and detected in the pipeline, but the JOIN stage returns an unsupported error in `buildStageSql`. This phase will:

- Build JOIN stage SQL (cross-product + ON filter)
- Execute JOIN snapshot against PGlite
- Show joined rows in the snapshot table

## Phase 4.4 — Row-Level Diffing *(future)*

Compare rows between consecutive stages to identify:
- Which rows were removed (WHERE filtering)
- Which columns were hidden (SELECT projection)
- How row order changed (ORDER BY)
- Which rows were dropped (LIMIT)

This is the foundation for future animation.

## Phase 4.5 — Visual Animations *(future)*

Row-level animations using React View Transitions:
- WHERE: rows fade out when filtered
- SELECT: column projection (unused columns fade/collapse)
- ORDER BY: rows reorder with motion
- LIMIT: excess rows slide out

## Phase 4.6 — GROUP BY / HAVING *(future)*

Extend `supportedSql.ts` and `buildStageSql.ts` to handle aggregation stages.

---

# 🔮 Future Roadmap

## Phase 5 — Public MVP Launch

- Landing page
- Analytics
- Documentation
- Public deployment (Vercel)
- Feedback collection

## Phase 6 — Advanced Features

- Authentication
- Saved projects (cloud persistence)
- Shared links
- Classroom mode
- Multiplayer learning
- MySQL support
- Interview practice mode

---

# 🎯 Long-Term Vision

Build an interactive SQL learning platform that combines:

- Real PostgreSQL execution (in-browser, no server required)
- Visual query simulation (stage-by-stage table snapshots → animations)
- AI-assisted SQL generation and explanation
- Practice-first workflows (not a course, a tool)
- Collaborative and classroom experiences

into a modern browser-native developer education product.
