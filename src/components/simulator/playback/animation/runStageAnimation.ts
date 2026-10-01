import type { SimulatorStageType } from "../../../../lib/simulator";
import type { PlaybackDirection, StageAnimationContext, StageAnimator } from "./stageAnimationTypes";
import { animateFrom } from "./animateFrom";
import { animateWhere } from "./animateWhere";
import { animateHaving } from "./animateHaving";
import { animateLimit } from "./animateLimit";
import { animateSelect } from "./animateSelect";
import { animateOrderBy } from "./animateOrderBy";
import { animateGroupBy } from "./animateGroupBy";
import { animateJoin } from "./animateJoin";
import { animateMorph } from "./morph";

export const STAGE_ANIMATORS: Record<SimulatorStageType, StageAnimator> = {
  FROM: animateFrom,
  JOIN: animateJoin,
  WHERE: animateWhere,
  GROUP_BY: animateGroupBy,
  HAVING: animateHaving,
  SELECT: animateSelect,
  ORDER_BY: animateOrderBy,
  LIMIT: animateLimit,
};

export type RunOptions = {
  direction: PlaybackDirection;
  /**
   * |newIndex − oldIndex|. 1 plays the stage; 0 (re-layout, e.g. focus toggle)
   * and jumps over several stages morph straight to the result.
   */
  distance: number;
};

/**
 * The single completion contract for every stage, JOIN included:
 * resolves when the stage's choreography has fully settled.
 */
export async function runStageAnimation(ctx: StageAnimationContext, { direction, distance }: RunOptions): Promise<void> {
  const { snapshot, prevSnapshot } = ctx.model;
  const stepForward = direction === "forward" && distance === 1;
  if (!stepForward || (!prevSnapshot && snapshot.stageType !== "FROM")) {
    await animateMorph(ctx, direction);
    return;
  }
  await STAGE_ANIMATORS[snapshot.stageType](ctx);
}
