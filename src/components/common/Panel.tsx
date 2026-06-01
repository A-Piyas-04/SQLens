import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Props = {
  id?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  /** Target for onboarding spotlight (`data-tour`) */
  dataTour?: string;
};

export default function Panel({
  id,
  title,
  action,
  children,
  className,
  interactive = false,
  dataTour,
}: Props) {
  return (
    <section
      id={id}
      data-tour={dataTour}
      className={cn(
        "rounded-sm border border-line bg-surface-inset",
        "transition-colors duration-150 ease-out",
        interactive && "hover:border-line-strong hover:bg-surface-raised",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-raised px-4 py-3.5">
          {title ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-4 w-1 shrink-0 rounded-sm bg-accent"
                aria-hidden
              />
              <h2 className="font-display truncate text-sm font-semibold tracking-wide text-ink">
                {title}
              </h2>
            </div>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
