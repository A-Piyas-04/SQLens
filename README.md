# SQLens

A browser-based PostgreSQL playground for learning and experimenting with SQL. Run real PostgreSQL queries in the browser—no backend server required. Your database persists across page refreshes using IndexedDB.

## Features

- **Real PostgreSQL** — Powered by [PGlite](https://github.com/electric-sql/pglite) (WASM Postgres in the browser)
- **SQL editor** — Syntax-highlighted editor with CodeMirror
- **Query results** — Tabular output with success and error feedback
- **Schema sidebar** — View tables in the `public` schema
- **Query history** — Last 10 queries saved in `localStorage`
- **Reset database** — Drop and recreate the `public` schema for a clean slate
- **Persistence** — Data survives browser refresh via IndexedDB (`idb://sqlens`)

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Editor | CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-sql`) |
| Database | PGlite (`@electric-sql/pglite`) |
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

1. Write SQL in the editor (DDL, DML, and `SELECT` are supported).
2. Click **Run Query** to execute against the in-browser database.
3. Review results in the table below, or read the success/error message.
4. Use **Query History** to reload a previous query.
5. Check the **Schema** sidebar for tables after creating them; use **Refresh** to update the list.
6. Click **Reset DB** to wipe all tables and start fresh (useful during development).

### Example query

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  gpa NUMERIC(3,2)
);

INSERT INTO students (name, gpa)
VALUES ('Alice', 3.80);

SELECT * FROM students;
```

## Project Structure

```
SQLens/
├── src/
│   ├── App.tsx                 # Main app shell and state
│   ├── components/
│   │   ├── editor/             # SQL editor (CodeMirror)
│   │   ├── results/            # Query result table
│   │   └── schema/             # Schema sidebar
│   ├── hooks/
│   │   └── useQueryHistory.ts  # localStorage query history
│   └── lib/db/
│       ├── pglite.ts           # PGlite instance (IndexedDB)
│       ├── query.ts            # runQuery, resetDatabase
│       └── schema.ts           # information_schema helpers
├── Docs/
│   └── project-state.md        # Roadmap and feature status
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |

## Roadmap

Phase 1 polish (schema details, results UX, mobile layout) and future phases (beginner onboarding, AI assistance, visual SQL execution) are tracked in [Docs/project-state.md](Docs/project-state.md).

## License

Private project — add a license file if you plan to open-source this repository.
