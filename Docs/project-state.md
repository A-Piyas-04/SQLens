# SQLens — Project State

> A browser-based SQL practice and visualization platform with real PostgreSQL execution, project workspaces, AI-assisted SQL generation, and a visual SQL execution simulator.

---

# ✅ Current Working Features

Users can currently:

- ✅ Run real PostgreSQL queries in the browser (PGlite — no backend required)
- ✅ Create tables, insert data, perform joins
- ✅ Persist database state after page refresh (IndexedDB via PGlite)
- ✅ View rich schema sidebar (columns, types, NULL/default, PK/FK/UNIQUE badges, CHECK constraints, foreign keys)
- ✅ View query history per project
- ✅ Reset database to empty state
- ✅ Results table with sticky headers, NULL styling, copy JSON, export JSON
- ✅ Terminal-style loading banner during query execution
- ✅ Concise PostgreSQL error messages (FK, syntax, missing table/column, etc.)
- ✅ Mobile-responsive layout (stacked sidebar, responsive header and buttons)
- ✅ Interactive ERD viewer — live schema as a React Flow graph with FK arrows, zoom, pan, fit view, minimap
- ✅ ERD export — dropdown on canvas: PNG, SVG, PDF (visual fidelity via viewport capture), and Designed Text modal (copyable schema text for AI chat)
- ✅ Project workspaces — isolated PGlite databases per project with independent schema, ERD, history, and editor draft
- ✅ Selected query runner — run only selected SQL (or fall back to full editor); Ctrl+Enter shortcut
- ✅ Practice sidebar — sample databases, query templates, SQL snippets, visualization presets
- ✅ One-click sample DB loaders (Students, E-commerce, Library, HR) with relational schemas and seed data
- ✅ AI SQL Assistant — natural language query goals → Gemini suggests clauses/techniques (no SQL inserted into editor); `POST /api/sql-guidance`
- ✅ SQL Execution Simulator — full visual simulator with JOIN, GROUP BY, HAVING, row diffing, diff annotations, JOIN canvas, and debug inspector
- ✅ Simulator Playback Modal — fullscreen animated playback with autoplay, speed control (0.5×–4×), FLIP row animations, animated JOIN canvas, floating stage annotations, and keyboard shortcuts
- ✅ ERD scroll button — one-click smooth scroll to the Entity Relationship Diagram from the editor toolbar

---

# ✅ Completed Phases

## Phase 1 — Core SQL Playground

All core features shipped. Database persists via IndexedDB (PGlite). Schema extracted from `information_schema` on every query run and DB reset.

## Phase 1.5 — Platform Foundation

### Phase 1.5a — ERD Viewer

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | `information_schema` introspection: columns, PK, FK, UNIQUE (composite), CHECK (user-defined; filters system NOT NULL checks) |
| `src/lib/erd/buildErdGraph.ts` | Converts `SchemaTable[]` into React Flow `Node[]` and `Edge[]` with auto grid layout |
| `src/components/erd/ErdTableNode.tsx` | Custom React Flow node — table name header, column rows with PK/FK badges and data types |
| `src/components/erd/ErdViewer.tsx` | ReactFlow canvas with Background, Controls, MiniMap, fitView on schema change; mounts `ErdExportMenu` |
| `src/components/erd/ErdExportMenu.tsx` | Top-right Export dropdown on canvas (PDF / PNG / SVG / Designed Text) |
| `src/App.tsx` | ERD panel added below the results table, receives `workspace.tables` |
| `src/index.css` | Dark-theme CSS variable overrides for ReactFlow Controls and MiniMap; `svg { overflow: visible }` for export |

Capabilities: live schema refresh, zoom/pan/fit-view, minimap, FK arrows with labels, PK/FK column badges, empty-state message.

**Dependency added:** `@xyflow/react` (MIT)

### Phase 1.5d — ERD Export

