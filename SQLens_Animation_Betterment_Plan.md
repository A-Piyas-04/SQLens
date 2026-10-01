# SQLens — Animation & Visualization Betterment Plan

> **Purpose:** Redesign and stabilize the SQL Execution Simulation playback so that it is smooth, readable, educational, interrupt-safe, and testable without removing existing functionality.
>
> **Scope:** Fullscreen simulator playback only. The SQL execution/snapshot engine should remain intact unless a correctness issue in row identity/diffing directly breaks the animation.
>
> **Primary principle:** **Do not animate the table. Animate the SQL operation.**

---

# 1. Goals

The improvement work must solve two distinct classes of problems.

## 1.1 Animation reliability

Current symptoms:

- Some animations pause unexpectedly.
- Some transitions feel smooth while others appear instant.
- Some animations are cut off by autoplay.
- ORDER BY movement may fail and degrade into only a color flash.
- GROUP BY collapse can appear abrupt.
- SELECT column removal can look incomplete.
- Backward navigation jumps instead of animating.
- JOIN uses a separate timeline and can fall out of sync with the global playback state.
- CSS transitions can fail because DOM elements are remounted between phases.

The new playback must:

- Run from a predictable timeline.
- Know when an animation actually finishes.
- Pause/resume correctly.
- Never auto-advance while an animation is still active.
- Preserve DOM element identity between phases.
- Use smooth transform/opacity movement wherever possible.
- Support reverse/backward navigation cleanly.
- Avoid timer drift and race conditions.

## 1.2 Visualization readability

Current symptoms:

- Too much data is visible during an operation.
- The user may not know what they are supposed to look at.
- The floating stage banner can overlap important table headers.
- Horizontal scrolling is often required while the animation is running.
- Multiple visual signals compete at once: pulses, badges, borders, arrows, count changes, glow, blur, etc.
- JOIN can become visually noisy.
- GROUP BY does not visually explain grouping and aggregation strongly enough.
- The side panels reduce center-stage space.

The new playback must:

- Focus the user's attention on the exact SQL operation.
- Preserve existing explanatory features.
- Make the right lesson sidebar collapsible instead of removing it.
- Reduce irrelevant columns/rows during animation.
- Make each SQL operation visually distinct but follow one consistent interaction grammar.
- Avoid visual clutter and overlapping UI.
- Keep the central visualization dominant.

---

# 2. Non-goals

The following are **not** part of this animation redesign unless needed to prevent malfunction:

- Rewriting the SQL parser.
- Rewriting PGlite execution.
- Replacing the existing snapshot engine.
- Changing logical SQL execution order.
- Removing the Lesson panel.
- Removing the SQL context sidebar.
- Removing diff metadata.
- Removing keyboard navigation.
- Adding unsupported SQL syntax such as CTE, UNION, window functions, RIGHT/FULL/CROSS JOIN unless separately scheduled.

The current engine already provides useful foundations:

- Real per-stage PostgreSQL results.
- Logical stage order.
- Stable-ish row IDs.
- Snapshot diffs.
- JOIN match data.
- Per-stage annotations.

The focus should remain on the playback rendering and animation orchestration layer.

---

# 3. Core UX model

Every stage should follow the same three-part visual grammar:

## 3.1 Focus

Show the user what matters for the current operation.

Examples:

- WHERE → predicate columns + rows being tested.
- JOIN → join-key columns and active pair.
- GROUP BY → grouping columns + aggregate input columns.
- SELECT → selected vs dropped columns.
- ORDER BY → sort columns and row order.
- LIMIT → row positions and cutoff.
- HAVING → grouped result + predicate/aggregate columns.

Irrelevant information should be hidden, dimmed, or deferred.

## 3.2 Action

Animate the actual SQL operation.

Examples:

- WHERE → failing rows leave.
- JOIN → matching rows connect.
- GROUP BY → rows gather into groups.
- SELECT → unwanted columns leave.
- ORDER BY → the same rows physically move to new positions.
- LIMIT → rows below the cutoff leave.
- HAVING → groups failing the condition leave.

## 3.3 Result

Reveal or settle into the resulting intermediate table.

The final state must be stable, readable, and directly correspond to the actual stage snapshot.

---

# 4. Playback layout redesign

## 4.1 Keep both sidebars

No existing feature should be removed.

### Left SQL/context sidebar

Keep:

- SQL context.
- Stage navigation.
- Row counts / stage state.
- Keyboard behavior.

Possible future improvement:

- Optional collapse can be added later if needed.
- Do not make this a prerequisite for the animation rewrite.

### Right Lesson sidebar

Make it **collapsible**.

#### Expanded state

Recommended width:

- 300–340 px desktop.
- Existing lesson content fully visible.

#### Collapsed state

Recommended width:

- 44–52 px.

Display:

- Stage icon.
- Rotated or vertical `Lesson` label, or icon-only compact rail.
- Expand button / chevron.
- Optional change-count badge.

#### Behavior

- Use smooth width transition.
- The center visualization expands automatically.
- Persist state in `localStorage`.
- Restore the user's last preference on next open.
- On smaller screens, prefer overlay/drawer behavior rather than forcing a tiny visualization.

Suggested preference key:

```text
simulator:lessonPanelCollapsed
```

Optional persisted width:

```text
simulator:lessonPanelWidth
```

## 4.2 Remove the floating stage banner from the data area

Current style:

```text
GROUP_BY · Collapsing rows into groups
```

Problem:

- It can overlap column headers.
- It appears on top of the information the user is supposed to inspect.

Replace it with a permanent operation bar above the visualization.

