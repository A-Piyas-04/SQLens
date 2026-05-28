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
        "rounded-xl border border-slate-800/70 bg-slate-900/55 backdrop-blur-md",
        "shadow-lg shadow-slate-950/35 ring-1 ring-white/[0.03]",
        "transition-all duration-200 ease-out",
        interactive &&
          "hover:border-slate-700/80 hover:bg-slate-900/75 hover:shadow-xl hover:shadow-slate-950/45",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-800/70 bg-slate-950/20 px-4 py-3.5">
          {title ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-4 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-blue-400 to-blue-600/70"
                aria-hidden
              />
              <h2 className="truncate text-sm font-semibold tracking-wide text-slate-100">
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
