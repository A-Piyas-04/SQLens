import type { OnboardingAccent } from "../../constants/onboardingSteps";
import { cn } from "../../lib/utils/cn";
import type { SpotlightRect } from "./useSpotlightRect";
import { isFeaturedTourStep } from "./onboardingThemes";

const PANEL_CLASS = "onboarding-scrim absolute pointer-events-auto";

type Props = {
  rect: SpotlightRect;
  accent?: OnboardingAccent;
  stepId?: string;
};

/**
 * Dims everything except the spotlight hole so the target stays sharp.
 * Guide card uses rounded-lg + fill; highlight uses dashed outline so they read differently.
 */
export default function OnboardingSpotlightOverlay({
  rect,
  accent = "blue",
  stepId,
}: Props) {
  const featured = stepId ? isFeaturedTourStep({ id: stepId }) : accent === "purple";
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
          "onboarding-spotlight pointer-events-none absolute motion-reduce:transition-none",
          featured
            ? "onboarding-spotlight--featured rounded-md"
            : "onboarding-spotlight--target rounded-sm"
        )}
        style={{ top, left, width, height }}
        aria-hidden
      />
    </>
  );
}
