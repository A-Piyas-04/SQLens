import { useEffect, useState, type ReactNode } from "react";

import { useAppBootReady } from "../../hooks/useAppBootReady";
import { cn } from "../../lib/utils/cn";
import { withViewTransition } from "../../lib/utils/viewTransition";
import AppBootSkeleton from "./AppBootSkeleton";

/** The workspace remounts on every project switch; the splash belongs to the first page load only. */
let hasBootedThisPage = false;

type Props = {
  /**
   * Warmed up during boot; omit when this page must not open a database itself.
   * A PGlite instance must never be a prop: React's dev profiler deep-diffs props and crashes on its WASM heap.
   */
  dbId?: string;
  children: ReactNode;
  className?: string;
};

export default function AppBootGate({ dbId, children, className }: Props) {
  const [skipSplash] = useState(() => hasBootedThisPage);
  const boot = useAppBootReady(skipSplash ? undefined : dbId, skipSplash);
  const [revealed, setRevealed] = useState(skipSplash);
  const [showSplash, setShowSplash] = useState(!skipSplash);

  useEffect(() => {
    if (!boot.isReady || skipSplash) return;
    hasBootedThisPage = true;

    withViewTransition(() => setRevealed(true));

    const timeoutId = window.setTimeout(() => setShowSplash(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [boot.isReady, skipSplash]);

  return (
    <>
      {showSplash ? (
        <div className={cn(revealed && "app-boot-splash-out")}>
          <AppBootSkeleton
            stepLabel={boot.stepLabel}
            progress={boot.progress}
          />
        </div>
      ) : null}

      {revealed ? (
        <div
          className={cn(
            !skipSplash && "animate-fade-in-up motion-reduce:animate-none",
            className
          )}
        >
          {children}
        </div>
      ) : null}
    </>
  );
}
