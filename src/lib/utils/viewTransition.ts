import { startTransition } from "react";
import { flushSync } from "react-dom";

export function withViewTransition(update: () => void) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    const transition = document.startViewTransition(() => {
      flushSync(update);
    });
    // A newer transition skips this one; the state update still applies, so the rejection is noise.
    transition.ready.catch(() => {});
    return;
  }

  startTransition(update);
}