| File | Purpose |
|------|---------|
| `src/lib/erd/export/downloadFile.ts` | Shared Blob → programmatic `<a download>` helper |
| `src/lib/erd/export/captureErdViewport.ts` | PNG/SVG via `html-to-image` + `getNodesBounds` / `getViewportForBounds`; excludes controls/minimap, keeps dot background |
| `src/lib/erd/export/exportErdPdf.ts` | PDF embeds captured PNG via `jspdf` |
| `src/lib/erd/buildDesignedText.ts` | ASCII entity boxes, relationships, constraints → plain text for LLM paste |
| `src/lib/erd/__tests__/buildDesignedText.test.ts` | Unit tests for designed-text output |
| `src/components/erd/DesignedTextModal.tsx` | Fullscreen-style modal with schema text, prominent Copy button, close (×) and backdrop/Escape dismiss |
| `src/components/erd/ErdExportMenu.tsx` | Export dropdown; Designed Text opens modal (no file download); hover tooltip on menu row |

Export filenames: `erd-diagram.png`, `erd-diagram.svg`, `erd-diagram.pdf`. Visual exports use current node positions (including user drags).

**Dependencies added:** `html-to-image@1.11.11` (pinned — newer versions have known export bugs), `jspdf`

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

**Shipped.** Natural language query goals → structured guidance via Gemini (JOIN types, `GROUP BY`, `HAVING`, tables/columns, pitfalls). The assistant does not write runnable SQL or insert into the editor.

### Architecture

```
User goal (textarea in popover) + optional schema summary
  → POST /api/sql-guidance  (Express or Vercel serverless)
  → buildSqlGuidancePrompt() — tutor role, JSON-only output, no SQL
  → Google Gemini API
  → sanitizeGuidance() — parse JSON; reject SELECT/INSERT/… + markdown SQL fences
  → Read-only cards in popover (summary, breakdown, techniques, pitfalls)
```

### Frontend

| File | Purpose |
|------|---------|
| `src/components/ai/AiSqlGeneratorPopover.tsx` | Header **AI SQL** button → popover; **Get suggestions**; renders guidance cards |
| `src/lib/api/aiClient.ts` | `requestSqlGuidance(prompt, schema?)` — POST `/api/sql-guidance`; returns `SqlGuidance` |
| `src/lib/api/formatSchemaForAi.ts` | Compact schema text from `SchemaTable[]` for the prompt |
| `src/lib/api/sqlGuidanceTypes.ts` | `SqlGuidance` TypeScript types |

### Backend (`backend/`)

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express 5 app — CORS, JSON body parsing, mounts AI router |
| `backend/src/routes/aiRoutes.ts` | `POST /sql-guidance` — `{ prompt, schema? }` → `{ guidance }`; legacy `POST /generate-sql` retained |
| `backend/src/prompts/sqlGuidancePrompt.ts` | Tutor system prompt (JSON shape, no runnable SQL) |
| `backend/src/utils/sanitizeGuidance.ts` | Parse/validate guidance; block query-like output |
| `backend/src/services/gemini.ts` | `generateWithGemini(prompt)` — model fallback chain |

