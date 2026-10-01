import { expect, vi } from "vitest";
import { act } from "@testing-library/react";
import { PGlite } from "@electric-sql/pglite";
import { generateSnapshots, type SimulatorSnapshot, type StageDiff } from "../../../../lib/simulator";
import { TimerAnimation } from "../animation/TimerAnimation";
import { columnsOf } from "../animation/relevantColumns";
import { FOCUS_ROW_LIMIT } from "../animation/rowWindow";
import { PLAYBACK_SCHEMA_SQL } from "../__fixtures__/playbackQueries";

// ── Snapshots from a real PGlite run ─────────────────────────────────────────

let dbPromise: Promise<PGlite> | null = null;

async function db(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const instance = new PGlite();
      await instance.exec(PLAYBACK_SCHEMA_SQL);
      return instance;
    })();
  }
  return dbPromise;
}

export type Simulation = { sql: string; snapshots: SimulatorSnapshot[]; diffs: StageDiff[] };

export async function simulate(sql: string): Promise<Simulation> {
  const result = await generateSnapshots({ sql, db: await db() });
  if (!result.success) throw new Error(`simulation failed for ${sql}: ${result.error}`);
  return { sql, snapshots: result.snapshots, diffs: result.diffs };
}

export function stageInputs(sim: Simulation, index: number) {
  return {
    snapshot: sim.snapshots[index],
    prevSnapshot: index > 0 ? sim.snapshots[index - 1] : null,
    diff: index > 0 ? sim.diffs[index - 1] ?? null : null,
    originalSql: sim.sql,
  };
}

export function stageIndex(sim: Simulation, type: SimulatorSnapshot["stageType"]): number {
  const i = sim.snapshots.findIndex((s) => s.stageType === type);
  if (i < 0) throw new Error(`no ${type} stage in ${sim.sql}`);
  return i;
}

// ── DOM stubs (jsdom has no layout and no WAAPI) ─────────────────────────────

export const ROW_H = 34;
export const COL_W = 100;

export type RecordedAnimation = {
  el: Element;
  keyframes: Keyframe[];
  duration: number;
  anim: TimerAnimation;
  cancelled: boolean;
};

export const recorded: RecordedAnimation[] = [];

let geometryScale = 1;
/** Simulates a viewport resize: every measured rect is scaled. */
export function setGeometryScale(s: number) {
  geometryScale = s;
}

function siblingIndex(el: Element, selector: string): number {
  const parent = el.parentElement;
  if (!parent) return 0;
  return [...parent.children].filter((c) => c.matches(selector)).indexOf(el);
}

function fakeRect(this: Element): DOMRect {
  let top = 0;
  let left = 0;
  const width = 300 * geometryScale;
  let height = ROW_H * geometryScale;
  if (this.matches("[data-flip-id], [data-join-row]")) {
    top = (siblingIndex(this, "[data-flip-id], [data-join-row]") + 1) * ROW_H * geometryScale;
  } else if (this.matches("[data-col], [role='cell'], [role='columnheader']")) {
    left = siblingIndex(this, "[role='cell'], [role='columnheader']") * COL_W * geometryScale;
    const row = this.closest("[data-flip-id], [data-join-row]");
    if (row) top = fakeRect.call(row).top;
    if (this.closest("[data-join-panel='right']")) left += 600 * geometryScale;
  } else {
    height = 600 * geometryScale;
  }
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    FakeResizeObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    FakeResizeObserver.instances = FakeResizeObserver.instances.filter((i) => i !== this);
  }
}

/** Fires every live ResizeObserver callback (simulated resize). */
export function triggerResize() {
  for (const ro of [...FakeResizeObserver.instances]) {
    ro.cb([], ro as unknown as ResizeObserver);
  }
}

let reducedMotionMedia = false;
export function setPrefersReducedMotion(v: boolean) {
  reducedMotionMedia = v;
}

export function installDomStubs() {
  recorded.length = 0;
  geometryScale = 1;
  reducedMotionMedia = false;
  Element.prototype.getBoundingClientRect = fakeRect;
  (Element.prototype as unknown as { animate: unknown }).animate = function animate(
    this: Element,
    keyframes: Keyframe[],
    opts: KeyframeAnimationOptions
  ) {
    const duration = Number(opts?.duration ?? 0) + Number(opts?.delay ?? 0);
    const anim = new TimerAnimation(duration);
    const entry: RecordedAnimation = { el: this, keyframes, duration, anim, cancelled: false };
    const cancel = anim.cancel.bind(anim);
    anim.cancel = () => {
      if (anim.playState !== "finished") entry.cancelled = true;
      cancel();
    };
    recorded.push(entry);
    return anim;
  };
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce") ? reducedMotionMedia : false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  localStorage.clear();
}