Example:

```text
┌──────────────────────────────────────────────────────┐
│ GROUP BY    d.id, d.name             5 rows → 3 groups │
└──────────────────────────────────────────────────────┘
```

The operation bar can contain:

- Stage icon.
- Stage name.
- Relevant expression.
- Before/after row count.
- Short action phrase if useful.

No floating overlay should cover active table content.

## 4.3 Center visualization should dominate

Target visual priority:

1. Active SQL operation.
2. Visualization.
3. Result.
4. Supporting explanation.
5. SQL/context navigation.

The center stage should receive the extra width when the Lesson panel is collapsed.

---

# 5. Animation architecture redesign

## 5.1 Stop using timeout chains as the source of truth

Current risk:

```text
setTimeout
→ React state update
→ CSS animation starts
→ another timeout assumes animation finished
```

Problems:

- Browser/main-thread delay can cause drift.
- CSS duration and JS timeout can disagree.
- Pause/resume becomes unreliable.
- JOIN can outlive global stage timing.
- Speed changes are difficult to synchronize.

### New model

Use animation completion itself as the source of truth.

Recommended flow:

```text
enterStage()
    ↓
focusPhase()
    ↓ await animation.finished
actionPhase()
    ↓ await animation.finished
resultPhase()
    ↓ await animation.finished
settled
    ↓
stageComplete = true
    ↓
autoplay may advance
```

Recommended technologies:

- **Preferred:** Web Animations API (`element.animate()` + `.finished`).
- Alternative: one requestAnimationFrame-driven timeline abstraction.
- A motion library may be used if it clearly simplifies pause/reverse/scrubbing without introducing excessive bundle or conceptual complexity.

The important rule is not the specific library.

The important rule is:

> **No guessed timeout should decide that a visual transition has finished.**

## 5.2 Central animation controller

Create one playback timeline/controller responsible for:

- Current stage.
- Current phase.
- Play.
- Pause.
- Resume.
- Cancel.
- Reverse.
- Speed.
- Stage completion.
- Autoplay eligibility.
- Active animations.
- Reduced-motion behavior.

Possible API:

```ts
type PlaybackPhase =
  | "focus"
  | "action"
  | "result"
  | "settled";

interface StageAnimationController {
  play(): Promise<void>;
  pause(): void;
  resume(): void;
  cancel(): void;
  reverse(): Promise<void>;
  setPlaybackRate(rate: number): void;
  getPhase(): PlaybackPhase;
  isRunning(): boolean;
}
```

The controller should track all active `Animation` objects.

When speed changes:

```ts
animation.playbackRate = nextRate;
```

When paused:

```ts
animation.pause();
```

When resumed:

```ts
animation.play();
```

When stage changes unexpectedly:

```ts
animation.cancel();
```

then safely initialize the next stage.

## 5.3 One global completion contract

Every stage implementation must expose one consistent contract:

```ts
await runStageAnimation(...)
```

JOIN must no longer be a special unsynchronized island.

Autoplay rule:

```text
advance only when:
stageAnimationState === "complete"
AND user has not paused
AND there is a next stage
```

This directly prevents JOIN or any other long animation from being cut off.

---

# 6. DOM stability

## 6.1 Do not remount `<tbody>` on every phase

Current anti-pattern:

```tsx
<tbody key={`${animationKey}-${transitionPhase}`}>
```

This destroys and recreates the row DOM between phases.

Consequences:

- CSS transitions lose their previous state.
- FLIP measurements become fragile.
- Group-collapse transitions can apply instantly.
- DOM churn increases.
- Browser cannot preserve visual continuity.

Change to:

```tsx
<tbody key={animationKey}>
```

Better:

- Keep stable row nodes whenever possible.
- Use `_rowId` as the persistent React key.

```tsx
<PlaybackRow key={row._rowId} row={row} />
```

Change animation state through attributes/classes:

```html
<tr
  data-phase="action"
  data-status="removed"
>
```

## 6.2 Persistent row identity

For every stage where a row survives:

- Same `_rowId`.
- Same React key.
- Same DOM element whenever possible.

This is critical for:

- ORDER BY.
- WHERE survivor movement.
- LIMIT.
- SELECT.
- GROUP BY leader transitions.
- Cross-stage continuity.

## 6.3 Avoid forced remounting to restart animations

Instead of remounting DOM to restart keyframes:

- Use Web Animations API.
- Or explicitly toggle data attributes/classes after a frame.
- Or restart named animation objects.

Do not use DOM destruction as an animation restart mechanism.

---

# 7. Rendering foundation: use an animation-friendly data grid

## 7.1 Keep normal HTML tables for normal query results

The regular results table can remain semantic `<table>` markup.

## 7.2 Playback visualization should move toward CSS Grid

Reason:

Native `<table>` layout is difficult to animate.

Problems include:

- `<tr>` does not smoothly collapse with `max-height`.
- `<td>` content can keep column width alive.
- Width/padding animation causes layout work.
- Row reflow behavior is hard to coordinate.

Recommended playback component:

```text
PlaybackDataGrid
├── header row
│   ├── cell
│   ├── cell
│   └── cell
└── data rows
    ├── row
    │   ├── cell
    │   ├── cell
    │   └── cell
```

Possible structure:

```tsx
<div role="table" className="pb-grid">
  <div role="row" className="pb-grid-header">...</div>
  <div role="rowgroup">
    <div role="row">...</div>
  </div>
</div>
```

Use CSS Grid columns.

Benefits:

- Easier column collapse.
- Easier row collapse.
- Easier transform animation.
- Easier temporary operation-specific layout.
- Better control of clipping.
- Better responsive behavior.

