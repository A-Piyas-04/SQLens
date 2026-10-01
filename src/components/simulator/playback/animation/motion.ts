import type { AnimationLike, StageAnimationContext } from "./stageAnimationTypes";
import type { StageAnimationController } from "./StageAnimationController";
import { TimerAnimation } from "./TimerAnimation";

/** Shared easing tokens — mirrored as CSS custom properties in index.css. */
export const EASE = {
  standard: "cubic-bezier(0.22, 1, 0.36, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  enter: "cubic-bezier(0, 0, 0.2, 1)",
} as const;

/** Base durations at 1× speed; the controller's playbackRate scales them. */
export const DURATION = {
  enter: 300,
  exit: 320,
  move: 520,
  focus: 260,
  dim: 220,
  collapse: 300,
  pathDraw: 480,
  reduced: 120,
} as const;

/** Holds between steps at 1× speed. */
export const HOLD = {
  afterFocus: 450,
  evaluateRow: 160,
  afterAction: 150,
  aggregate: 900,
  joinPair: 380,
  joinBetween: 120,
  result: 350,
} as const;

/**
 * Named keyframe vocabulary (pb-enter, pb-exit, pb-move, pb-focus, pb-dim,
 * pb-collapse, pb-path-draw). Only transform and opacity are animated.
 */
export const KEYFRAMES = {
  enter: (dy = 10): Keyframe[] => [
    { opacity: 0, transform: `translateY(${dy}px)` },
    { opacity: 1, transform: "translateY(0)" },
  ],
  enterX: (dx = 24): Keyframe[] => [
    { opacity: 0, transform: `translateX(${dx}px)` },
    { opacity: 1, transform: "translateX(0)" },
  ],
  exit: (dx = 24): Keyframe[] => [
    { opacity: 1, transform: "translateX(0)" },
    { opacity: 0, transform: `translateX(${dx}px)` },
  ],
  exitDown: (dy = 8): Keyframe[] => [
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: `translateY(${dy}px)` },
  ],
  collapse: (): Keyframe[] => [
    { opacity: 1, transform: "scaleY(1)" },
    { opacity: 0, transform: "scaleY(0.4)" },
  ],
  columnExit: (): Keyframe[] => [
    { opacity: 1, transform: "scaleX(1)" },
    { opacity: 0, transform: "scaleX(0.6)" },
  ],
  focus: (): Keyframe[] => [
    { opacity: 0.55, transform: "scale(0.98)" },
    { opacity: 1, transform: "scale(1)" },
  ],
  dim: (to = 0.35): Keyframe[] => [{ opacity: 1 }, { opacity: to }],
  fadeIn: (from = 0): Keyframe[] => [{ opacity: from }, { opacity: 1 }],
  move: (dx: number, dy: number): Keyframe[] => [
    { transform: `translate(${dx}px, ${dy}px)` },
    { transform: "translate(0, 0)" },
  ],
  pathDraw: (length: number): Keyframe[] => [
    { strokeDashoffset: `${length}`, opacity: 1 },
    { strokeDashoffset: "0", opacity: 1 },
  ],
};

export type MotionOptions = {
  duration: number;
  delay?: number;
  easing?: string;
  /** Hold the final keyframe until the stage settles (then released). */
  hold?: boolean;
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Starts a tracked animation on `el`. Falls back to a timeline-equivalent
 * `TimerAnimation` where WAAPI is unavailable so timing semantics hold.
 */
export function animate(
  ctl: StageAnimationController,
  el: Element | null | undefined,
  keyframes: Keyframe[],
  { duration, delay = 0, easing = EASE.standard, hold = false }: MotionOptions
): AnimationLike | null {
  if (!el || ctl.isCancelled()) return null;
  const canAnimate = typeof (el as HTMLElement).animate === "function";
  const anim: AnimationLike = canAnimate
    ? (el as HTMLElement).animate(keyframes, {
        duration,
        delay,
        easing,
        fill: hold ? "forwards" : "none",
      })
    : new TimerAnimation(duration + delay);
  return ctl.track(anim, hold);
}

/** Animates many elements with an optional stagger; returns all animations. */
export function animateEach(
  ctl: StageAnimationController,
  elements: Iterable<Element>,
  keyframes: Keyframe[] | ((el: Element, i: number) => Keyframe[]),
  opts: MotionOptions & { stagger?: number }
): AnimationLike[] {
  const out: AnimationLike[] = [];
  let i = 0;
  for (const el of elements) {
    const frames = typeof keyframes === "function" ? keyframes(el, i) : keyframes;
    const a = animate(ctl, el, frames, {
      ...opts,
      delay: (opts.delay ?? 0) + (opts.stagger ?? 0) * i,
    });
    if (a) out.push(a);
    i += 1;
  }
  return out;
}

// ── DOM queries ─────────────────────────────────────────────────────────────

export function rowEl(root: HTMLElement, id: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-flip-id="${cssEscape(id)}"]`);
}

export function rowEls(root: HTMLElement, ids?: Iterable<string>): HTMLElement[] {
  if (!ids) return [...root.querySelectorAll<HTMLElement>("[data-row-id]")];
  const out: HTMLElement[] = [];
  for (const id of ids) {
    const el = rowEl(root, id);
    if (el) out.push(el);
  }
  return out;
}

export function columnEls(root: HTMLElement, col: string): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[data-col="${cssEscape(col)}"]`)];
}