export function useFakeTime() {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
      "performance",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
}

export async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** Advances in small slices until `done()` holds; fails after `maxMs`. */
export async function advanceUntil(done: () => boolean, maxMs = 30000, step = 50) {
  let elapsed = 0;
  while (!done()) {
    if (elapsed >= maxMs) throw new Error(`condition not met within ${maxMs}ms of animation time`);
    await advance(step);
    elapsed += step;
  }
  return elapsed;
}

/** Recorded animations whose keyframes animate a transform matching `re`. */
export function animationsMatching(re: RegExp, since = 0): RecordedAnimation[] {
  return recorded.slice(since).filter((r) => r.keyframes.some((k) => typeof k.transform === "string" && re.test(k.transform)));
}

export const MOVE_RE = /^translate\(-?[\d.]+px, -?[\d.]+px\)$/;

/** FLIP move animations with a real vertical displacement. */
export function verticalMoves(since = 0): RecordedAnimation[] {
  return animationsMatching(MOVE_RE, since).filter((r) => {
    const m = String(r.keyframes[0].transform).match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
    return !!m && Math.abs(Number(m[2])) >= 1;
  });
}

// ── Data-correctness assertion (plan §18.3) ──────────────────────────────────

function display(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function plural(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/**
 * Asserts the settled visualisation equals the stage snapshot: row identity
 * and order, columns, every cell value (incl. aggregates) and the count.
 */
export function expectSettledMatchesSnapshot(
  container: HTMLElement,
  snapshot: SimulatorSnapshot,
  { rowLimit = FOCUS_ROW_LIMIT }: { rowLimit?: number } = {}
) {
  const expectedIds = snapshot.rows.map((r) => r._rowId);

  if (snapshot.stageType === "JOIN") {
    const result = container.querySelector("[data-join-result]");
    expect(result, "joined result is visible").not.toBeNull();
    const ids = [...result!.querySelectorAll("tr[data-row-id]")].map((tr) => tr.getAttribute("data-row-id"));
    expect(ids).toEqual(expectedIds);
    result!.querySelectorAll("tr[data-row-id]").forEach((tr, i) => {
      const cells = [...tr.querySelectorAll("td")].map((td) => td.textContent);
      const row = snapshot.rows[i];
      const values = Object.keys(row).filter((k) => k !== "_rowId").map((k) => display(row[k]));
      expect(cells.length).toBeGreaterThan(0);
      for (const c of cells) expect(values).toContain(c);
    });
  } else {
    const grid = container.querySelector("[data-grid]");
    expect(grid, "grid is rendered").not.toBeNull();
    expect(grid!.getAttribute("data-phase")).toBe("settled");
    const header = [...grid!.querySelectorAll("[data-grid-header] [data-col]")].map((h) => h.getAttribute("data-col"));
    if (snapshot.rows.length > 0) expect(header).toEqual(columnsOf(snapshot.rows));

    const rowEls = [...grid!.querySelectorAll<HTMLElement>("[data-grid-body] [data-row-id]")];
    const ids = rowEls.map((r) => r.dataset.rowId);
    if (expectedIds.length <= rowLimit) {
      expect(ids).toEqual(expectedIds);
      expect(grid!.querySelector("[data-summary]")).toBeNull();
    } else {
      // Windowed: a subsequence of the snapshot, in snapshot order, + summary.
      expect(ids.length).toBeLessThanOrEqual(rowLimit);
      let cursor = -1;
      for (const id of ids) {
        const i = expectedIds.indexOf(id!);
        expect(i).toBeGreaterThan(cursor);
        cursor = i;
      }
      expect(grid!.querySelector("[data-summary]")?.textContent).toContain(`${expectedIds.length - ids.length} other`);
    }
    for (const el of rowEls) {
      expect(el.dataset.mark ?? null, `row ${el.dataset.rowId} carries no transient mark`).toBeNull();
      const row = snapshot.rows.find((r) => r._rowId === el.dataset.rowId)!;
      const cells = [...el.querySelectorAll<HTMLElement>("[role='cell'][data-col]")];
      expect(cells.map((c) => c.dataset.col)).toEqual(columnsOf(snapshot.rows));
      for (const c of cells) expect(c.textContent).toBe(display(row[c.dataset.col!]));
    }
  }

  const unit =
    snapshot.stageType === "HAVING" || snapshot.stageType === "GROUP_BY" ? "group" : "row";
  expect(container.querySelector("[data-count-after]")?.textContent).toBe(plural(snapshot.rowCount, unit));
  expect(container.querySelector("[data-phase-label]")?.textContent).toBe("Done");
}
