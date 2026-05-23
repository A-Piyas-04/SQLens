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

---

# ✅ Completed Phases

## Phase 1 — Core SQL Playground

All core features shipped. Database persists via IndexedDB (PGlite). Schema extracted from `information_schema` on every query run and DB reset.

## Phase 1.5 — ERD Viewer v1

**Shipped.** An interactive, live Entity Relationship Diagram rendered beside the query workspace.

### What was built

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Extended with `primaryKeys: string[]` per table via `information_schema` PK query |
| `src/lib/erd/buildErdGraph.ts` | Converts `SchemaTable[]` into React Flow `Node[]` and `Edge[]` with auto grid layout |
| `src/components/erd/ErdTableNode.tsx` | Custom React Flow node — table name header, column rows with PK/FK badges and data types |
| `src/components/erd/ErdViewer.tsx` | ReactFlow canvas with Background, Controls, MiniMap, fitView on schema change |
| `src/App.tsx` | ERD panel added below the results table, receives `workspace.tables` |
| `src/index.css` | Dark-theme CSS variable overrides for ReactFlow Controls and MiniMap |

### Capabilities

- Live refresh: ERD rebuilds automatically after every query run or DB reset
- Zoom / pan / fit-view (Controls toolbar)
- Minimap in the bottom-right corner
- FK arrows (`smoothstep` edges with arrow markers) labelled `column → referenced_column`
- Per-column PK badge (amber) and FK badge (green)
- Empty state message when no tables exist
- Dot-grid background matching the dark slate palette
- No PNG/PDF export, no manual editing, no AI features (intentionally scoped out)

### Dependencies added

- `@xyflow/react` — React Flow v1 (MIT)

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