## 7.3 Transitional implementation

This migration can be incremental.

Phase 1:

- Fix timeline and DOM stability using current table.

Phase 2:

- Introduce `PlaybackDataGrid`.
- Migrate stage-by-stage.

Do not block reliability fixes on the complete data-grid rewrite.

---

# 8. Motion performance rules

## 8.1 Prefer compositor-friendly properties

Primary animation properties:

```css
transform
opacity
```

Use:

- `translateX`
- `translateY`
- `scale`
- `scaleY`
- `opacity`

Avoid frequent animation of:

- `width`
- `height`
- `max-height`
- `padding`
- `filter: blur`
- large-area `background-color`
- box-shadow/glow on many rows

These trigger layout or paint work.

## 8.2 Row removal

Preferred:

```text
slight red emphasis
→ translateX(24px)
→ opacity 0
→ collapse wrapper/grid row
```

Do not attempt to animate `<tr>` max-height.

Use an inner wrapper or CSS Grid row.

Example idea:

```css
.pb-row-wrapper {
  display: grid;
  grid-template-rows: 1fr;
}

.pb-row-wrapper[data-collapsed="true"] {
  grid-template-rows: 0fr;
}
```

Inner content:

```css
overflow: hidden;
```

## 8.3 Remove blur-heavy effects

Blur is visually noisy and paint-heavy.

Replace with:

- opacity.
- subtle scale.
- border accent.
- transform.

## 8.4 Reduce simultaneous visual effects

Avoid combinations like:

- pulse
- glow
- blur
- badge
- border
- color flash
- count flash
- movement

all at once.

One stage should normally use:

- one focus signal,
- one motion signal,
- one result signal.

---

# 9. Stage-specific choreography

---

# 9.1 FROM

## Purpose

Teach that the base table becomes the initial working set.

## Current problem

A dramatic `max-height: 0 → 2000px` table reveal creates layout work and adds little educational value.

## New choreography

### Focus

Operation bar:

```text
FROM employees
```

### Action

- Table enters with short fade + upward translate.
- Rows appear as one coherent dataset.
- Very small cascade may be used if row count is low.

### Result

```text
employees
5 rows
```

### Recommended motion

```text
opacity: 0 → 1
translateY: 10px → 0
```

Duration:

- 250–350 ms at 1×.

No giant height expansion.

---

# 9.2 WHERE

## Purpose

Teach that rows are evaluated against a predicate and failing rows are removed.

## New choreography

Example condition:

```sql
WHERE salary > 100000
```

### Focus

Emphasize:

- `salary` column.
- Condition in operation bar.
- Rows under evaluation.

Hide or dim irrelevant columns if needed.

### Action

Rows should be evaluated in an understandable sequence.

Example:

```text
Alice    145000    ✓
Bob      132000    ✓
David     95000    ✕
```

Failing row:

```text
red tint
→ X appears briefly
→ translateX(24px)
→ opacity 0
→ row collapses
```

Survivors should generally **not** receive a large green celebration.

Remaining in place is enough.

### Result

```text
5 rows → 4 rows
```

Optional concise reason:

```text
1 row removed by salary > 100000
```

## Visual rule

Do not combine:

- survivor green bars,
- big badges,
- multiple pulses,
- glow,
- separate success animation

unless needed for accessibility or clarity.

---

# 9.3 HAVING

Use the same interaction grammar as WHERE, but operate on **groups**, not original rows.

### Focus

Show:

- grouped rows.
- aggregate values used by HAVING.
- condition.

Example:

```sql
HAVING AVG(salary) > 120000
```

### Action

Groups failing the condition leave.

### Result

```text
3 groups → 2 groups
```

This visual similarity helps users understand:

```text
WHERE filters rows
HAVING filters groups
```

---

# 9.4 LIMIT

## Purpose

Teach that only the first N rows are kept after prior stages.

### Focus

Operation bar:

```text
LIMIT 3
```

Draw a clear cutoff after row 3.

### Action

Rows below cutoff:

```text
subtle reject highlight
→ move/fade out
→ collapse
```

### Result

```text
5 rows → 3 rows
```

Avoid excessive badges on every removed row.

A single cutoff marker is the main visual metaphor.

---

# 9.5 SELECT

## Purpose

Teach that SELECT determines the output columns.

Example:

```sql
SELECT name, salary
```

Initial:

```text
id | name | email | salary | department
```

### Focus

Selected columns:

```text
NAME
SALARY
```

Dropped columns are dimmed.

### Action

Dropped columns should visibly leave.

Example visual progression:

```text
id | NAME | email | SALARY | department

↓
id and email and department shrink/fade

↓
NAME | SALARY
```

### Important technical requirement

Do not collapse only `<th>`.

Header **and body cells** must participate.

If CSS Grid is used:

- animate column track representation.
- fade content.
- translate surviving columns toward final positions.

### Result

Only final selected columns remain.

Horizontal scrollbar should not be required to understand the effect.

---

# 9.6 ORDER BY

## Purpose

Teach that rows are reordered, not recreated.

This should be one of the clearest animations in the product.

Example:

```text
Before:

Alice    145k
Bob      132k
David     95k
Elena    125k
Carla    118k
```

Operation:

```sql
ORDER BY salary DESC
```

Result:

```text
Alice    145k
Bob      132k
Elena    125k
Carla    118k
David     95k
```

## Required behavior

- Same row DOM elements.
- Same `_rowId`.
- Rows glide from previous Y to new Y.
- No fade-out/fade-in replacement.

