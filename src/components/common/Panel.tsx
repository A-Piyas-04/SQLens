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
        <header className="flex items-center gap-3 px-4 pb-1 pt-4 sm:px-5">
          {title ? (
            <h2 className="font-display min-w-0 shrink truncate text-[15px] font-bold tracking-tight text-ink">
              {title}
            </h2>
          ) : null}
          <span className="h-px min-w-6 flex-1 bg-line-strong" aria-hidden />
          {action}
        </header>
      )}

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
