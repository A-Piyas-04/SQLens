# SQLens

A browser-based PostgreSQL playground for learning and experimenting with SQL. Run real PostgreSQL queries in the browser, visualize schema and query execution, and optionally generate SQL with AI.

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

### AI SQL generation (optional)

- **AI SQL Generator** — Natural language → SQL via Google Gemini (Express backend); output is safety-checked and inserted into the editor for manual review and run
- Requires `GEMINI_API_KEY` in `backend/.env` and the backend service running (see Docker below)

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
- `GEMINI_API_KEY` — for AI SQL generation

## Getting started

### Local development (frontend only)

```bash
git clone <your-repo-url>
cd SQLens
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Query execution and persistence work without the backend. AI generation requires the backend (see Docker or run `backend` separately).

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

| File | Variable | Purpose |
|------|----------|---------|
| `backend/.env` | `GEMINI_API_KEY` | Google Gemini API key |
| `backend/.env` | `GEMINI_MODEL` | Primary model (default `gemini-2.5-flash-lite`) |
| `backend/.env` | `GEMINI_MODEL_FALLBACKS` | Optional comma-separated fallbacks if primary is rate-limited (defaults to `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`) |
| `.env` (root) | `VITE_API_URL` | Backend URL for AI client (default `http://localhost:3001`) |

### Production build

```bash
npm run build
npm run preview
```

Output: `dist/`

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
9. Optional: **AI SQL Generator** (Sparkles) to draft SQL from a natural-language prompt.
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
├── backend/                    # Express + Gemini AI routes
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
