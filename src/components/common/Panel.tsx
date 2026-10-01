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
        "retro-panel bg-surface-raised",
        "transition-[background-color,transform,box-shadow] duration-100 ease-out",
        interactive && "hover:-translate-x-px hover:-translate-y-px hover:bg-surface-elevated hover:shadow-[5px_5px_0_0_var(--color-retro-edge)]",
        raised && "surface-3d",
        className
      )}
    >
      {(title || action) && (
        <header className="relative z-[1] flex items-center gap-3 border-b border-retro-chrome-dark bg-retro-chrome px-4 py-2 text-white sm:px-5">
          {title ? (
            <h2 className="min-w-0 shrink truncate font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              {title}
            </h2>
          ) : null}
          <span className="min-w-6 flex-1 border-t border-dashed border-white/40" aria-hidden />
          {action}
        </header>
      )}

      <div className="relative z-[1] p-4 sm:p-5">{children}</div>
    </section>
  );
}