**Env vars required:**
- `backend/.env`: `GEMINI_API_KEY`; optionally `GEMINI_MODEL` (default `gemini-2.5-flash-lite`); optionally `GEMINI_MODEL_FALLBACKS` (comma-separated, else built-in chain: `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`)
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
| html-to-image | 1.11.11 | ERD viewport capture (PNG/SVG) |
| jspdf | ^4.2 | ERD PDF export |
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
│   ├── useSqlWorkspace.ts         # Central workspace state hook
│   ├── useSimulatorPlayback.ts    # Playback state: index, play/pause, speed, autoplay interval
│   └── useFlipAnimation.ts        # FLIP animation for ORDER BY row reordering
├── lib/
│   ├── api/aiClient.ts            # generateSql() — POST to backend
│   ├── db/
│   │   ├── createDatabase.ts      # PGlite instance registry per project
│   │   ├── pglite.ts              # Legacy singleton (superseded)
│   │   ├── query.ts               # runQuery, resetDatabase, execSqlScript
│   │   └── schema.ts              # getSchema() from information_schema
│   ├── erd/
│   │   ├── buildErdGraph.ts       # SchemaTable[] → React Flow nodes/edges
│   │   ├── buildDesignedText.ts   # Schema → ASCII text export for AI chat
│   │   ├── __tests__/buildDesignedText.test.ts
│   │   └── export/
│   │       ├── downloadFile.ts
│   │       ├── captureErdViewport.ts
│   │       └── exportErdPdf.ts
│   ├── projects/projectStore.ts   # Project CRUD + localStorage helpers
│   ├── simulator/
│   │   ├── index.ts               # Barrel export for public API
│   │   ├── types/
│   │   │   ├── simulatorTypes.ts  # Stage types (incl. GROUP_BY, HAVING), pipeline types
│   │   │   └── snapshotTypes.ts   # TrackedRow, SimulatorSnapshot, StageDiff, RowDiff, SnapshotResult
│   │   ├── sql/
│   │   │   ├── parseSql.ts        # SQL → AST (node-sql-parser)
│   │   │   ├── supportedSql.ts    # Validation gate
│   │   │   └── buildStageSql.ts   # Stage → executable SQL string (all stages incl. JOIN, GROUP BY, HAVING)
│   │   ├── pipeline/
│   │   │   └── buildPipeline.ts   # AST → ordered stage list (8 stage types)
│   │   ├── snapshot/
│   │   │   ├── assignRowIds.ts    # JS-side stable row ID assignment across stages
│   │   │   ├── diffSnapshots.ts   # Consecutive snapshot diffing + reason strings
│   │   │   └── generateSnapshots.ts  # Orchestrates parse→execute→assign IDs→diff→collect
│   │   ├── __fixtures__/queries.ts  # 11 fixture queries for testing
│   │   └── __tests__/simulator.test.ts  # 32 simulator regression tests (vitest)
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
    ├── erd/                  # ErdViewer, ErdTableNode, ErdExportMenu
    ├── features/             # QueryToolbar, QueryHistory
    ├── layout/               # AppHeader, WorkspaceLayout, ResizableSidebar, ErdScrollButton, …
    ├── practice/             # PracticeSidebar, PracticeRadialMenu, …
    ├── projects/ProjectSwitcher.tsx
    ├── results/ResultTable.tsx
    ├── schema/               # SchemaSidebar, SchemaTableCard
    └── simulator/
        ├── StageStepList.tsx              # Horizontal/vertical stage pills (snapshot viewer + playback sidebar)
        ├── SimulatorPanel.tsx             # Orchestrates simulate button + snapshot viewer + debug panel + playback modal trigger
        ├── SimulatorStageList.tsx         # Vertical stage pipeline display (unused in success state)
        ├── SimulatorSnapshotViewer.tsx    # Stage pills + animated card + JOIN canvas wiring
        ├── SimulatorSnapshotTable.tsx     # Diff-aware table: status colours, reason badges, NULL highlighting
        ├── SimulatorJoinCanvas.tsx        # Static SVG row-matching visualization for JOIN stages (in snapshot viewer)
        ├── SimulatorDebugPanel.tsx        # Collapsible debug inspector (SQL / Row IDs / Diff tabs)
        └── playback/
            ├── SimulatorPlaybackModal.tsx # Fullscreen portal modal with keyboard shortcuts
            ├── SqlContextPanel.tsx          # Resizable sidebar: original SQL + StageStepList nav
            ├── LessonPanel.tsx              # Stage lesson/annotation panel (replaces StageAnnotation)
            ├── StageEntryBanner.tsx         # Stage transition banner in playback
            ├── PlaybackControls.tsx         # Transport bar: play/pause/prev/next/restart/speed/progress bar
            ├── PlaybackStage.tsx            # Stage content dispatcher (table vs JOIN canvas)
            ├── PlaybackTable.tsx            # Animated diff-aware table with row virtualization + FLIP
            ├── PlaybackRow.tsx              # Individual animated <tr> with status badge + reason
            ├── JoinPlaybackCanvas.tsx       # 4-phase animated JOIN visualization with SVG connector lines
            ├── PlaybackTimeline.tsx         # @deprecated — merged into SqlContextPanel
            └── StageAnnotation.tsx          # @deprecated — replaced by LessonPanel
