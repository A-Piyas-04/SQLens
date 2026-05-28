import type { PGlite } from "@electric-sql/pglite";
import { useEffect, useState, type ReactNode } from "react";

import { useAppBootReady } from "../../hooks/useAppBootReady";
import { cn } from "../../lib/utils/cn";
import { withViewTransition } from "../../lib/utils/viewTransition";
import AppBootSplash from "./AppBootSplash";

type Props = {
  db: PGlite;
  children: ReactNode;
};

export default function AppBootGate({ db, children }: Props) {
  const boot = useAppBootReady(db);
  const [revealed, setRevealed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!boot.isReady) return;

    withViewTransition(() => setRevealed(true));

    const timeoutId = window.setTimeout(() => setShowSplash(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [boot.isReady]);

  return (
    <>
      {showSplash ? (
        <div className={cn(revealed && "app-boot-splash-out")}>
          <AppBootSplash
            step={boot.step}
            stepLabel={boot.stepLabel}
            progress={boot.progress}
            steps={boot.steps}
          />
        </div>
      ) : null}

      {revealed ? (
        <div className="animate-fade-in-up motion-reduce:animate-none">
          {children}
        </div>
      ) : null}
    </>
  );
}
