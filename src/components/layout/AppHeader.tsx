import { Database } from "lucide-react";
import type { ReactNode } from "react";

import AppHeaderHelp from "./AppHeaderHelp";

type Props = {
  actions?: ReactNode;
  onStartTour?: () => void;
};

export default function AppHeader({ actions, onStartTour }: Props) {
  return (
    <header className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 shadow-xl shadow-slate-950/30 backdrop-blur-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-blue-500/35 bg-gradient-to-br from-blue-600/35 to-slate-900 shadow-lg shadow-blue-950/40 ring-1 ring-white/5">
            <Database className="size-5 text-blue-300" aria-hidden />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                SQLens
              </h1>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Local-first
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">
              Write SQL, inspect results, and explore schema — powered by real PostgreSQL in your browser.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2 pt-0.5">
          {onStartTour ? <AppHeaderHelp onStartTour={onStartTour} /> : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
