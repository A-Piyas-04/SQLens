import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Fixed-size slot so sidebar icons read clearly at a glance */
export function IconTile({ children, className }: Props) {
  return (
    <span
      className={cn(
        "retro-inset flex size-10 shrink-0 items-center justify-center",
        "border-retro-edge bg-surface-muted text-ink-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
