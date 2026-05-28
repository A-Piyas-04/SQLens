import { useEffect, useState } from "react";

import { findVisibleTourTarget } from "../../constants/onboardingSteps";

const SPOTLIGHT_PADDING = 8;

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function useSpotlightRect(target: string | undefined, stepIndex: number) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }

    const tourTarget = target;

    function measure() {
      const el = findVisibleTourTarget(tourTarget);
      if (!el) {
        setRect(null);
        return;
      }

      const box = el.getBoundingClientRect();
      setRect({
        top: box.top - SPOTLIGHT_PADDING,
        left: box.left - SPOTLIGHT_PADDING,
        width: box.width + SPOTLIGHT_PADDING * 2,
        height: box.height + SPOTLIGHT_PADDING * 2,
      });
    }

    measure();
    const raf = requestAnimationFrame(measure);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    const observer = new ResizeObserver(measure);
    const nodes = document.querySelectorAll(`[data-tour="${tourTarget}"]`);
    nodes.forEach((node) => observer.observe(node));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      observer.disconnect();
    };
  }, [target, stepIndex]);

  return rect;
}