```

---

# ✅ Phase 4 — Simulator (Completed)

## Phase 4.3 — JOIN Snapshots

- FROM stage strips JOIN items — shows only the base table.
- JOIN case implemented in `buildStageSql.ts`: keeps all FROM items + ON condition, `SELECT *`, no WHERE/ORDER BY/LIMIT.
- Dynamic annotations for INNER JOIN and LEFT JOIN.
- Right-table rows fetched in a separate query for the JOIN canvas.

## Phase 4.4 — Stable Row Identity Tracking

- `TrackedRow` type added to `snapshotTypes.ts`.
- `assignRowIds.ts` — JS-side ID assignment by content-matching against previous stage rows.
- Sequential `row-0`, `row-1`… IDs at the FROM stage; `row-new-N` for new rows.
- IDs wired into `generateSnapshots.ts` after every stage.

## Phase 4.5 + 4.6 — Snapshot Diffing + Explanation Metadata

- `diffSnapshots.ts` — computes `StageDiff` between consecutive snapshots.
- Detects: removed, added, reordered, null-introduced, unchanged rows + hidden columns.
- Human-readable `reason` strings per `RowDiff` (e.g. "Filtered out by WHERE condition", "Dropped — exceeds LIMIT N").
- Diffs attached to `SnapshotResult` and passed through to UI.

## Phase 4.7 — Stage Animations + Enhanced Table

- `SimulatorSnapshotTable` is diff-aware: colored rows by status (removed/added/reordered/null-introduced), reason badges, NULL cell highlighting, hidden column strikethrough headers.
- `SimulatorSnapshotViewer` receives and looks up diffs per stage; fade-out/in card transition on stage navigate; removed row count badges on stage pills; removed rows shown inline at WHERE/HAVING/LIMIT stages.

## Phase 4.8 — JOIN Visualization Canvas

- `SimulatorJoinCanvas.tsx` — two-column layout with SVG connector lines.
- Solid green lines for matched pairs; dashed amber lines for LEFT JOIN NULLs.
- Row pill colours reflect match / no-match / NULL status.
- Embedded below the snapshot table in JOIN stage cards.

## Phase 4.9 — GROUP BY / HAVING Support

- `GROUP_BY` and `HAVING` added to `SimulatorStageType`, pipeline, stage SQL builder, and UI.
- `supportedSql.ts` no longer rejects GROUP BY or HAVING.
- Logical order: FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.
- Annotations: "Grouped N rows into K groups." / "K of N groups passed HAVING."

## Phase 4.0 — Test Harness + Debug Mode

- `vitest` added; **34 tests** across `simulator.test.ts` (32) and `buildDesignedText.test.ts` (2).
- `__fixtures__/queries.ts` — 11 fixture queries covering every major pipeline path.
- `SimulatorDebugPanel.tsx` — collapsible panel with SQL, Row IDs, and Diff tabs; wired into `SimulatorPanel`.

## Phase 4.10 — Simulator Playback Modal + Lib Refactor

**Shipped.** Immersive fullscreen playback of simulation stages with autoplay, speed control, and animated diff visualization.

### Simulator library refactored into sub-folders

The flat `src/lib/simulator/` files have been reorganized:

```
src/lib/simulator/
├── index.ts                        # Barrel export for public API
├── types/
│   ├── simulatorTypes.ts           # SimulatorStageType union, pipeline types
│   └── snapshotTypes.ts            # TrackedRow, SimulatorSnapshot, StageDiff, RowDiff, SnapshotResult
├── sql/
│   ├── parseSql.ts                 # SQL → AST (node-sql-parser)
│   ├── supportedSql.ts             # Validation gate
│   └── buildStageSql.ts            # Stage → executable SQL string
├── pipeline/
│   └── buildPipeline.ts            # AST → ordered stage list
├── snapshot/
│   ├── assignRowIds.ts             # JS-side stable row ID assignment
│   ├── diffSnapshots.ts            # Consecutive snapshot diffing + reason strings
│   └── generateSnapshots.ts        # Orchestrates parse→execute→assign IDs→diff→collect
├── __fixtures__/queries.ts
└── __tests__/simulator.test.ts
```

### New hooks

| File | Purpose |
|------|---------|
| `src/hooks/useSimulatorPlayback.ts` | Manages playback state: active index, play/pause, speed (0.5×/1×/2×/4×), auto-advance interval via `setInterval`, `animationKey` counter for table re-animation. Debug logs enabled via `localStorage["simulator:debug"] = "1"`. |
| `src/hooks/useFlipAnimation.ts` | FLIP (First/Last/Invert/Play) animation for smooth row reordering at the ORDER_BY stage. Registers `<tr>` refs, captures pre-render positions, applies inverted `translateY` then transitions to zero. |

### New layout component

| File | Purpose |
|------|---------|
| `src/components/layout/ErdScrollButton.tsx` | Circular 32px button with `GitFork` icon in the editor toolbar — calls `scrollIntoView({ behavior: "smooth" })` on `#erd-section`. |

