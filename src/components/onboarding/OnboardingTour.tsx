import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { OnboardingStep } from "../../constants/onboardingSteps";
import OnboardingSpotlightOverlay from "./OnboardingSpotlightOverlay";
import OnboardingStepCard from "./OnboardingStepCard";
import { getStepAccent } from "./onboardingThemes";
import { useSpotlightRect } from "./useSpotlightRect";

type Props = {
  isActive: boolean;
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export default function OnboardingTour({
  isActive,
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onBack,
  onSkip,
}: Props) {
  const rect = useSpotlightRect(isActive ? step.target : undefined, stepIndex);
  const [layoutReady, setLayoutReady] = useState(false);

  const accent = getStepAccent(step);
  const showSpotlight = Boolean(step.target && rect);

  useEffect(() => {
    if (!isActive) {
      setLayoutReady(false);
      return;
    }

    setLayoutReady(false);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setLayoutReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [isActive, stepIndex, step.target]);

  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "ArrowLeft" && !isFirst) {
        event.preventDefault();
        onBack();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isFirst, onNext, onBack, onSkip]);

  if (!isActive) return null;

  const cardProps = {
    step,
    stepIndex,
    totalSteps,
    isFirst,
    isLast,
    layoutReady,
    onNext,
    onBack,
    onSkip,
  };

  const content = (
    <div
      className="onboarding-tour fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tour-title"
      aria-describedby="onboarding-tour-body"
    >
      {showSpotlight && layoutReady && rect ? (
        <OnboardingSpotlightOverlay rect={rect} accent={accent} />
      ) : (
        <div
          className="absolute inset-0 bg-surface-inset  pointer-events-auto"
          aria-hidden
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <OnboardingStepCard {...cardProps} />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
