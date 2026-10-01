import type { StageAnimator } from "./stageAnimationTypes";
import { runRowFilter } from "./animateWhere";

/** LIMIT — a single cutoff marker; rows below it leave. */
export const animateLimit: StageAnimator = (ctx) => runRowFilter(ctx, "limit");
