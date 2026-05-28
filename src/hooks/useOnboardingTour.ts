import { useCallback, useEffect, useState } from "react";

import {
  ONBOARDING_STEPS,
  findVisibleTourTarget,
  type OnboardingStep,
} from "../constants/onboardingSteps";
import {
  hasCompletedOnboarding,
  setOnboardingComplete,
} from "../lib/onboarding/onboardingStore";

export function useOnboardingTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const step: OnboardingStep = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  const start = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const restart = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setOnboardingComplete(true);
  }, []);

  const skip = useCallback(() => {
    close();
  }, [close]);

  const finish = useCallback(() => {
    close();
  }, [close]);

  const next = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }, [isLast, finish]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    if (!isActive || !step.target) return;

    if (step.scrollIntoView) {
      findVisibleTourTarget(step.target)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isActive, stepIndex, step.target, step.scrollIntoView]);

  return {
    isActive,
    step,
    stepIndex,
    totalSteps: ONBOARDING_STEPS.length,
    isFirst,
    isLast,
    start,
    restart,
    skip,
    next,
    back,
    finish,
  };
}
