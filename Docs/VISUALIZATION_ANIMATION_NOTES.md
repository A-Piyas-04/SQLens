# SQL Execution Visualization — Animation Implementation Notes (TEMPORARY)

> Temporary working document. Describes how the query-execution playback
> animation works today, per-operation choreography, known limitations, and
> concrete ideas for improving animation quality. Delete when no longer needed.

---

## 1. TL;DR

- The visualization replays a `SELECT` query **stage by stage** in SQL's logical
  order (`FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`).
- Each stage's intermediate result is **actually executed** in the browser via
  PGlite (Postgres in WASM), so the data shown is real.
- Rows keep a **stable identity (`_rowId`)** across stages, and a **diff**
  between consecutive stages decides which rows were removed, added, reordered,
  or got NULLs.
- Animation uses **no animation library**. It is plain React state + `setTimeout`
  phase timelines + CSS `@keyframes`/transitions + one hand-written FLIP hook
  (ORDER BY) + an SVG overlay (JOIN arrows).
- Every table stage runs a **3-act choreography**: `departing → transforming →
  arriving → settled → idle`. JOIN has its own separate timeline.

---

## 2. Stack

| Concern | Tech |
| --- | --- |
| UI | React 19 (`useTransition`, `memo`, `useLayoutEffect`), TypeScript |
| Styling / motion | Tailwind CSS v4 utility classes + custom `@keyframes` in `src/index.css` (all prefixed `pb-`) |
| SQL parsing | `node-sql-parser` (AST → pipeline + per-stage SQL) |
| SQL execution | `@electric-sql/pglite` (in-browser Postgres) |
| Overlay drawing | Inline SVG (`<line>`, `<marker>`, `stroke-dasharray` draw-on) |
| Layout measurement | `getBoundingClientRect`, `ResizeObserver`, `requestAnimationFrame` |
| Libraries NOT used | No Framer Motion, GSAP, react-spring, or View Transitions API in playback |

---

## 3. File map

### Data pipeline (pure, non-visual)

| File | Role |
| --- | --- |
| `src/lib/simulator/sql/parseSql.ts` | SQL → AST |
| `src/lib/simulator/sql/supportedSql.ts` | Rejects CTE, UNION, window functions, subqueries, RIGHT/FULL/CROSS JOIN |
| `src/lib/simulator/pipeline/buildPipeline.ts` | AST → ordered list of stages (one stage per JOIN) |
| `src/lib/simulator/sql/buildStageSql.ts` | Builds the SQL that produces each stage's intermediate result |
| `src/lib/simulator/snapshot/generateSnapshots.ts` | Runs each stage's SQL, assigns row IDs, builds annotations, fetches the right-hand table for JOINs, computes diffs |
| `src/lib/simulator/snapshot/assignRowIds.ts` | Stable row identity across stages |
| `src/lib/simulator/snapshot/diffSnapshots.ts` | Row and column diffs between consecutive snapshots |

### Playback (visual)

| File | Role |
| --- | --- |
| `src/components/simulator/playback/SimulatorPlaybackModal.tsx` | Fullscreen portal, keyboard shortcuts, wires snapshot/prevSnapshot/diff into the stage |
| `src/hooks/useSimulatorPlayback.ts` | Playback state machine: active index, play/pause, speed, `animationKey`, `transitionPhase`, timing tables |
| `src/components/simulator/playback/PlaybackStage.tsx` | Runs the 3-act phase timeline; picks table vs JOIN canvas; injects CSS timing variables |
| `src/components/simulator/playback/PlaybackTable.tsx` | Per-operation logic (filters, GROUP BY grouping, SELECT column drop, ORDER BY FLIP, LIMIT cut line, virtualization) |
| `src/components/simulator/playback/PlaybackRow.tsx` | Maps phase + row flags → CSS classes / inline delays |
| `src/hooks/useFlipAnimation.ts` | FLIP (First-Last-Invert-Play) row sliding for ORDER BY |
| `src/components/simulator/playback/JoinPlaybackCanvas.tsx` | JOIN-specific timeline (tables → keys → matching → result) |
| `src/components/simulator/playback/join/joinPlaybackModel.ts` | Parses ON clauses, resolves join keys, builds match steps |
| `src/components/simulator/playback/join/JoinArrowOverlay.tsx` | SVG arrows between matched rows |
| `src/components/simulator/playback/join/JoinMatchBridge.tsx` | Center lane + "pair i / n" counter |
| `src/components/simulator/playback/StageEntryBanner.tsx` | Floating stage pill shown for 1.8 s on each stage change |
| `src/components/simulator/playback/PlaybackControls.tsx` | Prev/Next/Play, speed; buttons disabled while `isTransitioning` |
| `src/index.css` (section "Playback", roughly lines 452–977) | All `pb-*` keyframes, classes, and reduced-motion overrides |