## Fix FLIP correctly

Required sequence:

```text
FIRST
capture current positions before order changes

LAST
render target order and measure new positions

INVERT
apply transform = oldPosition - newPosition

PLAY
animate transform back to 0
```

Important:

- Register rows regardless of whether current stage is ORDER BY.
- Previous positions must already exist before ORDER BY enters action phase.
- Do not wait until after sorted DOM is the only measured state.

## Optional movement hint

For significant movement:

```text
Elena ↑
David ↓
```

Keep it subtle.

Avoid blur.

---

# 9.7 GROUP BY

## Purpose

Teach that input rows are partitioned into groups, then aggregates are produced per group.

This requires a larger visual redesign.

Example source:

```text
Employee             Department       Salary

Alice                 Engineering      145,000
Bob                   Engineering      132,000
Carla                 Product          118,000
Elena                  Product          125,000
David                  People Ops        95,000
```

## Phase A — Focus

Display only relevant fields:

- grouping keys.
- aggregate input columns.
- optional human-readable identifying column.

Hide/dim irrelevant columns such as:

- email.
- hired_at.
- unrelated IDs.

## Phase B — Gather

Rows physically move into group containers.

Example:

```text
┌─ Engineering ───────────────┐
│ Alice             145,000   │
│ Bob               132,000   │
└─────────────────────────────┘

┌─ Product ───────────────────┐
│ Carla             118,000   │
│ Elena             125,000   │
└─────────────────────────────┘

┌─ People Ops ────────────────┐
│ David              95,000   │
└─────────────────────────────┘
```

## Phase C — Aggregate

If aggregate functions exist, visually show them.

Example:

```text
Engineering

145,000 + 132,000
─────────────────
        2

        ↓

138,500 AVG
```

For COUNT:

```text
2 rows
↓
COUNT = 2
```

For SUM:

```text
145,000 + 132,000
↓
277,000
```

Do not attempt a full arithmetic tutorial.

The purpose is to show where the aggregate came from.

## Phase D — Collapse to grouped result

Example:

```text
Department       avg_salary     headcount

Engineering       138,500           2
Product           121,500           2
People Ops         95,000           1
```

## Fallback

If aggregate expression visualization is not yet supported:

- still gather rows into groups.
- collapse each group into one output row.
- show aggregate values from actual snapshot.

Do not block GROUP BY improvement on expression-level animation.

---

# 9.8 JOIN

## Purpose

Teach how rows from two relations match according to the ON condition.

Current JOIN concept is useful but should become less visually noisy.

## Layout

Use:

```text
LEFT TABLE        MATCH LANE        RIGHT TABLE
```

During matching, show primarily:

- left join key.
- right join key.
- optional compact row identity.

## One active match at a time

Example:

```text
employees                    departments

department_id                 id

      1  ─────────────────→   1
```

Then:

```text
✓ Match found
```

Then compact result:

```text
Alice Chen
+
Engineering

↓
Alice Chen | Engineering
```

## Previously completed matches

Do not leave all old arrows equally prominent.

After a match completes:

```text
opacity: ~0.15–0.25
```

or collapse it into a lightweight summary.

## One-to-many

Example:

```text
       ┌────────→ Product / Carla
2 ─────┤
       └────────→ Product / Elena
```

Then:

```text
2 matches
```

## LEFT JOIN null case

Use dashed short path/stub:

```text
left row ─────→ no match
                ↓
               NULL
```

## Curved arrows

Replace simple `<line>` with SVG `<path>` where beneficial.

Use cubic Bézier paths.

Benefits:

- cleaner routing.
- easier visual separation.
- better one-to-many appearance.
- more polished connector motion.

For draw-on:

```ts
const length = path.getTotalLength();
```

Animate:

```text
strokeDasharray = length
strokeDashoffset = length → 0
```

## Synchronization

JOIN must use the global animation controller.

Its completion must determine when autoplay can continue.

No separate unsynchronized stage timing.

---

# 10. Relevant-data display policy

A learning animation should not require the user to horizontally scroll while motion is happening.

## 10.1 Column policy

Suggested rule:

```text
≤ 6 relevant columns
    show normally

> 6 total columns but only a few are relevant
    hide/dim irrelevant columns

many relevant columns
    compact, paginate, or show focus subset
```

Do not show every source column merely because it exists.

For example GROUP BY does not need:

```text
id | full_name | email | department_id | salary | hired_at | ...
```

if the operation only depends on:

```text
department | salary
```

## 10.2 Row policy

Suggested animation viewport:

```text
~8 visible affected rows maximum
```

If more:

```text
+ 32 other rows
```

or:

```text
show affected rows + compact summary
```

## 10.3 Focus-on-change mode

For large tables:

- Keep changed rows visible.
- Keep immediate neighbors if helpful.
- Summarize unaffected rows.

Example:

```text
12 visible rows
+ 188 unaffected rows
```

This is better than generic head/tail virtualization during an educational operation.

---

# 11. Diff and reorder correctness improvements

## 11.1 Avoid noisy reorder labels

Current index-based logic may mark every survivor below a removed row as reordered.

Example:

```text
A
B   <- removed
C
D
```

After B disappears:

```text
A
C
D
```

C and D changed numeric indexes but did not change relative order.

They should not be called reordered.

## Better method

Compare survivor relative order.

Possible approaches:

- Map current survivor IDs to previous indices.
- Detect whether relative ordering changed.
- Use longest increasing subsequence (LIS) to identify actual movers.

Only true ORDER BY movement should get reorder semantics.

## 11.2 Row lineage

