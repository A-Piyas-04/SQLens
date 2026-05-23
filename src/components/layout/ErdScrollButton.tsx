import { GitFork } from "lucide-react";

import { cn } from "../../lib/utils/cn";

type Props = {
  targetId?: string;
  className?: string;
};

export default function ErdScrollButton({
  targetId = "erd-section",
  className,
}: Props) {
  function scrollToErd() {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <button
      type="button"
      onClick={scrollToErd}
      aria-label="Scroll to Entity Relationship Diagram"
      title="View ERD"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        "border border-slate-600/80 bg-slate-800/90 text-blue-400",
        "transition-colors duration-200",
        "hover:border-blue-500/50 hover:bg-slate-700/90 hover:text-blue-300",
        "active:scale-305",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
        className
      )}
    >

      <GitFork className="size-4" aria-hidden />
    </button>
  );
}
