import { Database } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  actions?: ReactNode;
};

export default function AppHeader({ actions }: Props) {
  return (
    <header className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/30 to-slate-900 shadow-lg shadow-blue-950/30">
            <Database className="size-5 text-blue-300" aria-hidden />
          </div>

          <div>
            <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              SQLens
            </h1>
            <p className="text-sm text-slate-400 sm:text-base">
              Real PostgreSQL in your browser.
            </p>
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-start gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
