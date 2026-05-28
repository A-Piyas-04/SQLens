import { useEffect, useRef, useState } from "react";

import { HelpTourIcon } from "../icons";
import { cn } from "../../lib/utils/cn";
import {
  HEADER_ACTION_ICON_SIZE,
  headerActionButtonClass,
  headerActionButtonOpenClass,
} from "./headerActionButton";

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
          headerActionButtonClass,
          isOpen && headerActionButtonOpenClass
        )}
      >
        <HelpTourIcon size={HEADER_ACTION_ICON_SIZE} className="text-sky-300" />
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