Current content-matching row identity may become ambiguous with:

- duplicate rows.
- aggregate rows.
- computed columns.
- aliases.

Longer-term improvement:

- carry source primary key/provenance where possible.
- use hidden stable metadata in stage SQL.
- avoid relying entirely on shared-column equality.

This is not required before animation architecture fixes, but it should be tracked because wrong identity creates wrong animation.

---

# 12. Backward navigation

Current instant backward jumps should be replaced.

## Minimum version

Short crossfade / reverse transition.

## Preferred version

Reverse the operation where practical.

Examples:

- WHERE → removed rows return.
- LIMIT → cut rows return.
- SELECT → dropped columns reappear.
- ORDER BY → rows slide back.
- JOIN → current result recedes and matching state restores.
- GROUP BY → grouped rows expand back into members.

## Controller requirement

The animation engine must be able to:

```text
play forward
pause
resume
reverse
cancel
```

Backward navigation should never leave stale styles or partially transformed rows.

---

# 13. Pause, resume, speed and scrubbing

## 13.1 Pause

Pressing Space while animation is active:

- pauses all active animations.
- does not reset the stage.
- does not change phase.
- does not lose elapsed progress.

## 13.2 Resume

Resume from exact current animation time.

## 13.3 Speed changes

If changing 1× → 2× during animation:

- update `playbackRate`.
- do not restart animation.

## 13.4 Scrubbing

Later enhancement:

A timeline slider may allow:

```text
0% ─────────────── 100%
```

Scrubbing should seek animation time.

Not required in first implementation, but architecture should not make it impossible.

---

# 14. Reduced-motion behavior

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

But redesign it deliberately.

Reduced motion should:

- avoid large translations.
- avoid cascading.
- avoid connector drawing animations.
- avoid repeated pulses.
- still clearly show before → after.
- use quick opacity state change.
- preserve explanatory labels.

Do not rely solely on globally setting all durations to `0.01ms` if that creates visual race conditions.

The controller should know when reduced-motion mode is active and run simplified choreography.

---

# 15. Recommended implementation phases

---

## Phase 0 — Baseline and instrumentation

Before modifying animation:

- Add debug metrics.
- Record current behavior.
- Capture representative screen recordings.
- Create a fixed simulator test dataset/query set.

Log when debug mode is enabled:

```text
stage enter
phase start
phase complete
animation count
animation duration
stage complete
autoplay advance
navigation interruption
cancel
pause
resume
```

Track timestamps using:

```ts
performance.now()
```

Representative queries must cover:

- FROM only.
- WHERE.
- SELECT.
- ORDER BY.
- LIMIT.
- INNER JOIN.
- LEFT JOIN with unmatched rows.
- one-to-many JOIN.
- GROUP BY.
- GROUP BY + aggregate.
- HAVING.
- full query with multiple stages.

---

## Phase 1 — Reliability fixes

Implement first:

1. Stop remounting `<tbody>` per phase.
2. Preserve row DOM by `_rowId`.
3. Fix ORDER BY FLIP measurement lifecycle.
4. Make JOIN report its completion globally.
5. Prevent autoplay from advancing while any stage animation is running.
6. Fix early-return/hook ordering issues if present.
7. Fix banner transform/off-centering if the banner remains temporarily.
8. Remove dead/duplicate playback CSS.
9. Make backward navigation at least use a safe crossfade.
10. Add cancellation cleanup for every stage.

Acceptance criteria:

- No stage is cut off by autoplay.
- ORDER BY rows visibly move.
- GROUP BY transition does not instantly jump because of remounting.
- Rapid navigation cannot produce overlapping stale animations.
- Pause works without resetting.

---

## Phase 2 — Unified timeline

1. Introduce central animation controller.
2. Replace timeout-chained phase completion.
3. Use Web Animations API or rAF timeline.
4. Make pause/resume/speed operate on active animations.
5. Make JOIN use same contract.
6. Add reduced-motion path.

Acceptance criteria:

- Stage completion is based on animation completion.
- Changing speed mid-animation works.
- Pause/resume is exact.
- No timer drift.
- No duplicate completion callbacks.

---

## Phase 3 — Layout cleanup

1. Add collapsible Lesson panel.
2. Persist collapsed state.
3. Replace floating banner with operation bar.
4. Give center visualization extra width.
5. Introduce relevant-column selection.
6. Improve row focus strategy.
7. Reduce visual signals.

Acceptance criteria:

- No overlay hides headers.
- Visualization is readable without horizontal scrolling for representative queries.
- All previous Lesson content remains available.
- Collapsing Lesson panel never breaks layout.

---

## Phase 4 — PlaybackDataGrid

1. Build reusable animation-friendly grid.
2. Migrate FROM.
3. Migrate WHERE/HAVING/LIMIT.
4. Migrate SELECT.
5. Migrate ORDER BY.
6. Migrate GROUP BY.
7. Keep JOIN canvas specialized.

Acceptance criteria:

- Row collapse is visually smooth.
- Column collapse affects headers and body together.
- Grid retains accessibility roles.
- No incorrect cell alignment.

---

## Phase 5 — Stage choreography redesign

Implement operation-focused animation:

- FROM → dataset enters.
- WHERE → failing rows removed.
- HAVING → failing groups removed.
- LIMIT → cutoff.
- SELECT → columns leave.
- ORDER BY → physical row movement.
- GROUP BY → gather → aggregate → collapse.
- JOIN → focused sequential matching.

Acceptance criteria:

- A user can visually identify what SQL operation occurred without reading the Lesson panel.
- The animation output matches the actual stage snapshot exactly.

