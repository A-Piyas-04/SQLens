# SQLens — GUI Structure, Design & Flow

> A reference document for understanding the current visual interface — every screen region, component, interaction, and design decision. Use this as a baseline for GUI enhancement planning.

---

## Design System

### Color Palette

SQLens uses an all-dark slate palette with blue accents.

| Role | Value |
|------|-------|
| Page background | `bg-slate-950` + radial gradient from `blue-950/25` at top |
| Panel / card surface | `bg-slate-900/70`, `bg-slate-800/40` |
| Border | `border-slate-700/50`, `border-slate-800/80` |
| Primary text | `text-slate-100` |
| Secondary text | `text-slate-400` |
| Muted / disabled | `text-slate-600` |
| Primary accent | Blue (`blue-400`, `blue-500`) |
| Backdrop overlay | `bg-slate-950/40 backdrop-blur-[2px]` |

### Stage Color Language

Every SQL execution stage has its own accent color, used consistently in both the Snapshot Viewer and the Playback Modal:

| Stage | Color |
|-------|-------|
| FROM | Blue |
| JOIN | Purple |
| WHERE | Amber |
| GROUP BY | Violet |
| HAVING | Orange |
| SELECT | Emerald |
| ORDER BY | Sky |
| LIMIT | Rose |

### Typography

- **Headings**: gradient text (`from-white via-slate-100 to-slate-400`), `font-bold tracking-tight`
- **UI labels**: `text-xs` or `text-sm`, `font-medium`
- **Stage labels / badges**: `text-[10px] uppercase tracking-wider font-semibold`
- **SQL / data values**: `font-mono`, `text-xs` or `text-[11px]`

### Component Primitives

| Component | Description |
|-----------|-------------|
| `Button` | Variants: `primary` (blue fill), `secondary` (dark outlined), `ghost` (text only). Sizes: `sm`, `md`. |
| `Panel` | `rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm shadow-lg`; accepts `title`, optional `action` slot, optional `id` for anchor scrolling. |
| `StatusMessage` | Full-width banner; `variant="error"` (amber) or `variant="success"` (green). |
| `AnimatedReveal` | Wraps children with a fade+slide-up CSS transition on mount. |

---

## Top-Level Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [radial gradient backdrop — blue-950/25 at top]                │
│                                                                 │
│  max-w-[1600px]  mx-auto  p-4/6/8                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AppHeader                                               │   │
│  │  [Database icon]  "SQL Simulator"  [AI FAB] [Practice FAB]│  │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  WorkspaceLayout                                                │
│  ┌────────────────────┬────────────────────────────────────┐   │
│  │  Sidebar           │  Main Content (flex-1)             │   │
│  │  (resizable drag)  │                                    │   │
│  │  280px default     │  SqlEditor + toolbar               │   │
│  │  200–600px range   │  LoadingBanner                     │   │
│  │                    │  StatusMessage                     │   │
│  │  ProjectSwitcher   │  ResultTable                       │   │
│  │  ──────────────    │  SimulatorPanel                    │   │
│  │  SchemaSidebar     │  QueryHistory                      │   │
│  │  ──────────────    │  ErdViewer                         │   │
│  │  PracticeNavList   │                                    │   │
│  │  [CategoryContent] │                                    │   │
│  └────────────────────┴────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Responsive behavior:**
- **Mobile** (`< lg`): Sidebar renders above the main content as a full-width stacked block (no drag handle).
- **Desktop** (`≥ lg`): Sidebar is a draggable `ResizableSidebar` on the left; a 4px drag handle sits between it and the main content. `select-none` is applied during drag.

---

## AppHeader

**File:** `src/components/layout/AppHeader.tsx`

```
[DB icon square]  "SQL Simulator"           [actions slot]
                  "Real PostgreSQL in your
                   browser."
```

- Left: 44px rounded square with blue gradient + `Database` lucide icon; H1 with gradient text; subtitle `text-slate-400`.
- Right (`actions` slot): Receives `AiSqlGeneratorPopover` + `PracticeRadialMenu` as sibling FABs.
- Both FABs are mutually exclusive — opening one collapses the other (managed in `App.tsx` state).

---

## Floating Action Buttons (FABs)

### AI SQL Assistant — `AiSqlGeneratorPopover`

**File:** `src/components/ai/AiSqlGeneratorPopover.tsx`

