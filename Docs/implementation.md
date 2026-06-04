# SQLens — Implementation Documentation

> Comprehensive reference for **what** is implemented, **how** it works, and **which** tools and technologies power each layer.  
> Last aligned with the codebase structure as of June 2026.

---

## Table of contents

1. [Project purpose](#1-project-purpose)
2. [High-level architecture](#2-high-level-architecture)
3. [Repository layout](#3-repository-layout)
4. [Frontend](#4-frontend)
5. [In-browser database (no traditional backend for SQL)](#5-in-browser-database-no-traditional-backend-for-sql)
6. [Backend and AI API](#6-backend-and-ai-api)
7. [Vercel serverless API (`api/`)](#7-vercel-serverless-api-api)
8. [SQL execution simulator](#8-sql-execution-simulator)
9. [Entity Relationship Diagram (ERD)](#9-entity-relationship-diagram-erd)
10. [Practice hub and sample data](#10-practice-hub-and-sample-data)
11. [Onboarding tour](#11-onboarding-tour)
12. [Persistence and browser storage](#12-persistence-and-browser-storage)
13. [Build, dev, and deployment](#13-build-dev-and-deployment)
14. [Testing](#14-testing)
15. [Environment variables](#15-environment-variables)
16. [Related documentation](#16-related-documentation)

---

## 1. Project purpose

**SQLens** is a browser-native PostgreSQL playground for learning and experimenting with SQL. Users can:

- Run **real PostgreSQL** in the browser (no database server for query execution).
- Inspect schema, results, and an interactive **ERD**.
- Load **sample databases** and templates for fast practice.
- Optionally use an **AI SQL assistant** that suggests concepts (not runnable SQL in the editor).
- **Simulate** `SELECT` query execution stage-by-stage with snapshots, diffs, and animated playback.

The product is intentionally **practice-first**: a tool, not a full course platform. All query data stays in the user’s browser unless they use the AI feature (which sends prompts and optional schema summaries to Google Gemini).

---

## 2. High-level architecture

```mermaid
flowchart TB
  subgraph browser["User browser"]
    UI["React 19 SPA\n(Vite + TypeScript)"]
    PG["PGlite WASM Postgres\nIndexedDB per project"]
    LS["localStorage\nprojects, drafts, history"]
    UI --> PG
    UI --> LS
  end

  subgraph ai["AI layer (optional)"]
    Vercel["Vercel serverless\napi/sql-guidance.ts"]
    Express["Express 5 backend\nbackend/src (Docker/local)"]
    Gemini["Google Gemini API"]
    Vercel --> Gemini
    Express --> Gemini
  end

  UI -->|"POST /api/sql-guidance"| Vercel
  UI -->|"POST /api/sql-guidance\n(VITE_API_URL or Vite proxy)"| Express
```

| Concern | Where it runs | Technology |
|--------|----------------|------------|
| UI, editor, ERD, simulator UI | Browser | React 19, Vite 8, Tailwind CSS 4 |
| SQL execution & persistence | Browser | PGlite (`@electric-sql/pglite`), IndexedDB |
| Project metadata, drafts, history | Browser | `localStorage` |
| AI SQL guidance | Server only | Express 5 **or** Vercel serverless + `@google/generative-ai` |

**Important:** Query execution does **not** require a backend. The backend (or Vercel `api/` routes) exists solely for the optional AI assistant.

---

## 3. Repository layout

```
SQLens/
├── index.html                 # SPA shell, fonts, #app mount
├── package.json               # Frontend dependencies and scripts
├── vite.config.ts             # Vite + React + Tailwind; /api proxy; Vitest
├── vercel.json                # SPA rewrites; framework vite
├── netlify.toml               # Static build → dist; SPA redirect
├── docker-compose.yml         # frontend + backend services
├── Dockerfile                 # Frontend dev container (Node 20)
├── .env.example               # VITE_API_URL, VITE_API_PROXY_TARGET
│
├── src/                       # Entire React application
├── api/                       # Vercel serverless handlers (production AI)
├── backend/                   # Standalone Express AI server (local/Docker)
└── Docs/                      # Project documentation
    ├── implementation.md      # This file
    ├── project-state.md         # Feature status and phased roadmap
    ├── gui-structure.md       # UI regions, components, design tokens
    └── deploy-ready.md        # Production hardening notes
```

---

## 4. Frontend

### 4.1 Role and responsibilities

The frontend is a **single-page application (SPA)** that:

1. Hosts the SQL editor, toolbar, results, simulator, ERD, and practice UI.
2. Owns all **client-side state** (active project, editor text, selection, query results, schema cache).
3. Initializes and talks to **PGlite** per project.
4. Calls **`/api/sql-guidance`** when the user opens the AI assistant (same-origin or via `VITE_API_URL`).
5. Persists non-database state in **localStorage** (projects, drafts, history, onboarding, simulator prefs).

Entry point: `src/main.tsx` → `StrictMode` → `App.tsx`.

### 4.2 Technology stack

| Technology | Version (package.json) | Role |
|------------|------------------------|------|
| **React** | ^19.2 | UI framework, hooks, `useTransition`, lazy loading for playback modal |
| **React DOM** | ^19.2 | Client rendering |
| **TypeScript** | ~6.0 | Type safety across app and shared API types |
| **Vite** | ^8.0 | Dev server, HMR, production build (`tsc && vite build`) |
| **@vitejs/plugin-react** | ^6.0 | JSX/TSX, Fast Refresh |
| **Tailwind CSS** | ^4.3 | Utility styling via `@tailwindcss/vite` |
| **CodeMirror** | `@uiw/react-codemirror` ^4.25, `@codemirror/lang-sql` ^6.10 | SQL editor, syntax highlighting, selection tracking, `Mod-Enter` run |
| **PGlite** | `@electric-sql/pglite` ^0.4.5 | In-browser PostgreSQL (WASM) |
| **React Flow** | `@xyflow/react` ^12.10 | ERD graph (nodes, edges, controls, minimap) |
| **html-to-image** | ^1.11.11 | ERD PNG/SVG export (pinned; newer versions have export bugs) |
| **jspdf** | ^4.2.1 | ERD PDF export (embeds captured PNG) |
| **node-sql-parser** | ^5.4.0 | Simulator: SQL → AST (PostgreSQL dialect) |
| **lucide-react** | ^1.16.0 | Icons |
| **clsx** | ^2.1.1 | Conditional classes (`cn` helper) |
| **react-hot-toast** | ^2.6.0 | Toast notifications (where used) |
| **@vercel/node** | ^5.3.0 | Types/dev alignment for serverless handlers in `api/` |

Fonts (Google Fonts in `index.html`): **Syne** (display), **Epilogue** (UI), **IBM Plex Mono** (SQL/data).

### 4.3 Application composition (`App.tsx`)

`App.tsx` wires the full workspace:

| Region | Components / hooks |
|--------|-------------------|
| Boot | `AppBootGate` + `useAppBootReady` — waits for PGlite ready, splash skeleton |
| Header | `AppHeader`, `PracticeRadialMenu`, `AiSqlGeneratorPopover`, tour restart |
| Sidebar | `WorkspaceLayout` + `ResizableSidebar` — `ProjectSwitcher`, `PracticeSidebar` (includes `SchemaSidebar`) |
| Main | `SqlEditor`, `QueryToolbar`, `ErdScrollButton`, `LoadingBanner`, `StatusMessage`, `ResultTable`, `SimulatorPanel`, `QueryHistory`, `ErdViewer` |
| Overlay | `OnboardingTour` |

Central state hooks:

- **`useActiveProject`** — project list, active ID, `getDatabase(projectId)` PGlite instance.
- **`useSqlWorkspace(db, projectId)`** — query text, selection, run/reset, schema refresh, history, sample DB load, practice actions.
- **`useResizablePanel`** — sidebar width (desktop drag).
- **`useOnboardingTour`** — guided tour steps.

### 4.4 Source directory map

```
src/
├── App.tsx, main.tsx, index.css
├── constants/
│   ├── layout.ts              # Sidebar min/max/default width
│   ├── practiceCategories.ts  # Practice hub category IDs and labels
│   ├── queries.ts             # DEFAULT_QUERY starter SQL
│   └── onboardingSteps.ts     # Tour step definitions
├── data/
│   ├── sampleDatabases.ts     # 4 bundled schemas + seed (Students, E-commerce, Library, HR)
│   ├── queryTemplates.ts      # 12 categorized example queries
│   ├── sqlSnippets.ts         # Short fragments for cursor insert
│   └── visualizationPresets.ts# Demo queries tied to sample DBs
├── hooks/
│   ├── useActiveProject.ts
│   ├── useSqlWorkspace.ts
│   ├── useQueryHistory.ts
│   ├── useResizablePanel.ts
│   ├── useAppBootReady.ts
│   ├── useOnboardingTour.ts
│   ├── useSimulatorPlayback.ts
│   └── useFlipAnimation.ts
├── lib/
│   ├── api/                   # AI client, schema formatting, SqlGuidance types
│   ├── db/                    # PGlite registry, runQuery, schema introspection
│   ├── erd/                   # Graph builder, designed text, export helpers
│   ├── projects/              # Project CRUD + localStorage
│   ├── simulator/             # Parse → pipeline → snapshots → diffs
│   ├── sql/                   # assertSafeSql, simplifyError
│   ├── onboarding/            # Tour completion store
│   └── utils/                 # cn, viewTransition wrapper
└── components/
    ├── ai/                    # AiSqlGeneratorPopover
    ├── common/                # Button, Panel, StatusMessage, Skeleton, AnimatedReveal
    ├── editor/                # SqlEditor (CodeMirror ref API: insertAtCursor, onRun)
    ├── erd/                   # ErdViewer, ErdTableNode, ErdExportMenu, DesignedTextModal
    ├── features/              # QueryToolbar, QueryHistory
    ├── icons/                 # Brand and practice icons
    ├── layout/                # Header, workspace, boot gate, loading banner
    ├── onboarding/            # Tour overlay and step card
    ├── practice/              # Sidebar, radial menu, category content
    ├── projects/              # ProjectSwitcher
    ├── results/               # ResultTable
    ├── schema/                # SchemaSidebar, SchemaTableCard
    └── simulator/             # Panel, snapshot viewer, JOIN canvas, playback modal, debug
```

### 4.5 Key user flows (frontend)

**Run query**

1. User edits SQL in `SqlEditor` or selects a fragment.
2. `Ctrl+Enter` / **Run Query** / **Run Selection** → `useSqlWorkspace.handleRunQuery`.
3. `runQuery(db, sql)` executes against PGlite; errors passed through `simplifySqlError`.
4. On success: `ResultTable` rows, optional success message, history append, `getSchema` refresh for sidebar + ERD.

**Switch project**

1. `ProjectSwitcher` → `switchProject(id)`.
2. `useSqlWorkspace` effect reloads draft, clears results, reloads history, re-inits schema from new `db` instance (`idb://sqlens-{projectId}`).

**Reset database**

- `resetDatabase(db)` — `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` then schema refresh.

**AI guidance**

1. User opens **AI SQL** popover, enters natural-language goal.
2. `formatSchemaForAi(tables)` builds compact schema text.
3. `requestSqlGuidance(prompt, schema)` → `POST /api/sql-guidance`.
4. Response rendered as read-only cards (summary, breakdown, techniques, pitfalls). **No SQL is inserted into the editor.**

**Simulate query**

1. `SimulatorPanel` calls `generateSnapshots({ sql, db })` from `src/lib/simulator`.
2. On success: stage pills, diff-aware tables, optional JOIN canvas, debug panel, **Play Simulation** opens lazy-loaded `SimulatorPlaybackModal`.

### 4.6 UI primitives and styling

- Global theme: dark slate surfaces, blue accents (`src/index.css` CSS variables: `--color-surface`, `--color-line`, etc.).
- **`Panel`**, **`Button`**, **`StatusMessage`** — shared layout primitives.
- **View transitions**: `withViewTransition` wraps schema/result updates for smoother UI (where supported).
- **Responsive**: sidebar stacks on small screens; playback modal has mobile panel toggles.
- Detailed GUI map: [gui-structure.md](./gui-structure.md).

---

## 5. In-browser database (no traditional backend for SQL)

### 5.1 PGlite

| Aspect | Implementation |
|--------|----------------|
| Library | `@electric-sql/pglite` |
| Instance registry | `src/lib/db/createDatabase.ts` — `Map<projectId, PGlite>` |
| Storage URI | `idb://sqlens-{projectId}` (IndexedDB-backed persistence) |
| Legacy id | `"legacy"` can map to `idb://sqlens` for older single-DB users |

Each project gets an isolated database: schema, data, and simulator stage queries all use the same `db` for that project.

### 5.2 Query execution (`src/lib/db/query.ts`)

| Function | Behavior |
|----------|----------|
| `runQuery(db, sql)` | `db.query(sql)` → rows + success/error message |
| `execSqlScript(db, sql)` | `db.exec(sql)` for multi-statement DDL/seed (sample DB load) |
| `resetDatabase(db)` | Drops and recreates `public` schema |

### 5.3 Schema introspection (`src/lib/db/schema.ts`)

`getSchema(db)` queries PostgreSQL **`information_schema`** (and related catalogs) to build `SchemaTable[]`:

- Columns: name, type, nullable, default
- Primary keys, foreign keys
- UNIQUE constraints (including composite)
- CHECK constraints (user-defined; system NOT NULL checks filtered)

Used by: schema sidebar, ERD graph, AI schema formatting, simulator (indirectly via same DB).

### 5.4 SQL safety helpers (`src/lib/sql/`)

- **`simplifyError.ts`** — Maps common PostgreSQL errors to short user-facing messages (FK violations, missing relation/column, syntax).
- **`assertSafeSql.ts`** — Used for legacy/generated SQL paths; blocks destructive patterns when AI used to return SQL (deprecated path).

---

## 6. Backend and AI API

### 6.1 Purpose

The **backend does not execute user SQL**. Its only production role is:

1. Accept **`POST /api/sql-guidance`** with `{ prompt, schema? }`.
2. Build a **tutor-style prompt** (JSON-only response, no runnable SQL).
3. Call **Google Gemini** with model fallback chain.
4. **Sanitize** model output (`sanitizeGuidance`) — reject SQL-like content and invalid JSON shape.
5. Return `{ guidance: SqlGuidance }`.

Legacy endpoint **`POST /api/generate-sql`** still exists (returns `{ sql }` with `sanitizeGeneratedSql`); the UI has moved to guidance-only via `requestSqlGuidance`.

### 6.2 Technology stack (`backend/`)

| Technology | Version | Role |
|------------|---------|------|
| **Node.js** | 20 (Docker) | Runtime |
| **Express** | ^5.2.1 | HTTP server, JSON body, routing |
| **@google/generative-ai** | ^0.24.1 | Gemini SDK |
| **cors** | ^2.8.6 | Origin allowlist in production |
| **helmet** | ^8.1.0 | Security headers |
| **express-rate-limit** | ^8.1.0 | Per-IP rate limiting on `/api` |
| **dotenv** | ^17.4.2 | Load `backend/.env` |
| **axios** | ^1.16.1 | Used in Gemini service for some HTTP paths |
| **TypeScript** | ^6.0.3 | Compiled to `dist/` |
| **ts-node-dev** | dev | Hot reload for `npm run dev` |

### 6.3 Backend file map

```
backend/
├── package.json
├── Dockerfile                 # node:20-alpine, npm run build, node dist/index.js
├── .env.example
└── src/
    ├── index.ts               # Express app, CORS, helmet, health, mount /api + rate limit
    ├── routes/aiRoutes.ts     # POST /sql-guidance, POST /generate-sql
    ├── services/gemini.ts     # resolveModelChain, generateWithGemini, quota/model errors
    ├── middleware/aiRateLimit.ts
    ├── prompts/
    │   ├── sqlGuidancePrompt.ts   # Active tutor prompt
    │   └── sqlPrompt.ts           # Legacy SQL generation prompt
    └── utils/
        ├── sanitizeGuidance.ts
        └── sanitizeSql.ts
```

### 6.4 Server bootstrap (`backend/src/index.ts`)

- Port: `process.env.PORT` or **3001**
- **CORS**: In production, requires `ALLOWED_ORIGINS` (comma-separated); throws at startup if missing. Dev allows all origins.
- **Middleware**: `helmet`, `express.json({ limit: "16kb" })`, `trust proxy: 1`
- **Routes**: `GET /health` → `{ ok: true }`; `app.use("/api", aiRateLimit, aiRoutes)`
- Logs Gemini model chain on startup when `GEMINI_API_KEY` is set

### 6.5 AI routes (`backend/src/routes/aiRoutes.ts`)

| Route | Body | Response | Limits |
|-------|------|----------|--------|
| `POST /api/sql-guidance` | `prompt` (required), `schema` (optional string) | `{ guidance }` | prompt ≤ 2000 chars, schema ≤ 4000 chars |
| `POST /api/generate-sql` | `prompt` | `{ sql }` | prompt ≤ 2000 chars |

Error handling maps quota (429), model unavailable (503), validation (400), missing key (503), network (503/502) to JSON `{ error: string }`.

### 6.6 Gemini service (`backend/src/services/gemini.ts`)

- **Primary model**: `GEMINI_MODEL` or default `gemini-2.0-flash-lite`
- **Fallbacks**: `GEMINI_MODEL_FALLBACKS` or built-in list (`gemini-2.0-flash`, `gemini-2.5-flash-lite`, etc.)
- **`generateWithGemini(prompt, { jsonMode })`** — tries chain until success or throws `AiQuotaExceededError` / `AiModelUnavailableError`
- Requires **`GEMINI_API_KEY`** in environment

### 6.7 Guidance sanitization

`sanitizeGuidance` (backend + mirrored in `api/_lib/sanitizeGuidance.ts`):

- Parses JSON matching `SqlGuidance` shape
- Rejects output that looks like executable SQL (SELECT/INSERT/UPDATE/DELETE patterns, fenced SQL blocks)
- Surfaces `GUIDANCE_SQL_REJECTED_MESSAGE` to client as 400

### 6.8 Rate limiting

`backend/src/middleware/aiRateLimit.ts`:

- Env: `AI_RATE_LIMIT_WINDOW_MS` (default 60000), `AI_RATE_LIMIT_MAX` (default 15)
- Applied to all routes under `/api`

---

## 7. Vercel serverless API (`api/`)

For **production on Vercel**, the frontend static build is deployed with **serverless functions** alongside it—no separate Express container required.

| File | Route (Vercel) | Purpose |
|------|----------------|---------|
| `api/sql-guidance.ts` | `POST /api/sql-guidance` | Primary AI handler |
| `api/generate-sql.ts` | `POST /api/generate-sql` | Legacy SQL generation |
| `api/_lib/gemini.ts` | — | Shared Gemini client (parallel to backend service) |
| `api/_lib/buildSqlGuidancePrompt.ts` | — | Prompt builder |
| `api/_lib/sanitizeGuidance.ts` | — | Output validation |
| `api/_lib/rateLimit.ts` | — | IP rate limit for serverless |
| `api/_lib/sqlGuidanceTypes.ts` | — | Shared types |

`vercel.json` rewrites non-API, non-static paths to `/index.html` for SPA routing.

**Local dev:** Vite proxies `/api` → `VITE_API_PROXY_TARGET` (default `http://localhost:3001`) so the browser always calls same-origin `/api` while the Express backend can run separately.

---

## 8. SQL execution simulator

### 8.1 Purpose

Teach **how** a `SELECT` executes by:

1. Parsing SQL to an AST.
2. Building a **logical pipeline** of stages.
3. Generating **per-stage SQL**, executing each on PGlite.
4. Assigning **stable row IDs** and **diffs** between consecutive stages.
5. Rendering tables, JOIN canvas, and fullscreen **playback** with animations.

### 8.2 Engine layout (`src/lib/simulator/`)

```
simulator/
├── index.ts                    # Public barrel exports
├── types/
│   ├── simulatorTypes.ts       # Stage types, pipeline, result unions
│   └── snapshotTypes.ts        # TrackedRow, snapshots, StageDiff, RowDiff
├── sql/
│   ├── parseSql.ts             # Lazy node-sql-parser singleton, PostgreSQL dialect
│   ├── supportedSql.ts         # validateSqlSupport — rejects unsupported constructs
│   └── buildStageSql.ts        # AST → SQL per stage (incl. JOIN, GROUP BY, HAVING)
├── pipeline/
│   └── buildPipeline.ts        # AST → ordered SimulatorStage[]
└── snapshot/
    ├── generateSnapshots.ts    # Orchestrator: parse → validate → execute stages
    ├── assignRowIds.ts         # Content-based row identity across stages
    └── diffSnapshots.ts        # removed/added/reordered/null + reason strings
```

### 8.3 Pipeline order

Logical execution order:

`FROM` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`

### 8.4 Supported vs unsupported (simulator)

| Feature | Supported |
|---------|-----------|
| SELECT, FROM (single base table) | Yes |
| WHERE, ORDER BY, LIMIT | Yes |
| INNER JOIN, LEFT JOIN | Yes (+ JOIN canvas) |
| GROUP BY, HAVING | Yes |
| CTE (WITH) | No |
| UNION | No |
| Subqueries in FROM | No |
| Window functions | No |
| RIGHT / FULL / CROSS JOIN | No |
| Non-SELECT statements | No |

### 8.5 UI components (`src/components/simulator/`)

| Component | Role |
|-----------|------|
| `SimulatorPanel` | Entry: Simulate / Simulate Selection; hosts viewer, debug, playback trigger |
| `SimulatorSnapshotViewer` | Stage pills, active stage card, JOIN canvas hookup |
| `SimulatorSnapshotTable` | Diff-aware result table |
| `SimulatorJoinCanvas` | Static SVG row matching for JOIN stages |
| `SimulatorDebugPanel` | Tabs: SQL, row IDs, diffs |
| `playback/SimulatorPlaybackModal` | Fullscreen portal; keyboard shortcuts |
| `playback/*` | Transport, FLIP table, animated JOIN canvas, lesson panel, SQL context sidebar |

Hooks: **`useSimulatorPlayback`** (play/pause/speed/autoplay), **`useFlipAnimation`** (ORDER BY row reorder).

### 8.6 localStorage (simulator)

| Key | Purpose |
|-----|---------|
| `simulator:playbackSidebarWidth` | Playback sidebar width |
| `simulator:showRowIds` | Show row IDs in UI |
| `simulator:debug` | Enable debug logging when set to `"1"` |

---

## 9. Entity Relationship Diagram (ERD)

### 9.1 Implementation

| Layer | File(s) | Technology |
|-------|---------|------------|
| Graph build | `src/lib/erd/buildErdGraph.ts` | `@xyflow/react` nodes/edges, grid layout |
| Custom node | `src/components/erd/ErdTableNode.tsx` | Table header, columns, PK/FK badges |
| Canvas | `src/components/erd/ErdViewer.tsx` | Background, Controls, MiniMap, fitView on schema change |
| Export menu | `src/components/erd/ErdExportMenu.tsx` | PNG, SVG, PDF, Designed Text |
| Capture | `src/lib/erd/export/captureErdViewport.ts` | `html-to-image` + React Flow bounds |
| PDF | `src/lib/erd/export/exportErdPdf.ts` | `jspdf` |
| Designed text | `src/lib/erd/buildDesignedText.ts` | ASCII schema for LLM paste |
| Modal | `src/components/erd/DesignedTextModal.tsx` | Copy entire text |

Data source: `workspace.tables` from `getSchema(db)` — same introspection as schema sidebar.

---

## 10. Practice hub and sample data

### 10.1 Categories (`src/constants/practiceCategories.ts`)

Practice hub sections (sidebar + header radial menu):

- Sample databases
- Query templates
- SQL snippets (insert at CodeMirror cursor via `SqlEditor` ref)
- Visualization presets

### 10.2 Data files

| File | Content |
|------|---------|
| `sampleDatabases.ts` | 4 schemas: Students, E-commerce, Library, HR — DDL + INSERT + optional starter query |
| `queryTemplates.ts` | 12 example queries (JOINs, GROUP BY, subqueries, NULL, etc.) |
| `sqlSnippets.ts` | Short clause fragments |
| `visualizationPresets.ts` | Pairs preset queries with sample DB ids |

Loading a sample DB: `execSqlScript` → refresh schema → optionally set editor from `starterQuery`.

---

## 11. Onboarding tour

| Piece | Location |
|-------|----------|
| Steps | `src/constants/onboardingSteps.ts` |
| State | `src/lib/onboarding/onboardingStore.ts` (completion flag in localStorage) |
| Hook | `src/hooks/useOnboardingTour.ts` |
| UI | `OnboardingTour`, `OnboardingStepCard`, `OnboardingSpotlightOverlay` |

Tour targets DOM regions via `dataTour` attributes (e.g. ERD panel `dataTour="erd-section"`). Restart from header help control.

---

## 12. Persistence and browser storage

### 12.1 IndexedDB (via PGlite)

- Per project: `idb://sqlens-{projectId}`
- Survives refresh; holds all tables and data for that project

### 12.2 localStorage keys

| Key | Contents |
|-----|----------|
| `sqlens-projects` | JSON array of `Project` objects |
| `sqlens-active-project` | Active project id |
| `sqlens-draft-{projectId}` | Editor buffer per project |
| `sqlens-history-{projectId}` | Last **10** queries per project |
| Onboarding | Stored via `onboardingStore` |
| Simulator keys | See §8.6 |

**Clear Local Data:** `clearAllLocalData()` in `projectStore.ts` + confirm in `App.tsx` → full page reload.

---

## 13. Build, dev, and deployment

### 13.1 Frontend scripts (`package.json`)

| Script | Command | Output / behavior |
|--------|---------|-------------------|
| `dev` | `vite` | http://localhost:5173, proxies `/api` |
| `build` | `tsc && vite build` | `dist/` |
| `preview` | `vite preview` | Local preview of production build |
| `test` | `vitest run` | Unit tests |
| `test:ui` | `vitest --ui` | Vitest UI |

### 13.2 Deployment targets

| Target | Config | AI |
|--------|--------|-----|
| **Vercel** | `vercel.json`, framework vite, `api/` functions | Same project; set `GEMINI_API_KEY` etc. |
| **Netlify** | `netlify.toml` — build `dist`, SPA redirect | Needs separate AI host or Netlify functions (not in repo); typically `VITE_API_URL` to Vercel API |
| **Docker Compose** | `docker-compose.yml` | Frontend :5173, backend :3001, `VITE_API_PROXY_TARGET=http://backend:3001` |
| **Static only** | `npm run build` | SQL works; AI disabled without API |

### 13.3 Docker services

| Service | Image / build | Port | Command |
|---------|---------------|------|---------|
| `frontend` | Root `Dockerfile` | 5173 | `npm install && npm run dev -- --host 0.0.0.0` |
| `backend` | `backend/Dockerfile` | 3001 | `node dist/index.js` after `npm run build` |

Frontend volume-mounts repo; `node_modules` anonymous volume. Backend reads `backend/.env`.

---

## 14. Testing

**Runner:** Vitest 4 (`vite.config.ts` — `environment: "node"`).

| Test file | Area |
|-----------|------|
| `src/lib/simulator/__tests__/simulator.test.ts` | Simulator pipeline, snapshots, diffs |
| `src/lib/erd/__tests__/buildDesignedText.test.ts` | Designed text export |
| `src/lib/db/__tests__/schema.test.ts` | Schema introspection helpers |
| `src/lib/onboarding/__tests__/onboardingStore.test.ts` | Onboarding persistence |
| `src/constants/__tests__/onboardingSteps.test.ts` | Tour step config |
| `src/components/simulator/playback/join/__tests__/joinPlaybackModel.test.ts` | JOIN playback model |
| `api/_lib/__tests__/sanitizeGuidance.test.ts` | Guidance sanitization (serverless lib) |

Run: `npm test`.

---

## 15. Environment variables

### 15.1 Frontend (`.env` / Vercel / Netlify)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Optional API base (e.g. `http://localhost:3001`). Empty = same-origin `/api` |
| `VITE_API_PROXY_TARGET` | Dev/Docker only: Vite proxy target for `/api` (default `http://localhost:3001`) |

**Never** put `GEMINI_API_KEY` in `VITE_*` variables.

### 15.2 Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Required for AI |
| `GEMINI_MODEL` | Primary Gemini model |
| `GEMINI_MODEL_FALLBACKS` | Comma-separated fallback models |
| `ALLOWED_ORIGINS` | Production CORS allowlist |
| `AI_RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) |
| `AI_RATE_LIMIT_MAX` | Max requests per IP per window |
| `PORT` | Server port (default 3001) |
| `NODE_ENV` | `production` enforces CORS allowlist |

### 15.3 Vercel serverless (project env)

Same Gemini and rate-limit variables as backend; used by `api/sql-guidance.ts` and `api/_lib/rateLimit.ts`.

---

## 16. Related documentation

| Document | Focus |
|----------|--------|
| [project-state.md](./project-state.md) | Phased roadmap, shipped features, file-level phase notes |
| [gui-structure.md](./gui-structure.md) | Visual layout, components, colors, interactions |
| [deploy-ready.md](./deploy-ready.md) | Production security, CORS, rate limits, data cleanup |
| [README.md](../README.md) | Quick start, features list, keyboard shortcuts |

---

## Summary table: who implements what

| Capability | Implemented with | Runs where |
|------------|------------------|------------|
| SQL editor & run | CodeMirror + PGlite + `useSqlWorkspace` | Browser |
| Schema sidebar & ERD | `information_schema` + React Flow | Browser |
| Project isolation | PGlite `idb://` + `projectStore` | Browser + IndexedDB |
| Query history & drafts | `localStorage` | Browser |
| Practice samples | Static TS data + `execSqlScript` | Browser |
| Simulator | `node-sql-parser` + PGlite + React UI | Browser |
| AI guidance | Gemini via Express **or** Vercel `api/` | Server |
| Legacy AI SQL gen | `POST /api/generate-sql` | Server (deprecated in UI) |

SQLens is therefore a **thick client** for database work, with a **thin, optional AI API** layer for tutoring—not a traditional three-tier app with a remote SQL server.
