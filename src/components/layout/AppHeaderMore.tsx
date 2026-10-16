import { BookOpen, HelpCircle, MoreHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "../../lib/utils/cn";
import {
  headerActionButtonClass,
  headerActionButtonOpenClass,
} from "./headerActionButton";

type Props = {
  promo?: ReactNode;
  onOpenNotes?: () => void;
  onStartTour?: () => void;
};

export default function AppHeaderMore({
  promo,
  onOpenNotes,
  onStartTour,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const hasItems = Boolean(promo || onOpenNotes || onStartTour);
  if (!hasItems) return null;

  return (
    <div ref={rootRef} className="relative shrink-0 md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={menuId}
        title="More"
        className={cn(
          headerActionButtonClass,
          "w-9 justify-center px-0",
          open && headerActionButtonOpenClass
        )}
      >
        {open ? (
          <X className="size-4" aria-hidden />
        ) : (
          <MoreHorizontal className="size-4" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-sm border border-line bg-surface-elevated py-1 shadow-md"
        >
          {promo ? (
            <div role="none" className="border-b border-line px-2 py-2">
              <div
                className="[&_a]:flex [&_a]:w-full [&_a]:justify-center"
                onClick={() => setOpen(false)}
              >
                {promo}
              </div>
            </div>
          ) : null}

          {onOpenNotes ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
              onClick={() => {
                setOpen(false);
                onOpenNotes();
              }}
            >
              <BookOpen className="size-3.5 shrink-0 text-accent" aria-hidden />
              Notes
            </button>
          ) : null}

          {onStartTour ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
              onClick={() => {
                setOpen(false);
                onStartTour();
              }}
            >
              <HelpCircle className="size-3.5 shrink-0 text-accent" aria-hidden />
              Help
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