---

## 4. End-to-end flow

```text
User SQL
  └─ parseSql ─ validateSqlSupport ─ buildPipeline        (stage list)
       └─ for each stage:
            buildStageSql → PGlite.runQuery               (real rows)
            assignRowIds(rows, prevRows)                  (stable _rowId)
            [JOIN] buildRightTableSql → rightTableRows    (right panel)
       └─ diffSnapshots(snap[i-1], snap[i])               (StageDiff[])
SimulatorPlaybackModal
  └─ useSimulatorPlayback(totalStages)                    (index, speed, phase)
       └─ PlaybackStage(snapshot, prevSnapshot, diff)
            ├─ JOIN  → JoinPlaybackCanvas (own timeline)
            └─ other → PlaybackTable → PlaybackRow (CSS classes per phase)
```

Animation is therefore **data-driven**: the CSS only "plays" what the diff
says happened. Nothing is animated that the diff did not detect.

---

## 5. Core logic

### 5.1 Stable row identity — `assignRowIds`

- FROM stage: sequential IDs `row-0`, `row-1`, …
- Later stages: for each current row, find the **first unused** previous row
  whose values match on **all shared columns** (string-normalized, NULL == NULL).
  Reuse its `_rowId`; otherwise assign `row-new-{n}`.
- JOIN right-hand table gets its own independent ID space.

This is what lets a row "be the same row" while it is filtered, sorted,
projected, or truncated.

### 5.2 Diff — `diffSnapshots`

Per row (`RowStatus`):

| Status | Rule |
| --- | --- |
| `removed` | ID in prev, missing in curr |
| `added` | ID in curr, missing in prev (JOIN expansion, computed rows) |
| `null-introduced` | Same ID, some shared column went non-NULL → NULL |
| `reordered` | Same ID, different **index** |
| `unchanged` | Same ID, same index, no new NULLs |

Columns: a column present in prev but absent in curr is `hidden` (SELECT
projection). Each diff gets a human-readable `reason` (for example
`"Filtered out by WHERE condition"` or `"Dropped — exceeds LIMIT 5"`).

### 5.3 Playback state machine — `useSimulatorPlayback`

- `activeIndex`, `isPlaying`, `speed` (`0.5 | 1 | 2 | 4`), `stepMode` (default `true`).
- `animationKey` increments on **every** navigation; it is used as a React `key`
  and as an effect dependency to restart CSS animations.
- `transitionPhase`: `idle | departing | transforming | arriving | settled`.
  `isTransitioning = phase !== "idle"` blocks navigation and disables controls.
- Index changes are wrapped in `startTransition` (non-urgent render).
- Auto-advance uses `setInterval(HOLD_MS[speed])` and skips a tick when a phase
  is in progress.

Timing tables (ms):

| Speed | `HOLD_MS` (time per stage) | `ANIM_MS` | `STAGGER_MS` | `REMOVE_MS` | `ENTRY_MS` |
| --- | --- | --- | --- | --- | --- |
| 0.5× | 5000 | 1000 | 60 | 600 | 500 |
| 1× | 3000 | 700 | 40 | 400 | 350 |
| 2× | 1800 | 450 | 25 | 260 | 220 |
| 4× | 900 | 260 | 15 | 150 | 130 |

### 5.4 The 3-act choreography — `PlaybackStage`

