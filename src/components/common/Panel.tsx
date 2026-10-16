import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Props = {
  id?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  /** Extruded 3D slab look for top-level workspace cards. */
  raised?: boolean;
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
  raised = false,
  dataTour,
}: Props) {
  return (
    <section
      id={id}
      data-tour={dataTour}
      className={cn(
        "retro-panel relative",
        "transition-transform duration-100 ease-out",
        interactive && "hover:-translate-y-px",
        raised && "surface-3d",
        className
      )}
    >
      {(title || action) && (
        <header className="relative z-[1] flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-1 pt-3.5 sm:px-6">
          {title ? (
            <h2 className="min-w-0 shrink truncate font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              {title}
            </h2>
          ) : null}
          <span
            className="min-w-6 flex-1 border-t border-dashed border-retro-edge/40 max-sm:hidden"
            aria-hidden
          />
          {action ? (
            <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
              {action}
            </div>
          ) : null}
        </header>
      )}

      <div className={cn("relative z-[1] px-4 pb-6 sm:px-6", title || action ? "pt-3" : "pt-6")}>
        {children}
      </div>
    </section>
  );
}
