import type { ReactNode } from "react";

import { cn } from "../../../lib/utils/cn";

type Props = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Sql50SidebarSection({
  title,
  action,
  children,
  className,
}: Props) {
  return (
    <section className={cn("flex min-h-0 flex-col", className)}>
      <header className="mb-2.5 flex shrink-0 items-center justify-between gap-2">
        <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
        {action}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