```ts
const ACT1_RATIO = 0.4; // departing   — highlight what is about to change
const ACT2_RATIO = 0.8; // transforming — the actual motion
const ACT3_RATIO = 0.3; // arriving    — confirm survivors / new state
```

At 1×: act1 = 280 ms, act2 = 560 ms, act3 = 210 ms (≈1.05 s total, then
`settled` for 50 ms, then `idle`).

Rules:

- **Backward navigation** → no choreography, jump straight to `idle`.
- **JOIN** → not choreographed here (the JOIN canvas runs its own timeline).
- **First stage (FROM)** → skips `departing`: `transforming → arriving → settled`.
- During `departing` the table shows the **previous** stage's rows. During
  `transforming` it still shows previous rows for `WHERE`, `HAVING`, `LIMIT`,
  `GROUP_BY`, `SELECT` (so they can visibly leave/collapse). Otherwise it shows
  the new rows.

Timing reaches CSS through custom properties on the wrapper:

```text
--pb-anim-ms  --pb-stagger-ms  --pb-act1-ms  --pb-act2-ms
--pb-act3-ms  --pb-remove-ms   --pb-entry-ms
```

So **one** set of CSS classes automatically scales with playback speed.

### 5.5 Re-triggering CSS animations

`<tbody key={`${animationKey}-${transitionPhase}`}>` remounts every row on each
phase change, which guarantees keyframe animations restart from 0%. Status
styling (badges, `data-status`) is only applied in `settled`/`idle`, so diff
colors appear **after** the motion, not during it.

---

## 6. Per-operation choreography

| Stage | Act 1 — departing | Act 2 — transforming | Act 3 — arriving / settled |
| --- | --- | --- | --- |
| **FROM** | (skipped) | Table container grows in (`pb-table-from-enter`, max-height 0 → 2000px); rows cascade down (`pb-row-enter-cascade`, translateY −15px → 0) with stagger `min(40, 600 / rowCount)` ms | Stage banner; settled |
| **WHERE / HAVING** | Rows that will be removed pulse red (`pb-row-condemned`), ✕ icon fades in | Condemned rows slide right and fade out (`pb-row-eject`, translateX 0 → 60px) with stagger `min(35ms, act2 × 0.4 / removedCount)` | Surviving rows get a green left bar (`pb-row-survived`); header count shows `old → new` with a strikethrough and a scale pulse (`pb-count-update`); badges + reasons fade in |
| **GROUP BY** | Rows tinted by group (6-color palette for left border + background, `groupIndex % 6`) | Group leader keeps its tint; followers collapse (`pb-row-group-collapse`, opacity 0) with delay `groupIndex × 150ms` | Grouped rows slide in from left (`pb-row-group-arrive`) with group border color |
| **SELECT** | Dropped column headers turn red; a strike line draws across (`pb-col-dropped-header::after`, `pb-strike-draw`); dropped cells dim | Dropped headers collapse width/padding/opacity (`pb-col-collapsing`), staggered `colIdx × 100ms` | Surviving column headers flash green (`pb-col-survived`) |
| **ORDER BY** | ORDER BY columns highlighted (`pb-order-col-highlight`) | FLIP slide: rows animate from old Y to new Y (`cubic-bezier(0.22,1,0.36,1)`); rows moved > 20px glow + slight blur; reordered rows flash accent (`pb-row-sliding`) | ORDER BY column text fades from accent back to normal (`pb-order-col-post`) |
| **LIMIT** | Rows split into "kept" body and a second body under a dashed `LIMIT N` cut line; cut rows pulse red | Cut rows eject (same as WHERE) | Count pulse `old → new`; badges |
| **JOIN** | See section 7 | | |

Common to all stages:

- `StageEntryBanner` — pill with stage icon and subtitle, drops in
  (`pb-stage-entry`, 200 ms) and auto-hides after 1.8 s.
- Diff badges (`filtered`, `matched`, `reordered`, `null row`) slide in
  (`pb-badge-in`) only after settling.
- NULL-introduced cells get an amber background pulse (`pb-cell-null`).

### 6.1 ORDER BY FLIP — `useFlipAnimation`

