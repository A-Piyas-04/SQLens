import type {
  SimulatorSnapshot,
  StageDiff,
  TrackedRow,
} from "../../../../lib/simulator";
import type { StageAnimationController } from "./StageAnimationController";
import type { JoinModel } from "./joinModel";
import type { GroupModel, AggregateDisplay } from "./groupModel";

/** Visual phase of the current stage (focus → action → result → settled). */
export type PlaybackPhase = "focus" | "action" | "result" | "settled";

/** Lifecycle of the active stage animation, as seen by autoplay. */
export type AnimationState = "idle" | "running" | "paused" | "complete";

export type PlaybackDirection = "forward" | "backward";

/** Minimal surface of a Web Animations API `Animation` used by the controller. */
export interface AnimationLike {
  playbackRate: number;
  readonly finished: Promise<unknown>;
  readonly playState?: string;
  play(): void;
  pause(): void;
  cancel(): void;
  finish(): void;
  reverse(): void;
  updatePlaybackRate?(rate: number): void;
}

// ── Grid view model ─────────────────────────────────────────────────────────

export type RowMark = "testing" | "pass" | "fail" | "cut" | "focus";
export type ColumnMark = "focus" | "dropped" | "new";

export type ColumnSpec = { key: string; mark?: ColumnMark };

export type GridItem =
  | {
      kind: "row";
      id: string;
      row: TrackedRow;
      mark?: RowMark;
      groupIndex?: number;
      hint?: "up" | "down";
    }
  | {
      kind: "group";
      id: string;
      groupIndex: number;
      label: string;
      count: number;
      aggregates?: AggregateDisplay[];
    }
  | { kind: "cutoff"; id: string; label: string }
  | { kind: "summary"; id: string; label: string };

export type GridViewState = {
  kind: "grid";
  phase: PlaybackPhase;
  items: GridItem[];
  columns: ColumnSpec[];
  /** e.g. "+3 columns hidden" while irrelevant columns are suppressed. */
  hiddenColumnsLabel?: string | null;
  /** Concise result line under the grid, e.g. "1 row removed by salary > 100000". */
  caption?: string | null;
  /** Count shown in the operation bar ("before" until the result phase). */
  countPhase: "before" | "after";
};

// ── JOIN view model ─────────────────────────────────────────────────────────

export type JoinArrowStatus = "drawing" | "active" | "done";

export type JoinArrow = {
  key: string;
  leftId: string;
  rightId: string | null;
  isNull: boolean;
  status: JoinArrowStatus;
};

export type JoinViewState = {
  kind: "join";
  phase: PlaybackPhase;
  joinPhase: "tables" | "keys" | "matching" | "result";
  stepIndex: number;
  pairIndex: number;
  arrows: JoinArrow[];
  /** Number of match steps fully completed (drives matched-row tint). */
  completedSteps: number;
  /** Lane message for the active pair: "✓ Match found", "No match → NULL", "2 matches". */
  laneMessage: string | null;
  showSkippedSummary: boolean;
  countPhase: "before" | "after";
};

export type StageViewState = GridViewState | JoinViewState;

// ── Animator contract ───────────────────────────────────────────────────────

export type StageModel = {
  snapshot: SimulatorSnapshot;
  prevSnapshot: SimulatorSnapshot | null;
  diff: StageDiff | null;
  prevColumns: string[];
  targetColumns: string[];
  removedIds: Set<string>;
  /** Relevant (focus) columns for this stage's action phase. */
  focusColumns: string[];
  /** Predicate / sort / key columns emphasised during focus. */
  emphasisColumns: Set<string>;
  /** Short human condition used in captions, e.g. "salary > 100000". */
  conditionText: string | null;
  focusOnChanges: boolean;
  rowLimit: number;
  group: GroupModel | null;
  join: JoinModel | null;
};

export interface StageAnimationContext {
  ctl: StageAnimationController;
  /** Root element of the stage visualisation; animators query `[data-row-id]` etc. inside it. */
  root: HTMLElement;
  model: StageModel;
  reducedMotion: boolean;
  /** Synchronously commits a new view (DOM updated when this returns). */
  commit(view: StageViewState): void;
  /** Currently committed view. */
  getView(): StageViewState | null;
}

export type StageAnimator = (ctx: StageAnimationContext) => Promise<void>;