export function cssEscape(v: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(v);
  return v.replace(/["\\]/g, "\\$&");
}

// ── FLIP ────────────────────────────────────────────────────────────────────

export type RectMap = Map<string, { left: number; top: number }>;

/** FIRST: capture positions keyed by a data attribute. */
export function measure(root: HTMLElement, selector: string, keyOf: (el: HTMLElement) => string | null): RectMap {
  const out: RectMap = new Map();
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const key = keyOf(el);
    if (!key || out.has(key)) return;
    const r = el.getBoundingClientRect();
    out.set(key, { left: r.left, top: r.top });
  });
  return out;
}

const ITEM_SELECTOR = "[data-flip-id]";
const CELL_SELECTOR = "[data-col]";

function itemKey(el: HTMLElement): string | null {
  return el.dataset.flipId ?? null;
}

/** FIRST for grid items (rows, group headers, cutoff, summary). */
export function measureRows(root: HTMLElement): RectMap {
  return measure(root, ITEM_SELECTOR, itemKey);
}

function cellRow(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>("[data-flip-id], [data-header-row]");
}

function cellKey(el: HTMLElement): string | null {
  const col = el.dataset.col;
  if (!col) return null;
  const row = cellRow(el);
  return `${row?.dataset.flipId ?? "header"}|${col}`;
}

/**
 * Cell positions keyed by `rowId|col`, relative to their own row so a cell
 * FLIP never double-counts its row's movement.
 */
export function measureCells(root: HTMLElement): RectMap {
  const out: RectMap = new Map();
  root.querySelectorAll<HTMLElement>(CELL_SELECTOR).forEach((el) => {
    const key = cellKey(el);
    if (!key || out.has(key)) return;
    out.set(key, relativeRect(el));
  });
  return out;
}

function relativeRect(el: HTMLElement): { left: number; top: number } {
  const r = el.getBoundingClientRect();
  const row = cellRow(el)?.getBoundingClientRect();
  return { left: r.left - (row?.left ?? 0), top: r.top - (row?.top ?? 0) };
}

/**
 * LAST + INVERT + PLAY: after the new layout is committed, translate each
 * element from its FIRST position back to zero. Elements without a FIRST
 * position are returned in `entered` so callers can fade them in.
 */
export function flip(
  ctx: Pick<StageAnimationContext, "ctl" | "root" | "reducedMotion">,
  first: RectMap,
  kind: "rows" | "cells",
  opts: Partial<MotionOptions> = {}
): { animations: AnimationLike[]; entered: HTMLElement[]; moved: HTMLElement[] } {
  const { ctl, root, reducedMotion } = ctx;
  const selector = kind === "rows" ? ITEM_SELECTOR : CELL_SELECTOR;
  const keyOf = kind === "rows" ? itemKey : cellKey;
  const rectOf = kind === "rows"
    ? (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top };
      }
    : relativeRect;
  const animations: AnimationLike[] = [];
  const entered: HTMLElement[] = [];
  const moved: HTMLElement[] = [];

  const targets: Array<{ el: HTMLElement; dx: number; dy: number }> = [];
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const key = keyOf(el);
    const from = key ? first.get(key) : undefined;
    if (!from) {
      entered.push(el);
      return;
    }
    const r = rectOf(el);
    const dx = from.left - r.left;
    const dy = from.top - r.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    targets.push({ el, dx, dy });
  });

  // Reads above, writes below — no interleaved layout thrash.
  for (const { el, dx, dy } of targets) {
    moved.push(el);
    if (reducedMotion) continue;
    const a = animate(ctl, el, KEYFRAMES.move(dx, dy), {
      duration: opts.duration ?? DURATION.move,
      easing: opts.easing ?? EASE.standard,
      delay: opts.delay ?? 0,
    });
    if (a) animations.push(a);
  }
  return { animations, entered, moved };
}