```text
First : positions captured (getBoundingClientRect().top) at the end of the last effect run
Last  : new positions measured in useLayoutEffect after commit
Invert: el.style.transform = translateY(first - last), transition: none
Play  : double requestAnimationFrame → set transition and clear the transform
```

Enabled only when `stageType === "ORDER_BY" && phase === "transforming"`
(`flipKey = animationKey`, otherwise `-1`). Rows register via a ref callback
keyed by `_rowId`.

---

## 7. JOIN animation — `JoinPlaybackCanvas`

Its own phase machine: `idle → tables → keys → matching → result → done`.

Layout: 3-column grid — **left key table** (working set) | **bridge lane** |
**right key table** (new table). Only the join-key column is shown in the side
panels, max 14 rows each.

Timeline (all values divided by `speed`):

| Step | Duration (1×) | Visual |
| --- | --- | --- |
| initial delay | 60 ms | skeleton placeholders (`animate-pulse`) |
| `tables` | 380 ms | left slides in from −28px, right from +28px (opacity + transform transition) |
| `keys` | 320 ms | key column headers pulse amber twice (`pb-key-pulse`) |
| `matching`, per pair | connect 520 + hold 180 + gap 120 | active rows highlighted with a ring + dot; SVG arrow drawn left → right (`stroke-dashoffset` from length → 0, `pb-join-arrow-draw`); LEFT JOIN without a match draws a short dashed stub (`pb-join-arrow-null-draw`) |
| skipped summary | 700 ms | "+N more matched rows in the result below" |
| `result` / `done` | +80 / +520 ms | panels dim to 45% opacity; intermediate result table slides up (translateY 28px → 0); result rows cascade |

Matching logic (`buildJoinMatchSteps`):

1. Parse all `ON a.x = b.y` clauses (alias-aware regex), pick the one for this
   `joinIndex`, and map it to left/right panels (`resolvePanelJoinKeys`), handling
   prefixed columns such as `orders_id`.
2. Walk the **actual joined rows** from PGlite. For each, find the left row and
   right row with the same key value → a `{ rightId }` pair. A joined row whose
   right-side columns are all NULL → a `{ null: true }` pair.
3. Group pairs per left row (one-to-many shows a `×N` badge and an `i / n`
   counter in the bridge).
4. Only the first `MAX_ANIMATED_STEPS = 6` left rows with matches are animated.

Arrow geometry: anchors are measured from the key cells relative to the stage
container (`measureAnchors`), re-measured on every phase/step change, on rAF,
and via `ResizeObserver`. Arrows **persist** (all previous arrows stay visible,
only the newest one is in a "drawing" state).

---

## 8. Accessibility and motion preferences

- Three `@media (prefers-reduced-motion: reduce)` blocks in `src/index.css`:
  - Disable the `pb-*` table/badge/join animations.
  - A global rule shortens every animation/transition to 0.01 ms.
  - Wildcard selectors (`[class*="pb-row-"]`, `[class*="pb-col-"]`,
    `[class*="pb-join-arrow"]`, …) kill animations, remove blur, and force arrows
    fully drawn (`stroke-dashoffset: 0`).
- Keyboard: `Space` play/pause (or step in step mode), `← →` navigate (blocked
  while transitioning), `R` restart, `Esc` close. Focus moves to the close
  button on open; body scroll is locked.
- Debug logging: `localStorage.setItem("simulator:debug", "1")`.

---

## 9. Performance measures already in place

- `memo` on `PlaybackStage`, `PlaybackTable`, `PlaybackRow`.
- Row virtualization: more than 40 rows → render first 15 + an ellipsis row +
  last 5. Eject animation runs only for visible rows; hidden condemned rows just
  go `opacity-0`.
- Eject stagger is capped so the total stagger fits inside 40% of act 2.
- Durations shrink at higher speeds so motion finishes before auto-advance.
- Mostly transform/opacity-based keyframes (GPU-friendly), with the exceptions
  listed under limitations.
- `startTransition` for stage index updates.

---

## 10. Limitations and known issues

Found by reading the code; most are not yet verified in the browser.

### 10.1 Correctness / logic