---

## Phase 6 — Advanced interaction

Optional after stability:

- reverse animations.
- scrubber.
- skip animation.
- replay current stage.
- focus-on-changes toggle.
- shared-element/View Transition experimentation.

---

# 16. File-level change plan

Expected main files:

## `src/hooks/useSimulatorPlayback.ts`

Refactor responsibilities:

- stage index.
- global play/pause.
- speed.
- controller state.
- autoplay gating.
- stage completion.
- navigation.

Remove:

- assumptions that `HOLD_MS` means animation completion.
- overlapping interval behavior.

Possible new state:

```ts
type AnimationState =
  | "idle"
  | "running"
  | "paused"
  | "complete";
```

Autoplay should wait for complete.

---

## `src/components/simulator/playback/PlaybackStage.tsx`

Refactor:

- become stage choreography host.
- request the stage animator.
- await completion.
- report completion.
- mount one stable visualization tree.

Do not drive choreography through chained timeout state changes.

---

## `src/components/simulator/playback/PlaybackTable.tsx`

Refactor:

- preserve stable rows.
- remove per-phase tbody remount.
- support relevant-column display.
- later migrate to `PlaybackDataGrid`.

---

## `src/components/simulator/playback/PlaybackRow.tsx`

Refactor:

- stable DOM.
- data attributes.
- no remount-based animation restart.
- inner wrapper for row collapse if table remains temporarily.

---

## `src/hooks/useFlipAnimation.ts`

Fix:

- register rows before ORDER BY starts.
- capture FIRST positions correctly.
- measure LAST after order commit.
- cancel previous animation cleanly.
- use WAAPI if possible.

Test:

- first visit to ORDER BY.
- replay ORDER BY.
- backward then forward.
- duplicate values.
- rows with large movement.
- speed change mid-animation.

---

## `src/components/simulator/playback/JoinPlaybackCanvas.tsx`

Refactor:

- use global controller.
- report completion.
- sequential active pair.
- fade previous pair arrows.
- support cancellation.
- support pause.
- use curved SVG path.
- support one-to-many summary.
- support unmatched LEFT JOIN.

---

## `src/components/simulator/playback/join/JoinArrowOverlay.tsx`

Refactor:

- `<path>` instead of `<line>` where possible.
- actual path length.
- compositor-friendly stroke animation.
- old paths reduced opacity.

---

## `src/components/simulator/playback/StageEntryBanner.tsx`

Plan:

- deprecate after operation bar is implemented.
- until then, fix transform composition.
- must never obscure data headers.

---

## `src/components/simulator/playback/LessonPanel.tsx`

Add:

- collapse behavior.
- compact rail.
- persisted state.
- accessible expand/collapse control.

---

## New suggested components

```text
playback/
├── PlaybackOperationBar.tsx
├── PlaybackDataGrid.tsx
├── PlaybackGridRow.tsx
├── PlaybackGridCell.tsx
├── animation/
│   ├── useStageAnimationController.ts
│   ├── stageAnimationTypes.ts
│   ├── animateFrom.ts
│   ├── animateWhere.ts
│   ├── animateSelect.ts
│   ├── animateOrderBy.ts
│   ├── animateLimit.ts
│   ├── animateGroupBy.ts
│   ├── animateHaving.ts
│   └── animateJoin.ts
```

The exact structure can vary, but stage animation logic should not stay scattered across CSS, hook timers, table rendering, and JOIN-local timeouts.

---

# 17. CSS cleanup

Audit the entire playback CSS.

Remove or consolidate:

- duplicate definitions.
- unused scan rules.
- dead progress rules.
- dead row removal rules.
- duplicate JOIN result selectors.
- stale collapsing selectors no longer used.

Create a smaller motion vocabulary:

```text
pb-enter
pb-exit
pb-move
pb-focus
pb-dim
pb-collapse
pb-path-draw
```

Prefer shared easing tokens.

Suggested easing:

```css
--pb-ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
--pb-ease-exit: cubic-bezier(0.4, 0, 1, 1);
--pb-ease-enter: cubic-bezier(0, 0, 0.2, 1);
```

Do not overuse custom easings per stage.

---

# 18. Testing strategy

Animation work must be tested at multiple levels.

---

# 18.1 Unit tests

## Timeline/controller tests

Test:

- stage starts.
- correct phase order.
- completion fires once.
- pause freezes progress.
- resume continues.
- cancel prevents completion side effects.
- speed change updates active animations.
- reduced motion returns simplified behavior.
- autoplay waits for completion.

Use fake animation objects if browser WAAPI is unavailable in the test environment.

Example cases:

```text
play → complete
play → pause → resume → complete
play → cancel
play at 1× → change to 2×
play → navigate next → previous animation cancelled
```

## Reorder detection tests

Test relative order logic:

Input:

```text
A B C D
```

Remove B:

```text
A C D
```

Expected:

```text
C and D are NOT "reordered"
```

Actual reorder:

```text
A C B D
```

Expected:

```text
B/C movement detected appropriately
```

## Relevant-column selection tests

For each stage:

- expected required columns included.
- irrelevant columns can be excluded.
- grouping keys preserved.
- ORDER BY columns preserved.
- aggregate source/output preserved.
- JOIN key preserved.

---

# 18.2 Component tests

Use React Testing Library where appropriate.

## Lesson panel

Test:

- expanded by default/persisted preference.
- collapse button works.
- collapsed rail remains accessible.
- state persists.
- center layout gets expanded class/state.
- keyboard activation works.

## Operation bar

Test:

- correct stage.
- correct expression.
- correct row counts.
- never overlays data content.

