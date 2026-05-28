import { cn } from "../../lib/utils/cn";
import type { SpotlightRect } from "./useSpotlightRect";

const PANEL_CLASS =
  "absolute bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto";

import type { OnboardingAccent } from "../../constants/onboardingSteps";

type Props = {
  rect: SpotlightRect;
  accent?: OnboardingAccent;
};

const RING_CLASS: Record<OnboardingAccent, string> = {
  blue: "ring-2 ring-sky-400/85 shadow-[0_0_20px_rgba(56,189,248,0.28)]",
  purple:
    "ring-2 ring-purple-400/90 shadow-[0_0_24px_rgba(168,85,247,0.35)]",
};

/**
 * Dims and blurs everything except the spotlight hole so the target stays sharp.
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
      {/* Top */}
      <div
        className={PANEL_CLASS}
        style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }}
        aria-hidden
      />
      {/* Bottom */}
      <div
        className={PANEL_CLASS}
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
        aria-hidden
      />
      {/* Left */}
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
      {/* Right */}
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

      {/* Highlight ring — sits above clear hole, no blur */}
      <div
        className={cn(
          "onboarding-spotlight pointer-events-none absolute rounded-xl motion-reduce:transition-none",
          RING_CLASS[accent]
        )}
        style={{ top, left, width, height }}
        aria-hidden
      />
    </>
  );
}
