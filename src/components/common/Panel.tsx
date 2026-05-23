import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

export default function Panel({
  title,
  action,
  children,
  className,
  interactive = false,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm",
        "shadow-lg shadow-slate-950/30",
        "transition-all duration-200 ease-out",
        interactive &&
          "hover:border-slate-600/70 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-slate-950/40",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
          {title ? (
            <h2 className="text-sm font-semibold tracking-wide text-slate-100">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}

      <div className={cn(title || action ? "p-4" : "p-4")}>{children}</div>
    </section>
  );
}