## Playback rows

Test:

- stable key/DOM node where same `_rowId` survives.
- status changes do not remount.
- removed row receives correct animation target.
- settled state matches snapshot.

## JOIN

Test:

- current pair highlight.
- previous pair dimming.
- one-to-many.
- LEFT JOIN no-match.
- completion callback.

---

# 18.3 Integration tests

Representative simulation flows:

## Query A — WHERE

```sql
SELECT *
FROM employees
WHERE salary > 100000;
```

Check:

- FROM enters.
- WHERE highlights salary.
- failing rows leave.
- final row count correct.
- autoplay waits.

## Query B — SELECT

```sql
SELECT full_name, salary
FROM employees;
```

Check:

- unwanted columns visibly leave.
- header/body stay aligned.
- final columns exact.

## Query C — ORDER BY

```sql
SELECT *
FROM employees
ORDER BY salary DESC;
```

Check:

- same row nodes move.
- first ORDER BY visit animates.
- replay works.
- backward/forward works.

## Query D — LIMIT

```sql
SELECT *
FROM employees
ORDER BY salary DESC
LIMIT 3;
```

Check:

- cutoff appears.
- only rows below cutoff leave.
- order remains correct.

## Query E — GROUP BY

```sql
SELECT department_id, AVG(salary), COUNT(*)
FROM employees
GROUP BY department_id;
```

Check:

- rows gather into correct groups.
- output aggregate values match actual snapshot.
- resulting group count correct.

## Query F — HAVING

```sql
SELECT department_id, AVG(salary)
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 120000;
```

Check:

- grouping occurs first.
- HAVING removes groups, not source rows.
- correct final groups.

## Query G — INNER JOIN

Check:

- active pair is understandable.
- correct key pairs.
- result row count exact.
- no premature autoplay.

## Query H — LEFT JOIN

Check:

- unmatched rows show NULL outcome.
- dashed/no-match path.
- final snapshot exact.

## Query I — one-to-many JOIN

Check:

- multiple right matches shown.
- summary count correct.
- connector layout stays readable.

---

# 18.4 End-to-end browser tests

Strongly recommended to add Playwright if not already present.

E2E tests should verify actual browser animation behavior.

Test at:

- Chromium.
- Firefox.
- WebKit if feasible.

Core scenarios:

1. Open playback.
2. Start animation.
3. Pause during movement.
4. Wait.
5. Verify row position does not continue moving.
6. Resume.
7. Verify completion.
8. Change speed while running.
9. Navigate backward.
10. Replay.
11. Collapse Lesson panel.
12. Resize window.
13. Close and reopen.
14. Verify persisted panel state.
15. Enable reduced motion.

---

# 18.5 Visual regression testing

Animation UI can be functionally correct but visually broken.

Capture screenshots at deterministic points:

```text
stage start
focus phase
middle of action
result
settled
```

Use paused animation times where possible.

Important layouts:

- 1920×1080.
- 1440×900.
- 1366×768.
- tablet width.
- mobile width.

Compare:

- alignment.
- clipping.
- overlapping.
- connector paths.
- operation bar.
- row positions.
- sidebar width.
- scrollbars.

---

# 18.6 Performance testing

Use Chrome Performance panel.

Measure:

- FPS.
- long tasks.
- layout.
- paint.
- scripting.
- DOM node count.
- dropped frames.

Target:

- 60 FPS on normal desktop where possible.
- no repeated large layout spikes.
- no long main-thread stalls during ordinary 5–20 row animation.
- animation should remain acceptable under CPU throttling.

Test with:

- 5 rows.
- 20 rows.
- 40 rows.
- >40 rows.
- many columns.
- long text cells.
- JOIN with several matches.
- GROUP BY with multiple groups.

Look specifically for:

- forced synchronous layout.
- repeated `getBoundingClientRect()` loops.
- layout thrashing.
- unnecessary rerenders.
- ResizeObserver loops.
- SVG redraw cost.

---

# 18.7 Stress and interruption testing

Animations frequently fail under interruption.

Test:

```text
play → immediately pause
play → next
play → previous
play → restart
play → close modal
play → collapse panel
play → resize window
play → switch speed repeatedly
play → press Space rapidly
play → press arrows rapidly
```

Expected:

- no console errors.
- no stale timers.
- no duplicate animation callbacks.
- no state update after unmount.
- no rows stuck at partial opacity.
- no transform left on elements.
- no invisible table after replay.
- no old JOIN arrows remaining in new stage.

---

# 18.8 Data correctness checks

Animation must never show an educationally attractive but false result.

For every stage:

```text
visual result rows === snapshot rows
visual result columns === snapshot columns
displayed row count === snapshot rowCount
aggregate values === actual PGlite stage result
JOIN pair visualization corresponds to actual joined output
```

Build helpers for assertions where possible.

Animation should be considered failed if the final settled visual state differs from the actual snapshot.

---

# 18.9 Accessibility testing

Check:

- keyboard-only navigation.
- focus visibility.
- collapsed Lesson panel keyboard access.
- `aria-expanded`.
- `aria-controls`.
- semantic grid/table roles.
- text contrast.
- reduced motion.
- no information represented only by color.
- JOIN match state has textual equivalent.
- focus does not jump unexpectedly during stage animation.

Suggested collapse button:

```tsx
<button
  aria-expanded={!collapsed}
  aria-controls="simulator-lesson-panel"
  aria-label={collapsed ? "Expand lesson panel" : "Collapse lesson panel"}
>
```

---

# 18.10 Browser resize checks

Resize during:

