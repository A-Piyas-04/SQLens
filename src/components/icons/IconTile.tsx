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
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        "border border-slate-700/50 bg-slate-800/55",
        className
      )}
    >
      {children}
    </span>
  );
}
