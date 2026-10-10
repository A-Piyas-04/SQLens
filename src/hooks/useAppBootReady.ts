import { useEffect, useState } from "react";

import { getDatabase } from "../lib/db/createDatabase";

export type BootStep =
  | "engine"
  | "database"
  | "schema"
  | "ready";

const BOOT_STEPS: { id: BootStep; label: string }[] = [
  { id: "engine", label: "Starting PostgreSQL engine" },
  { id: "database", label: "Opening local database" },
  { id: "schema", label: "Preparing workspace" },
  { id: "ready", label: "Ready" },
];

const MIN_SPLASH_MS = 1400;
const STEP_MS = 380;

export function useAppBootReady(dbId: string | undefined, skip = false) {
  const [step, setStep] = useState<BootStep>(skip ? "ready" : "engine");
  const [isReady, setIsReady] = useState(skip);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;

    async function boot() {
      const startedAt = Date.now();

      setStep("engine");
      await delay(STEP_MS);
      if (cancelled) return;

      setStep("database");
      try {
        if (dbId) await getDatabase(dbId).query("SELECT 1 AS ok");
      } catch {
        // PGlite may still be warming up — proceed so the workspace can recover.
      }
      if (cancelled) return;

      setStep("schema");
      await delay(STEP_MS);
      if (cancelled) return;

      setStep("ready");

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      await delay(remaining);
      if (!cancelled) setIsReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [dbId, skip]);

  const stepIndex = BOOT_STEPS.findIndex((item) => item.id === step);
  const progress = ((stepIndex + 1) / BOOT_STEPS.length) * 100;

  return {
    isReady,
    step,
    stepLabel: BOOT_STEPS[stepIndex]?.label ?? "",
    progress,
    steps: BOOT_STEPS,
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
