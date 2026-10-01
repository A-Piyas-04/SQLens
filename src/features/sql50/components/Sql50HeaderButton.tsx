import { GraduationCap, Sparkles } from "lucide-react";

import { cn } from "../../../lib/utils/cn";

type Props = {
  className?: string;
};

export default function Sql50HeaderButton({ className }: Props) {
  return (
    <a
      href="/practice/sql50"
      data-tour="sql50-promo"
      className={cn(
        "group relative inline-flex items-center gap-2 overflow-hidden rounded-sm",
        "border border-accent bg-accent px-4 py-2.5",
        "text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--color-retro-edge)]",
        "transition-[transform,box-shadow,background-color] duration-150 ease-out",
        "hover:bg-accent-ink hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-retro-edge)]",
        "active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0_0_var(--color-retro-edge)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "motion-reduce:transition-none",
        className
      )}
    >
      <Sparkles className="size-4 shrink-0" aria-hidden />
      <GraduationCap className="size-4 shrink-0" aria-hidden />
      <span className="relative whitespace-nowrap">Practice SQL 50</span>
      <span
        className="relative hidden rounded-sm border border-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline"
      >
        New
      </span>
    </a>
  );
}