1. **ORDER BY FLIP probably rarely slides.** `useFlipAnimation` only runs its
   layout effect when `flipKey` changes. `flipKey` is `-1` during `departing`
   (the same value as the previous stage), so the effect does **not** run then,
   and the "first" positions of the unsorted rows are never captured. Also,
   rows only register when `isOrderBy` is true, so on the first ORDER BY visit
   the stored positions are empty, and no movers are found. In practice the
   visible effect is probably just the `pb-row-sliding` background flash.
2. **The `tbody` remount defeats CSS transitions.** Because `tbody` is keyed by
   `animationKey-transitionPhase`, rows are fresh DOM nodes each phase.
   Transition-based classes (`pb-row-collapsing`, `pb-row-group-collapse`, the
   GROUP BY follower `transitionDelay`) have no previous style to transition
   from, so they apply **instantly**. Only `@keyframes` animations actually play.
3. **Table rows can't collapse via `max-height`.** `<tr>` ignores
   `max-height`/`padding`, so `pb-row-collapsing` does not shrink row height;
   removed rows leave their space until the next phase swaps the data.
4. **SELECT column collapse is header-only.** `pb-col-collapsing` is applied to
   `<th>` only; body cells just dim (`pb-col-dropped-data`), so the column width
   is held by its data and doesn't really collapse.
5. **Index-based reorder detection is noisy.** After WHERE/LIMIT removes rows,
   every survivor below a removed row has a new index and is marked
   `reordered` (gets a badge) even though relative order didn't change.
6. **Greedy row identity.** `assignRowIds` takes the first unused match on shared
   columns. Duplicate rows, aggregates, aliases, and computed columns can produce
   wrong lineage (for example GROUP BY output inherits the first member's ID;
   computed SELECT columns become `added`).
7. **JOIN matching assumes a simple equi-join.** Only `a.x = b.y` is parsed;
   composite keys, `AND`/`OR`, expressions, `USING`, and non-equality joins aren't
   represented. `leftRows.find(...)` maps duplicate left key values to the
   **first** left row only.
8. **JOIN timeline vs auto-play.** JOIN doesn't set `transitionPhase`, so
   controls stay enabled and auto-advance can fire mid-animation. At 1× with
   6 single-pair steps the JOIN timeline is ≈5.7 s, longer than `HOLD_MS` (3 s),
   so auto-play cuts it off.
9. **JOIN display caps.** Only 14 rows per panel and 6 animated left rows; arrows
   to rows beyond 14 are silently skipped.
10. **Hook-order risk in the modal.** `SimulatorPlaybackModal` returns early
    (`if (!snapshot) return null;`) **before** a `useEffect` and a `useCallback`,
    which breaks the Rules of Hooks if `snapshot` is ever missing.
11. **Possible banner off-centering (verify).** `StageEntryBanner` uses Tailwind
    v4 `-translate-x-1/2` (CSS `translate` property) **and** the `pb-stage-entry`
    keyframe uses `transform: translate(-50%, …)`. The two compose, which may
    shift the pill an extra 50% to the left.
12. **Dead / duplicate CSS.** `.pb-join-result-row` and
    `.pb-table tr[data-pb-flip-glow]` are defined twice (the later definition
    wins); `pb-scan-*`, `pb-progress-drain`, `pb-row-remove`, `data-will-remove`,
    `data-row-enter`, `data-will-collapse`, and `buildBridgePath` (bezier
    curves) appear unused.

### 10.2 Scope

- Unsupported: CTEs, UNION, window functions, subqueries, RIGHT/FULL/CROSS JOIN,
  non-SELECT statements.
- DISTINCT, aggregate computation itself (how `SUM` is formed), and
  expression evaluation are not visualized; you only see their results.
- Each stage is a separate SQL query against PGlite. `assignRowIds` is
  O(n × m), so large tables slow down snapshot generation.

### 10.3 Animation quality

- Timing comes from `setTimeout` chains, not a single clock. Under main-thread
  load, phases can drift and overlap with CSS durations.
- Several keyframes animate layout properties (`max-height`, `width`, `padding`,
  `background-color`, `filter: blur`), which cause layout/paint work rather than
  compositor-only motion.
