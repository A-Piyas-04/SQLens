import { cn } from "../../lib/utils/cn";
import type { SpotlightRect } from "./useSpotlightRect";

const PANEL_CLASS =
  "absolute bg-surface-inset/90 pointer-events-auto";

import type { OnboardingAccent } from "../../constants/onboardingSteps";

type Props = {
  rect: SpotlightRect;
  accent?: OnboardingAccent;
};

const RING_CLASS: Record<OnboardingAccent, string> = {
  blue: "ring-2 ring-accent",
  purple: "ring-2 ring-accent",
};

/**
 * Dims everything except the spotlight hole so the target stays sharp.
 */
export default function OnboardingSpotlightOverlay({
  rect,
  accent = "blue",
}: Props) {
  const { top, left, width, height } = rect;
  const right = left + width;
  const bottom = top + height;

  return (
    <>
      <div
        className={PANEL_CLASS}
        style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }}
        aria-hidden
      />
      <div
        className={PANEL_CLASS}
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
        aria-hidden
      />
      <div
        className={PANEL_CLASS}
        style={{
          top,
          left: 0,
          width: Math.max(0, left),
          height,
        }}
        aria-hidden
      />
      <div
        className={PANEL_CLASS}
        style={{
          top,
          left: right,
          right: 0,
          height,
        }}
        aria-hidden
      />

      <div
        className={cn(
          "onboarding-spotlight pointer-events-none absolute rounded-sm border-2 border-accent motion-reduce:transition-none",
          RING_CLASS[accent]
        )}
        style={{ top, left, width, height }}
        aria-hidden
      />
    </>
  );
}
