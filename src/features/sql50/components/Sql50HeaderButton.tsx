import { GraduationCap, Sparkles } from "lucide-react";

import { cn } from "../../../lib/utils/cn";

type Props = {
  className?: string;
};

export default function Sql50HeaderButton({ className }: Props) {
  return (
    <a
      href="/practice/sql50"
      className={cn(
        "group relative inline-flex items-center gap-2 overflow-hidden rounded-sm",
        "border border-accent bg-accent px-4 py-2.5",
        "text-sm font-semibold text-white shadow-md",
        "transition-all duration-200 ease-out",
        "hover:bg-accent-ink hover:shadow-lg hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "motion-reduce:hover:scale-100",
        className
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <Sparkles className="size-4 shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden />
      <GraduationCap className="size-4 shrink-0" aria-hidden />
      <span className="relative whitespace-nowrap">Practice SQL 50</span>
      <span
        className="relative hidden rounded-sm bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline"
      >
        New
      </span>
    </a>
  );
}
