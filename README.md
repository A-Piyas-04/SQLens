# SQLens

A browser-based PostgreSQL playground for learning and experimenting with SQL. Run real PostgreSQL queries in the browser, visualize schema and query execution, and optionally get SQL learning hints from an AI assistant.

## Features

### Core playground

- **Real PostgreSQL** — [PGlite](https://github.com/electric-sql/pglite) (WASM Postgres in the browser); no database server required for queries
- **SQL editor** — Syntax-highlighted CodeMirror editor with `Ctrl+Enter` / `Cmd+Enter` to run
- **Run selection** — Run only the highlighted SQL, or the full editor when nothing is selected
- **Project workspaces** — Isolated databases per project (`idb://sqlens-{projectId}`), with separate schema, ERD, history, and editor draft
- **Schema sidebar** — Tables, columns, types, NULL/default, and foreign keys from `information_schema`
- **Query history** — Last 10 queries per project in `localStorage`
- **Results table** — Sticky headers, NULL styling, copy JSON, export JSON
- **Reset database** — Wipe the `public` schema and start fresh within the current project
- **Persistence** — Data survives refresh via IndexedDB

### Entity Relationship Diagram

- **Live ERD** — React Flow graph with table nodes, PK/FK badges, FK arrows, zoom, pan, fit view, and minimap
- **ERD scroll button** — Jump from the editor toolbar to the diagram section
- **ERD export** (canvas **Export** menu):
  - **as png** / **as svg** / **as pdf** — downloads matching the on-screen diagram (colors, dots, edges; excludes controls/minimap)
  - **Designed Text** — opens a modal with structured schema text (entities, attributes, relationships, constraints) and a **Copy entire text** button for AI chat

### Practice & samples

- **Practice hub** — Sample databases (Students, E-commerce, Library, HR), query templates, SQL snippets, visualization presets
- **One-click loaders** — Load bundled DDL + seed data into the active project

### AI SQL assistant (optional)

- **SQL Assistant** — Describe a query goal in natural language; Gemini suggests concepts (JOIN types, `GROUP BY`, `HAVING`, etc.) without writing SQL into the editor
- API: `POST /api/sql-guidance` (Vercel serverless or Express backend via `VITE_API_URL`)
- Active project schema is sent with each request so suggestions can reference your tables and columns
- **Privacy note** — Prompts and schema summaries are sent to Google Gemini; avoid entering secrets, credentials, or sensitive personal data

### SQL Execution Simulator

- **Stage-by-stage execution** — Parses `SELECT` queries into a pipeline (FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT)
- **Snapshots & diffs** — Per-stage table results with row identity, diff annotations, and JOIN canvas visualization
- **Playback modal** — Fullscreen autoplay with speed control, FLIP row animations, animated JOIN canvas, SQL context sidebar, and lesson panel
- **Debug inspector** — Collapsible SQL / row IDs / diff tabs

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Run selected SQL or full editor |
| Playback modal: `Space` | Play / pause |
| Playback modal: `←` / `→` | Previous / next stage |
| Playback modal: `R` | Restart |
| Playback modal: `Esc` | Close modal |

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Editor | CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-sql`) |
| Database | PGlite (`@electric-sql/pglite`) |
| ERD | React Flow (`@xyflow/react`), `html-to-image`, `jspdf` |
| Simulator | `node-sql-parser`, Vitest |
| AI backend | Express 5, `@google/generative-ai` (Gemini) |
| Build | Vite 8 |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

Optional:

- [Docker](https://www.docker.com/) — frontend + AI backend via `docker compose`
- `GEMINI_API_KEY` — for the SQL assistant

## Getting started

### Local development (frontend only)

```bash
git clone <your-repo-url>
cd SQLens
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Query execution and persistence work without any server. AI generation works when `GEMINI_API_KEY` is configured in Vercel project environment variables.

### Full stack with Docker

```bash
# Set GEMINI_API_KEY in backend/.env (or root .env for compose)
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend (AI) | http://localhost:3001 |

The frontend container runs `npm install` on start so new dependencies sync into the `node_modules` volume.

### Environment variables

| Scope | Variable | Purpose |
|------|----------|---------|
| Vercel server env | `GEMINI_API_KEY` | Google Gemini API key (server-only; never expose in client) |
| Vercel server env | `GEMINI_MODEL` | Primary model (default `gemini-2.5-flash-lite`) |
| Vercel server env | `GEMINI_MODEL_FALLBACKS` | Optional comma-separated fallback models |
| Vercel server env | `AI_RATE_LIMIT_WINDOW_MS` | AI route time window in milliseconds (default `60000`) |
| Vercel server env | `AI_RATE_LIMIT_MAX` | AI route max requests per IP in window (default `15`) |
| Frontend `.env` (optional) | `VITE_API_URL` | External API base URL override. Keep empty for same-origin `/api` on Vercel |

### Production build

```bash
npm run build
npm run preview
```

Output: `dist/`

## Deploying for real users

### Frontend (Vercel or Netlify)

SQLens frontend is a Vite SPA and can be deployed as static assets on either Vercel or Netlify:

- Build command: `npm install && npm run build`
- Output directory: `dist`

### AI API (no separate backend deployment)

The AI endpoint is implemented as a Vercel serverless function:

- `api/sql-guidance.ts` (primary), `api/generate-sql.ts` (legacy)

Required Vercel env vars:

- `GEMINI_API_KEY`

Recommended Vercel env vars:

- `GEMINI_MODEL`
- `GEMINI_MODEL_FALLBACKS`
- `AI_RATE_LIMIT_WINDOW_MS`
- `AI_RATE_LIMIT_MAX`

### Frontend environment

Set `VITE_API_URL` only if you intentionally use an external API host.

For this Vercel serverless setup, keep it empty so the frontend calls same-origin `/api`.

### Security baseline before going live

- Keep `GEMINI_API_KEY` server-side only (never expose via `VITE_*`)
- Keep AI rate-limiting enabled (`AI_RATE_LIMIT_*`)
- Tell users that queries/drafts/history are stored in browser local storage

### Tests

```bash
npm test
```

Runs Vitest (simulator engine + ERD designed-text export).

## Usage

1. Write SQL in the editor (DDL, DML, and `SELECT` are supported).
2. **Run everything:** **Run Query** or `Ctrl+Enter`.
3. **Run a selection:** highlight SQL, then **Run Selection** or `Ctrl+Enter`.
4. Browse **Schema** in the sidebar; **Refresh** after DDL changes.
5. Scroll to **Entity Relationship Diagram** or use the ERD button in the editor toolbar.
6. Use **Export** on the ERD canvas to download PNG, SVG, PDF, or Designed Text.
7. Open the **Practice** hub for sample databases and templates.
8. Use **Simulate Query** / **Play Simulation** to step through query execution visually.
9. Optional: **AI SQL** assistant — ask about a query goal; get clause and table suggestions (no auto-insert into the editor).
10. Switch projects in the sidebar; **Reset DB** clears the current project database.

## Project structure

```
SQLens/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── ai/                 # AiSqlGeneratorPopover
│   │   ├── common/             # Button, Panel, …
│   │   ├── editor/             # SqlEditor
│   │   ├── erd/                # ErdViewer, ErdTableNode, ErdExportMenu
│   │   ├── features/           # QueryToolbar, QueryHistory
│   │   ├── layout/             # AppHeader, ErdScrollButton, …
│   │   ├── practice/           # PracticeSidebar, PracticeRadialMenu, …
│   │   ├── projects/           # ProjectSwitcher
│   │   ├── results/            # ResultTable
│   │   ├── schema/             # SchemaSidebar, SchemaTableCard
│   │   └── simulator/          # SimulatorPanel, playback modal, …
│   ├── data/                   # Sample DBs, templates, snippets, presets
│   ├── hooks/                  # useSqlWorkspace, useActiveProject, playback, …
│   └── lib/
│       ├── api/                # AI client
│       ├── db/                 # PGlite, query, schema introspection
│       ├── erd/                # buildErdGraph, buildDesignedText, export/
│       ├── projects/           # Project store
│       ├── simulator/          # Parse → pipeline → snapshots → diffs
│       └── sql/                # assertSafeSql, simplifyError
├── api/                        # Vercel serverless AI routes (/api/sql-guidance, …)
├── backend/                    # Optional local Express backend (legacy/local workflows)
├── Docs/
│   ├── project-state.md        # Roadmap and feature status
│   └── gui-structure.md        # UI layout reference
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## localStorage keys

| Key | Contents |
|-----|----------|
| `sqlens-projects` | Project list |
| `sqlens-active-project` | Active project ID |
| `sqlens-draft-{projectId}` | Editor draft per project |
| `sqlens-history-{projectId}` | Last 10 queries per project |
| `simulator:playbackSidebarWidth` | Playback modal sidebar width |
| `simulator:showRowIds` | Show row IDs in simulator UI |

Use **ProjectSwitcher → Clear Local Data** to remove SQLens data from the current browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Run Vitest |
| `npm run test:ui` | Vitest UI |

## Roadmap

Phases, simulator details, and future work are documented in [Docs/project-state.md](Docs/project-state.md).

## License

Private project — add a license file if you plan to open-source this repository.
