import { CircleHelp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils/cn";

type Props = {
  onStartTour: () => void;
};

export default function AppHeaderHelp({ onStartTour }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleStartTour() {
    setIsOpen(false);
    onStartTour();
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Help"
        aria-expanded={isOpen}
        className={cn(
          "flex size-10 items-center justify-center rounded-lg border border-slate-700/60",
          "bg-slate-800/50 text-slate-400 transition-colors",
          "hover:border-slate-600/70 hover:bg-slate-800/80 hover:text-slate-200",
          isOpen && "border-blue-500/40 bg-slate-800/80 text-blue-200"
        )}
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>

      {isOpen ? (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 min-w-[12rem]",
            "overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900",
            "shadow-xl shadow-slate-950/60"
          )}
        >
          <button
            type="button"
            onClick={handleStartTour}
            className={cn(
              "flex w-full px-3 py-2.5 text-left text-sm text-slate-200",
              "transition-colors hover:bg-slate-800/60"
            )}
          >
            Take the tour again
          </button>
        </div>
      ) : null}
    </div>
  );
}
