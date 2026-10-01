import type { StageAnimator } from "./stageAnimationTypes";
import { runRowFilter } from "./animateWhere";

/** HAVING — same grammar as WHERE, applied to groups. */
export const animateHaving: StageAnimator = (ctx) => runRowFilter(ctx, "having");
