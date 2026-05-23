# SQLens

A browser-based PostgreSQL playground for learning and experimenting with SQL. Run real PostgreSQL queries directly in your browser — no backend server required. Your database persists across page refreshes using IndexedDB.

## Features

- **Real PostgreSQL** — Powered by [PGlite](https://github.com/electric-sql/pglite) (WASM Postgres in the browser)
- **SQL editor** — Syntax-highlighted CodeMirror editor with keyboard shortcuts
- **Run selection** — Select any portion of SQL and run only that part; falls back to the full editor content when nothing is selected
- **Project workspaces** — Create and switch between isolated SQL environments; each project has its own database, schema, history, and editor draft
- **Interactive ERD** — Live Entity Relationship Diagram rendered with React Flow; shows tables, columns, PK/FK badges, and foreign-key arrows
- **Schema sidebar** — Browse tables, columns, types, constraints, and FK relations in the `public` schema
- **Query history** — Last 10 executed queries saved per project in `localStorage`
- **Reset database** — Drop and recreate the `public` schema for a clean slate
- **Persistence** — Data survives browser refresh via IndexedDB (`idb://sqlens-{projectId}`)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Run selected SQL or full editor content |

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Editor | CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-sql`) |
| Database | PGlite (`@electric-sql/pglite`) |
| ERD | React Flow (`@xyflow/react`) |
| Build | Vite 8 |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (recommended)
- npm (included with Node.js)

Optional: [Docker](https://www.docker.com/) for containerized development

## Getting Started

### Local development

```bash
# Clone the repository
git clone <your-repo-url>
cd SQLens

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
npm run build
npm run preview
```

The static build is output to `dist/`.

### Docker

```bash
docker compose up --build
```

The app runs at [http://localhost:5173](http://localhost:5173) with hot reload via volume mounts.

## Usage

1. Write SQL in the editor (DDL, DML, and `SELECT` are all supported).
2. **To run everything:** click **Run Query** or press `Ctrl+Enter` / `Cmd+Enter`.
3. **To run a specific statement:** select it in the editor, then click **Run Selection** or press `Ctrl+Enter`. The toolbar shows a `● Selection active` indicator while text is selected.
4. Review results in the table below, or read the success/error message.
5. Use **Query History** to reload a previous query (history is per project).
6. Check the **Schema** sidebar for tables; use **Refresh** to update after DDL changes.
7. View the **ERD** panel at the bottom to see your schema as a visual diagram.
8. Use the **project switcher** in the sidebar to create, rename, or switch workspaces.
9. Click **Reset DB** to wipe all tables and start fresh within the current project.

### Example — multiple statements, run one at a time

```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  department_id INT REFERENCES departments(id)
);

INSERT INTO departments (name) VALUES ('Engineering'), ('Design');

SELECT * FROM departments;
```

Select just `SELECT * FROM departments;` and press `Ctrl+Enter` to run only that line.

## Project Structure

```
SQLens/
├── src/
│   ├── App.tsx                       # Root shell — wires project + workspace
│   ├── components/
│   │   ├── common/                   # Button, Panel, StatusMessage, AnimatedReveal
│   │   ├── editor/                   # SqlEditor (CodeMirror, selection, keymap)
│   │   ├── erd/                      # ErdViewer, ErdTableNode
│   │   ├── features/                 # QueryToolbar, QueryHistory
│   │   ├── layout/                   # AppHeader, WorkspaceLayout, ResizableSidebar
│   │   ├── projects/                 # ProjectSwitcher
│   │   └── results/                  # ResultTable
│   ├── constants/
│   │   ├── layout.ts                 # Sidebar width bounds
│   │   └── queries.ts                # DEFAULT_QUERY
│   ├── hooks/
│   │   ├── useActiveProject.ts       # Project state + PGlite instance lookup
│   │   ├── useQueryHistory.ts        # Per-project localStorage history
│   │   ├── useResizablePanel.ts      # Sidebar drag-resize
│   │   └── useSqlWorkspace.ts        # Query execution, schema, selection state
│   └── lib/
│       ├── db/
│       │   ├── createDatabase.ts     # PGlite instance registry
│       │   ├── pglite.ts             # Legacy singleton (unused)
│       │   ├── query.ts              # runQuery, resetDatabase
│       │   └── schema.ts             # information_schema helpers
│       ├── erd/
│       │   └── buildErdGraph.ts      # SchemaTable[] → React Flow nodes + edges
│       ├── projects/
│       │   └── projectStore.ts       # Project CRUD + localStorage keys
│       └── utils/
│           ├── cn.ts                 # clsx wrapper
│           └── viewTransition.ts     # Native View Transitions helper
├── Docs/
│   └── project-state.md              # Roadmap and feature status
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## localStorage Keys

| Key | Contents |
|-----|----------|
| `sqlens-projects` | JSON array of `Project` objects |
| `sqlens-active-project` | ID of the currently active project |
| `sqlens-draft-{projectId}` | Last editor content for each project |
| `sqlens-history-{projectId}` | Last 10 executed queries per project |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |

## Roadmap

Phase 1 polish and future phases (beginner onboarding, AI assistance, visual SQL execution) are tracked in [Docs/project-state.md](Docs/project-state.md).

## License

Private project — add a license file if you plan to open-source this repository.