| State | UI |
|-------|----|
| Closed | Header toolbar button **AI SQL** (`AiSqlIcon`) |
| Open | Backdrop + dropdown panel (max ~380px, scrollable) |

**Dropdown panel:**
- Header: `AiSqlIcon` + "SQL Assistant" + × dismiss
- Textarea: "Ask about a query goal" (e.g. courses for CSE students)
- **Get suggestions** primary button
- Results: summary, numbered breakdown, technique cards, tables/columns, pitfalls
- Footer: "Suggestions only — write the SQL yourself in the editor."

**Flow:** Prompt + active schema → POST `/api/sql-guidance` → `sanitizeGuidance()` → read-only cards (no editor insert).

**Keyboard:** Escape closes.

---

### Practice Radial Menu — `PracticeRadialMenu`

**File:** `src/components/practice/PracticeRadialMenu.tsx`

| State | UI |
|-------|----|
| Closed | 56px circle, `LayoutGrid` icon |
| Open | Same circle (blue tinted) + backdrop overlay + 4 orbit buttons |

**Orbit layout:** 4 category buttons orbit from the hub center at fixed compass bearings (180° / 221° / 245° / 270°), radius 148px. Each button = icon circle + label text, with a staggered CSS animation delay (0 / 60 / 120 / 180ms).

**4 categories:**

| Category | Icon | Content |
|----------|------|---------|
| Sample Databases | `Database` | 4 cards (Students, E-commerce, Library, HR) with a "Load" button each |
| Query Templates | `FileText` | 12 categorized example queries with a "Use" button |
| SQL Snippets | `Code2` | Short SQL clause fragments inserted at cursor via `insertAtCursor` |
| Visualization Presets | `BarChart2` | Demo query + sample database combos loaded together |

**Category content panel** (280px max, dark glass): appears to the left of the hub on desktop, below on mobile. Has a header with icon + title + × back button.

**Keyboard:** Escape closes active category first, then closes the menu.

---

## Left Sidebar

Rendered inside `WorkspaceLayout`'s `sidebar` slot. Three vertically stacked sections with a `gap-4`.

### 1. ProjectSwitcher

**File:** `src/components/projects/ProjectSwitcher.tsx`

- Dropdown listing all projects by name.
- Active project highlighted.
- Inline rename: click name → text input → save on blur/Enter.
- Inline delete: confirmation step before removal.
- "New project" button creates a fresh isolated workspace.
- Each project has its own `idb://sqlens-{projectId}` IndexedDB database.

### 2. SchemaSidebar

**File:** `src/components/schema/SchemaSidebar.tsx`

- Header row: `Table2` icon + "Schema" label + "Refresh" ghost button.
- Empty state: "No tables yet" text.
- Each table → `SchemaTableCard` wrapped in `AnimatedReveal` (fade+slide on appearance).

**SchemaTableCard** (`src/components/schema/SchemaTableCard.tsx`):
- Table name header.
- Column list with: name, data type, `PK` badge (blue), `FK` badge (amber), `NULL`/`NOT NULL` tag, default value.
- Foreign key relationships shown with table → column notation.

### 3. Practice Navigation

**File:** `src/components/practice/PracticeNavList.tsx`

Row of 4 category tab buttons (same 4 categories as the radial menu). Active category highlighted. Clicking an active tab deselects it.

Below the nav, if a category is active, `PracticeCategoryContent` renders in a scrollable area:

**File:** `src/components/practice/PracticeCategoryContent.tsx`

- Content is the same as in the Radial Menu's category panel.
- Accepts a `compact` prop used by the Radial Menu to reduce padding.
- All actions (load DB, load query, insert snippet, apply preset) bubble up to `useSqlWorkspace`.

---

## Main Content Area

**File:** `src/App.tsx` (children of `WorkspaceLayout`)

Vertical stack with `space-y-5`. Order from top to bottom:

### 1. SqlEditor

**File:** `src/components/editor/SqlEditor.tsx`

- CodeMirror 6 with SQL language support and dark theme.
- Tracks text selection via `onUpdate` → `onSelectionChange` prop.
- `Mod+Enter` (Ctrl+Enter / Cmd+Enter) triggers `onRun`.
- `insertAtCursor(text)` method exposed via `useImperativeHandle` ref.