- JOIN arrow drawing.
- ORDER BY movement.
- GROUP BY grouping.
- collapsed/expanded sidebar.

Expected:

- no detached connector.
- no row clipping.
- no incorrect FLIP destination.
- no stuck animation.

On resize during active measured animation:

Preferred behavior:

- cancel/re-measure/re-target safely,
or
- defer layout-sensitive continuation for one frame and remeasure.

Never allow connector geometry to remain tied to stale coordinates.

---

# 19. Manual QA checklist

Before merging any animation phase:

## General

- [ ] Animation starts immediately after stage activation.
- [ ] No unexplained pause.
- [ ] No instant jump where motion is expected.
- [ ] No overlapping animation from previous stage.
- [ ] Pause works.
- [ ] Resume works.
- [ ] Speed works.
- [ ] Restart works.
- [ ] Previous works.
- [ ] Next works.
- [ ] Autoplay does not cut animation.
- [ ] Close/reopen works.
- [ ] No console error.
- [ ] No React warning.
- [ ] No stale timeout.
- [ ] No stale transform.

## Layout

- [ ] No floating UI covers a header.
- [ ] No important content is clipped.
- [ ] Horizontal scrolling not required for representative operation.
- [ ] Lesson panel collapse works.
- [ ] Lesson panel content is not lost.
- [ ] Center visualization grows correctly.
- [ ] Responsive layout works.

## Correctness

- [ ] Final displayed rows exactly match snapshot.
- [ ] Final displayed columns exactly match snapshot.
- [ ] Row count exact.
- [ ] JOIN pair exact.
- [ ] GROUP BY groups exact.
- [ ] HAVING groups exact.
- [ ] ORDER BY order exact.
- [ ] LIMIT cutoff exact.

## Performance

- [ ] No obvious frame drop.
- [ ] No heavy blur.
- [ ] No large layout jump.
- [ ] No flicker.
- [ ] No unnecessary DOM remount.

---

# 20. Regression suite

Existing simulator tests must continue to pass.

Add regression tests specifically for bugs fixed during this work.

Required regression cases:

1. ORDER BY animates on first visit.
2. ORDER BY replays correctly.
3. ORDER BY after backward navigation.
4. Removing a row does not mark every following survivor reordered.
5. GROUP BY follower collapse is not instant.
6. SELECT removes body cells as well as headers.
7. JOIN cannot auto-advance before its animation completes.
8. JOIN completion callback fires exactly once.
9. Pausing JOIN actually freezes connector drawing.
10. Lesson sidebar collapse does not unmount Lesson content unexpectedly.
11. Stage change cancels active animation.
12. Modal close cleans up animation objects.
13. Reduced-motion mode produces correct final state.
14. Browser resize does not leave stale JOIN coordinates.
15. Speed change does not restart the stage.

---

# 21. Development workflow

For each operation:

```text
1. Add/update tests.
2. Implement stable final state.
3. Implement focus state.
4. Implement action animation.
5. Add cancellation cleanup.
6. Add pause/resume.
7. Test speed.
8. Test backward navigation.
9. Test resize.
10. Test reduced motion.
11. Profile performance.
12. Compare final state with snapshot.
13. Screen-record representative query.
14. Merge only after regression suite passes.
```

Do not rewrite every stage in one large untestable change.

Recommended migration order:

```text
WHERE
→ LIMIT
→ SELECT
→ ORDER BY
→ JOIN
→ GROUP BY
→ HAVING
→ FROM polish
```

Reason:

- WHERE/LIMIT validate row exit and collapse.
- SELECT validates column transition.
- ORDER BY validates stable-element movement.
- JOIN validates timeline orchestration and SVG.
- GROUP BY is the most complex visualization rewrite.

---

# 22. Definition of done

Animation betterment is complete when:

### Reliability

- No stage depends on guessed timeout completion.
- JOIN uses the same playback completion model.
- Pause/resume/speed are synchronized.
- Autoplay never cuts active animation.
- Navigation safely cancels/reverses current motion.
- ORDER BY reliably moves rows.

### Readability

- The user can tell what SQL operation occurred from the center visualization.
- Important data is not covered by overlays.
- Irrelevant columns/rows are suppressed during action.
- Horizontal scrolling is rare during active animation.
- GROUP BY visually explains grouping.
- JOIN shows focused pair matching without arrow clutter.
- SELECT clearly removes columns.
- WHERE/HAVING/LIMIT clearly remove rows/groups.

### Feature preservation

- SQL context remains.
- Lesson content remains.
- Right Lesson sidebar is collapsible, not removed.
- Keyboard controls remain.
- Speed controls remain.
- Diff explanations remain accessible.
- Reduced-motion remains supported.

### Correctness

- Settled visual result always equals the actual simulator snapshot.
- No misleading reorder or JOIN visualization.
- No stale transforms or old animations.

### Quality

- Regression tests pass.
- E2E critical flows pass.
- Visual regression screenshots are reviewed.
- Performance profiling shows no major frame/layout regressions.
- No console errors or React warnings.

---

# 23. Final design rule

Every future animation decision should pass this test:

> **Does this motion explain what the SQL operation did, or is it merely decorative?**

If it only decorates, remove or reduce it.

The best SQLens playback should feel like the data itself is being transformed by the query:

```text
FROM      → data appears
JOIN      → rows connect
WHERE     → rows fail and leave
GROUP BY  → rows gather
HAVING    → groups fail and leave
SELECT    → columns leave
ORDER BY  → rows move
LIMIT     → rows beyond cutoff leave
```

That should become the consistent visual language of the simulator.