### Playback UI layer (`src/components/simulator/playback/`)

| File | Purpose |
|------|---------|
| `SimulatorPlaybackModal.tsx` | Fullscreen React portal modal; resizable `SqlContextPanel` sidebar (width persisted in `localStorage`); mobile toggles for SQL/lesson panels; keyboard shortcuts: Space=play/pause, ←/→=navigate, R=restart, Esc=close. Lazy-loaded from `SimulatorPanel`. |
| `SqlContextPanel.tsx` | Left sidebar: full query SQL context + `StageStepList` stage navigation |
| `LessonPanel.tsx` | Stage annotation and diff summary for the active playback step |
| `StageStepList.tsx` | Shared stage pill nav (row counts, diff badges) — used in snapshot viewer and playback |
| `PlaybackControls.tsx` | Bottom transport bar: Prev/Play-Pause/Restart/Next buttons, "Stage N of M" counter, speed selector (0.5×/1×/2×/4×), animated progress drain bar (CSS `pb-progress-drain` keyframe resets on each stage). |
| `PlaybackStage.tsx` | Main stage content area; dispatches to `PlaybackTable` for regular stages or `JoinPlaybackCanvas` for JOIN stages; collects removed rows from diff for inline display at WHERE/HAVING/LIMIT stages; hosts floating `StageAnnotation`. |
| `PlaybackTable.tsx` | Diff-aware animated table with virtualization (>40 rows shows head-15 + ellipsis + tail-5); FLIP animation wired for ORDER_BY via `useFlipAnimation`; CSS animation duration driven by `--pb-anim-ms` custom property. |
| `PlaybackRow.tsx` | Individual `<tr>` with `data-status` attribute for CSS targeting; staggered 55ms delay per row via `--pb-row-delay`; status badge ("filtered", "matched", "reordered", "null row") + reason text in a "change" column. |
| `JoinPlaybackCanvas.tsx` | 4-phase animation machine (idle → tables → lines → result → done); two fixed 160px key panels + flex-1 gap for SVG; connector lines drawn sequentially via `strokeDashoffset` animation (520ms/line); solid green = matched, dashed amber = LEFT JOIN NULL rows. Parses ON condition from SQL to show join key columns. |
| `StageEntryBanner.tsx` | Brief stage-entry banner during playback transitions |

### SimulatorPanel updates

- **"Play Simulation" button** added to the success state header row.
- `SimulatorPlaybackModal` is lazy-loaded (`React.lazy`) — zero bundle cost until first open.
- All simulator imports updated to use new sub-folder paths.

### Updated supported query structures

| Clause | Supported |
|--------|-----------|
| SELECT (any columns or `*`) | ✅ |
| FROM (single table) | ✅ |
| WHERE | ✅ |
| INNER JOIN, LEFT JOIN | ✅ with JOIN canvas |
| ORDER BY | ✅ |
| LIMIT | ✅ |
| GROUP BY | ✅ |
| HAVING | ✅ |
| CTEs (WITH) | ❌ not supported yet |
| UNION | ❌ not supported yet |
| Subqueries | ❌ not supported yet |
| Window functions | ❌ not supported yet |
| RIGHT / FULL / CROSS JOIN | ❌ not supported yet |

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