**Toolbar** (top-right overlay inside the editor):
- `ErdScrollButton` — 32px circle, `GitFork` icon, smooth-scrolls to `#erd-section`
- `QueryToolbar` — "Run Query" / "Run Selection" button + "Reset DB" button; label changes based on `hasSelection`

**Selection indicator:** A row below the toolbar notes "Running selected text" when text is selected.

### 2. LoadingBanner

**File:** `src/components/layout/LoadingBanner.tsx`

- Terminal-style animated banner, visible only when `isRunning` is true.
- Slides in / fades in; disappears when query completes.

### 3. StatusMessage

**File:** `src/components/common/StatusMessage.tsx`

- `variant="error"` → amber border, amber text (friendly PG error via `simplifyError.ts`).
- `variant="success"` → green border, green text (e.g. "3 rows affected").
- Only one can show at a time; both are conditionally rendered in `App.tsx`.

### 4. ResultTable

**File:** `src/components/results/ResultTable.tsx`

- Sticky header row.
- `NULL` values styled with italic orange text.
- Copy JSON button and Export JSON button in the header.
- Empty state: centered message when no rows returned.
- Horizontal scroll for wide result sets.

### 5. SimulatorPanel

**File:** `src/components/simulator/SimulatorPanel.tsx`

See full detail in [Simulator Panel section](#simulator-panel) below.

### 6. QueryHistory

**File:** `src/components/features/QueryHistory.tsx`

- Inside a `Panel` component with "Query History" title.
- Collapsible list of past SQL queries (most recent first).
- Clicking an item calls `loadHistoryItem()` → loads SQL into editor.
- Per-project history stored in `localStorage` keyed as `sqlens-history-{projectId}`.

### 7. ErdViewer

**File:** `src/components/erd/ErdViewer.tsx`

- React Flow canvas inside a `Panel` with `id="erd-section"` (anchor for `ErdScrollButton`).
- Background grid pattern, zoom/pan, `Controls`, `MiniMap`.
- `fitView` called automatically on schema change.
- FK arrows rendered as labeled edges.
- Empty state: "Run a query to build the schema" message.

**ErdTableNode** (`src/components/erd/ErdTableNode.tsx`):
- Table name header.
- Column rows with `PK` / `FK` badges and data type.
- Connected with smooth step edges labeled with FK column names.

---

## Simulator Panel

**File:** `src/components/simulator/SimulatorPanel.tsx`

A `Panel` with title "SQL Execution Simulator" and a "Simulate Query" / "Simulate Selection" action button in the header.

### States

#### Idle
```
[Cpu icon circle]
"Click Simulate Query to step through each logical execution stage."
"Supports SELECT · FROM · JOIN · WHERE · GROUP BY · HAVING · ORDER BY · LIMIT"
```

#### Loading
```
[Spinner]
"Running stage snapshots…"
```

#### Error
```
[AlertTriangle]  Error message text
──────────────────────────────
[SQL preview — monospace, truncated at 160 chars]
```

#### Success
```
[N execution stages]  [selection badge?]       [▶ Play Simulation]
──────────────────────────────────────────────────────────────────
SimulatorSnapshotViewer
SimulatorDebugPanel
[SimulatorPlaybackModal — lazy, portal, only when open]
```

---

### SimulatorSnapshotViewer

**File:** `src/components/simulator/SimulatorSnapshotViewer.tsx`

**Stage pills row:** Horizontally wrapped clickable pills, one per stage. Each pill shows:
- Stage icon (Lucide, stage-specific)
- Stage label (e.g. "FROM students")
- Row count badge (monospace)
- Red `−N` badge if rows were removed at this stage

**Active stage card** (below pills, full width):
- Color-coded border and header background matching stage type
- Header: stage icon + label + annotation + row count badge + "−N removed" badge
- SQL bar: generated SQL for this stage in monospace
- Result table (`SimulatorSnapshotTable`) — diff-aware, compact dark table:
  - Removed rows: red tint with reason badges
  - Added rows: emerald tint
  - Reordered rows: sky left border
  - NULL-introduced rows: amber tint
  - Hidden columns (SELECT stage): strikethrough header + dimmed values
- JOIN canvas (`SimulatorJoinCanvas`) — only for JOIN stages, below the table:
  - Left table panel + right table panel with SVG connector arrows
  - Solid green = matched pairs, dashed amber = LEFT JOIN NULL rows

**Navigation:** Prev / Next buttons + "Stage N of M" counter. Card fades out/in (160ms) on navigation.

---

### SimulatorDebugPanel

**File:** `src/components/simulator/SimulatorDebugPanel.tsx`

- Collapsible section toggle.
- Three tabs: **SQL** (generated SQL per stage), **Row IDs** (`_rowId` values), **Diff** (raw `StageDiff` JSON).

---

## Simulator Playback Modal

**File:** `src/components/simulator/playback/SimulatorPlaybackModal.tsx`

Opened via the "Play Simulation" button. Lazy-loaded on first open. Rendered into `document.body` via `createPortal`.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ Header                                                        │
│ "SQL EXECUTION PLAYBACK / {table name}"                       │
│ [Space=play/pause] [←→=navigate] [R=restart] [Esc=close]  [×]│
├──────────────┬────────────────────────────────────────────────┤
│ PlaybackTimeline│ PlaybackStage                              │
│  (192px)     │                                               │
│              │  Non-JOIN stages: PlaybackTable               │
│  Execution   │  JOIN stages:     JoinPlaybackCanvas          │
│  Plan        │                                               │
│              │         [StageAnnotation — floating overlay]  │
│  Stage list  │         (bottom-right corner of stage area)   │
│  (clickable) │                                               │
├──────────────┴────────────────────────────────────────────────┤
│ PlaybackControls                                              │
│ [progress drain bar — full width, animated]                  │
│ [←] [▶/⏸] [↺] [→]   Stage N of M    Speed: [0.5×][1×][2×][4×]│
└───────────────────────────────────────────────────────────────┘
```

**Backdrop:** `bg-black/70 backdrop-blur-sm`. Click backdrop to close. Panel uses `bg-[#0d1117]` (darker than slate-950) with a `ring-1 ring-slate-700/50` border, `m-3 rounded-xl`.

---

### PlaybackTimeline

**File:** `src/components/simulator/playback/PlaybackTimeline.tsx`

- 192px wide left sidebar with scrollable stage list.
- Header: "EXECUTION PLAN" label.
- Each stage button:
  - **Active**: color-coded bg tint + left border + colored icon + colored dot on right
  - **Completed**: ✓ checkmark icon, muted text
  - **Pending**: dimmed icon and text
- Clicking any stage navigates there directly.

---

### PlaybackControls

**File:** `src/components/simulator/playback/PlaybackControls.tsx`

Bottom bar, always visible:
- **Progress drain bar** (2px height, full width): gradient `sky-500/60 → sky-400/80`, resets and drains over `HOLD_MS[speed]` while playing. Uses `pb-progress-drain` keyframe.
- **← Prev**: disabled at first stage
- **▶ / ⏸**: play/pause toggle (sky-bordered, sky-tinted button)
- **↺ Restart**: resets to stage 0, stops autoplay
- **→ Next**: disabled at last stage
- **Stage N of M** counter (tabular nums)
- **Speed selector**: segmented control with 0.5× / 1× / 2× / 4× (sky tint on active)

**Speed behavior:**

| Speed | Hold per stage | Animation duration |
|-------|---------------|-------------------|
| 0.5× | 5 000 ms | 1 000 ms |
| 1× | 3 000 ms | 700 ms |
| 2× | 1 800 ms | 450 ms |
| 4× | 900 ms | 260 ms |

---

### PlaybackStage

**File:** `src/components/simulator/playback/PlaybackStage.tsx`

- Scrollable content area (`overflow-y-auto p-6`).
- Dispatches to `PlaybackTable` for all stages except JOIN.
- Dispatches to `JoinPlaybackCanvas` for JOIN stages.
- Collects removed rows from the diff (for WHERE/HAVING/LIMIT) and passes them to `PlaybackTable` for inline display.
- Hosts `StageAnnotation` (absolutely positioned overlay).

---

### PlaybackTable

**File:** `src/components/simulator/playback/PlaybackTable.tsx`

Dark bordered table with animated rows:

| Row Status | Visual |
|------------|--------|
| `unchanged` | Normal |
| `removed` | `opacity-25`, red tint |
| `added` | Emerald tint |
| `reordered` | Sky left border + FLIP slide animation |
| `null-introduced` | Amber tint; NULL values in bold amber |

- **FLIP animation** (`useFlipAnimation`): active only at the ORDER_BY stage. Rows that change position slide smoothly via `translateY` → `transition` to final position.
- **Stagger**: each animated row delays by `rowIndex × 55ms` via `--pb-row-delay` CSS custom property.
- **Speed-aware duration**: `--pb-anim-ms` CSS custom property set to `ANIM_MS[speed]`.
- **Virtualization**: tables with >40 rows show only the first 15 + an ellipsis row + the last 5.
- **"change" column**: appears when any diff exists; shows status badge + reason text (e.g. "Filtered out by WHERE condition").
- **Hidden columns** (SELECT stage): strikethrough header text + "hidden" label; cell values dimmed to near-invisible.

---

### JoinPlaybackCanvas (Playback version)

**File:** `src/components/simulator/playback/JoinPlaybackCanvas.tsx`

An animated 4-phase visualization:

```
Phase 1: idle     — skeleton pulse loading placeholder
Phase 2: tables   — left + right key panels slide in (translateX transition, 400ms)
Phase 3: lines    — SVG connector lines draw one-by-one (strokeDashoffset, 520ms each)
Phase 4: result   — joined result table fades in (opacity + translateY, 450ms)
Phase 5: done     — stable static state
```

**Layout:**
```
[join condition bar: JOIN TYPE  ON  left.key = right.key]

[left panel 160px]   [flex-1 gap + SVG overlay]   [right panel 160px]

[intermediate result table — N rows]

[legend: → matched  ⇢ unmatched → NULL row  [key] join key column]
```

**Key panels**: show only the join-key column. Matched rows highlighted green; unmatched rows dimmed (opacity-35).

**SVG arrows:**
- Solid green (`#10b981`) with arrowhead = matched pairs
- Dashed amber (`#f59e0b`) with arrowhead = LEFT JOIN NULL rows (short stub, no right endpoint)
- Lines drawn sequentially with `200ms / speed` stagger between each

---

### StageAnnotation

**File:** `src/components/simulator/playback/StageAnnotation.tsx`

Floating card, absolutely positioned at `bottom-5 right-5` of the stage area:
- `animate-fade-in-up` on mount + on every stage navigation (`key={animationKey}`)
- Width 288px, `rounded-xl border border-slate-700/60 border-l-2 bg-slate-900/90 backdrop-blur-md`
- Left border color matches stage type
- Content: colored dot + stage label + annotation text + diff summary (e.g. "3 rows removed", "2 columns hidden")
- × button to dismiss; reappears on next stage navigation

---

## User Flow Diagrams

### Core Query Flow

```
User types SQL in SqlEditor
  → Ctrl+Enter or "Run Query" button
    → [if selection: runs selected text only]
    → runQuery(db, sql)
    → getSchema(db) — refreshes sidebar
    → ResultTable updates
    → QueryHistory records entry
```

### AI SQL Guidance Flow

```
User clicks AI SQL (header)
  → Popover opens
  → User describes query goal
  → "Get suggestions"
    → formatSchemaForAi(tables) + POST /api/sql-guidance
    → Google Gemini → JSON guidance
    → sanitizeGuidance() (reject runnable SQL)
    → Cards shown in popover
  → User writes SQL in editor manually
```

### Simulator Flow

```
User clicks "Simulate Query" (or "Simulate Selection")
  → parseSql(sql) → AST
  → validateSqlSupport(ast) — rejects unsupported constructs
  → buildPipeline(ast) → ordered SimulatorStage[]
  → For each stage:
      buildStageSql(ast, stageType) → SQL string
      runQuery(db, stageSql) → rows[]
  → assignRowIds(snapshots) → TrackedRow[] with stable _rowId
  → diffSnapshots(snapshots) → StageDiff[] with RowDiff reasons
  → SimulatorSnapshotViewer renders (always)

  → User clicks "Play Simulation"
      → SimulatorPlaybackModal opens (lazy-loaded portal)
      → useSimulatorPlayback manages state
      → User controls playback via transport bar or keyboard
```

### Practice Sidebar Flow

```
User clicks Practice FAB (radial menu) or category tab (sidebar)
  → Category panel opens (Sample DBs / Templates / Snippets / Presets)

  Sample DB:
    → execSqlScript(db, ddl + seed) → creates tables and data
    → getSchema(db) → sidebar refreshes
    → starter query loaded into editor

  Query Template:
    → loadQuery(sql) → loads into editor

  SQL Snippet:
    → insertAtCursor(text) → appended at CodeMirror cursor

  Visualization Preset:
    → loads sample DB + loads a specific query together
```

### Project Switching Flow

```
User selects a different project in ProjectSwitcher
  → switchProject(id)
    → getDatabase(newProjectId) → PGlite instance from registry
    → useSqlWorkspace resets: clears rows, error, message
    → loads editor draft from localStorage
    → loads query history from localStorage
    → getSchema(newDb) → refreshes schema sidebar + ERD
```

---

## Keyboard Shortcuts

| Context | Shortcut | Action |
|---------|----------|--------|
| SqlEditor | `Ctrl+Enter` / `Cmd+Enter` | Run query (or selection) |
| AI Popover (open) | `Escape` | Close popover |
| Practice Menu (open) | `Escape` | Close active category / close menu |
| Playback Modal | `Space` | Play / Pause |
| Playback Modal | `←` / `→` | Previous / Next stage |
| Playback Modal | `R` | Restart from stage 1 |
| Playback Modal | `Escape` | Close modal |

---

## Component Dependency Map

```
App.tsx
├── AppHeader
│   ├── AiSqlGeneratorPopover
│   └── PracticeRadialMenu
│       └── PracticeCategoryContent
├── WorkspaceLayout
│   ├── ResizableSidebar
│   │   ├── ProjectSwitcher
│   │   └── PracticeSidebar
│   │       ├── SchemaSidebar
│   │       │   └── SchemaTableCard
│   │       ├── PracticeNavList
│   │       └── PracticeCategoryContent
│   └── [main content]
│       ├── SqlEditor  ← ref: SqlEditorHandle (insertAtCursor)
│       │   └── [toolbar] ErdScrollButton + QueryToolbar
│       ├── LoadingBanner
│       ├── StatusMessage
│       ├── ResultTable
│       ├── SimulatorPanel
│       │   ├── SimulatorSnapshotViewer
│       │   │   ├── SimulatorSnapshotTable
│       │   │   └── SimulatorJoinCanvas
│       │   ├── SimulatorDebugPanel
│       │   └── SimulatorPlaybackModal (lazy, portal)
│       │       ├── PlaybackTimeline
│       │       ├── PlaybackStage
│       │       │   ├── PlaybackTable
│       │       │   │   └── PlaybackRow
│       │       │   ├── JoinPlaybackCanvas
│       │       │   └── StageAnnotation
│       │       └── PlaybackControls
│       ├── QueryHistory
│       └── ErdViewer
│           └── ErdTableNode
```

---

## State Architecture

| Hook | Owns |
|------|------|
| `useActiveProject` | Project list, active project ID, PGlite `db` instance registry |
| `useSqlWorkspace` | Query text, selected text, rows, error, message, tables (schema), history, `isRunning` |
| `useQueryHistory` | Per-project history array + localStorage sync |
| `useResizablePanel` | Sidebar pixel width + drag state |
| `useSimulatorPlayback` | Active stage index, play/pause, speed, animationKey, auto-advance interval |
| `useFlipAnimation` | DOM element refs + pre-render position capture for FLIP |

---

## Enhancement Ideas Scaffold

Areas to consider when planning GUI improvements:

- **Simulator Playback**: fullscreen is immersive but no side-by-side compare with editor — consider a split view
- **Playback speed**: currently 4 fixed speeds; a continuous slider could feel more natural
- **StageAnnotation**: currently bottom-right fixed — could be draggable or pinnable
- **ResultTable**: no column sorting, no column resizing, no pagination — all common table enhancement targets
- **ErdViewer**: auto-layout is grid-based; a force-directed or Dagre layout would improve readability for large schemas
- **SchemaSidebar**: no search/filter for large schemas with many tables
- **QueryHistory**: no search, no favorites, no delete-individual-entry
- **SqlEditor**: no multi-cursor, no SQL formatter button, no error inline markers from PGlite
- **AppHeader**: no breadcrumb / project name visible at a glance when scrolled down
- **Mobile**: Practice Radial Menu orbit layout may need redesign for small screens
- **Dark/Light mode**: currently dark-only; light mode toggle would improve accessibility
- **Onboarding**: no tutorial overlay or guided first-run experience