- There's no interruption handling: navigating mid-phase is blocked instead of
  smoothly retargeting, and backward navigation has no animation at all.
- Virtualized tables (> 40 rows) lose continuity for hidden rows.

---

## 11. Ideas for better animation quality

Ordered roughly by impact versus effort.

### Quick wins

1. **Fix ORDER BY FLIP.** Capture "first" positions when entering `departing`
   (for example run the measurement on a `departing` key, or measure in the
   render that switches to `transforming` via a `useLayoutEffect` keyed on
   `transitionPhase`). Register rows regardless of stage type.
2. **Stop remounting `tbody` per phase.** Key it by `animationKey` only, and
   restart keyframes by toggling classes (or bumping a `data-phase` attribute).
   This makes transitions (collapses, group delays) actually animate and cuts
   DOM churn.
3. **Animate row removal with a wrapper.** Wrap cell content in a `div` and
   animate its height (or use `grid-template-rows: 1fr → 0fr`), since `<tr>`
   can't collapse. Alternatively render the playback table with CSS grid instead
   of `<table>`.
4. **Collapse body cells too in SELECT.** Apply the collapse class to the `<td>`s
   of dropped columns (with an inner wrapper so width can shrink).
5. **Order-aware reorder detection.** Compare relative order of survivors
   (longest increasing subsequence on `prevIndex`) so only truly moved rows are
   `reordered`.
6. **Make JOIN participate in `transitionPhase`.** Set `transforming` while the
   JOIN timeline runs and `idle` at `done`, so auto-play waits and controls lock
   consistently. Alternatively derive `HOLD_MS` for JOIN from the timeline length.
7. **Fix the banner transform** (use `translate` in the keyframe, or drop the
   Tailwind translate class) and move hooks above the early return in the modal.
8. **Remove dead CSS** and deduplicate rules.

### Medium

9. **Single-clock timeline.** Replace `setTimeout` chains with one
   `requestAnimationFrame` driver (or the Web Animations API with
   `animation.finished` promises), so phases and CSS stay in sync and can be
   paused, scrubbed, or reversed.
10. **Web Animations API (`element.animate`)** for FLIP and ejects: interruptible,
    reversible, and you can `await` completion instead of guessing with timeouts.
11. **Compositor-only motion.** Prefer `transform`/`opacity` (for example
    `scaleY` on a wrapper instead of `max-height`; an opacity overlay instead of
    animating `background-color`; drop the `filter: blur`).
12. **Reverse animations for backward navigation** (play the 3 acts in reverse,
    or a short crossfade), instead of an instant jump.
13. **Curved JOIN arrows.** `buildBridgePath` already produces a cubic bezier;
    switch the overlay from `<line>` to `<path>` and use `getTotalLength()` for an
    accurate draw-on length.
14. **Shared-element transitions between stages** using React's
    `<ViewTransition>` / `document.startViewTransition` with
    `view-transition-name: row-{_rowId}`. This gives FLIP-like row continuity
    for free across every stage, including virtualized tables.

### Larger

15. **Visualize aggregation**: show group members stacking into one row and the
    aggregate value counting up (`SUM`, `COUNT`, `AVG`).
16. **Better row lineage**: carry provenance from SQL (for example add
    `ctid`/primary key columns to each stage query) instead of value matching.
17. **Smarter large-table handling**: windowed virtualization that keeps rows
    affected by the current diff in view, plus a "focus on changes" mode.
18. **Support more SQL**: DISTINCT, RIGHT/FULL JOIN (mirror the LEFT JOIN null
    stub on the right), composite join keys, and subqueries as nested playbacks.

---

## 12. How to experiment

- Enable debug logs: `localStorage.setItem("simulator:debug", "1")`.
- Show row IDs (lineage) via the Lesson panel toggle (persisted in
  `simulator:showRowIds`).
- Use **step mode** (default) to inspect each phase; switch to auto-play with
  0.5× speed to watch the timings.
- Test reduced motion in DevTools → Rendering → "Emulate CSS
  prefers-reduced-motion: reduce".
