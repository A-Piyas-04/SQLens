import { Copy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils/cn";
import Button from "../common/Button";

type Props = {
  text: string;
  onClose: () => void;
};

export default function DesignedTextModal({ text, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-surface/70 "
        aria-label="Close designed text"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="designed-text-modal-title"
        className={cn(
          "relative z-10 flex w-full max-w-3xl flex-col",
          "max-h-[min(90vh,720px)] overflow-hidden",
          "rounded-sm border border-line bg-surface-elevated shadow-md"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0 pr-2">
            <h2
              id="designed-text-modal-title"
              className="text-sm font-semibold text-ink sm:text-base"
            >
              Designed Text
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Paste into AI chat — no image or PDF needed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "shrink-0 rounded-sm p-2 text-ink-muted",
              "transition-colors hover:bg-surface-muted hover:text-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-5">
          <pre
            className={cn(
              "whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink",
              "sm:text-sm"
            )}
          >
            {text}
          </pre>
        </div>

        <footer className="shrink-0 border-t border-line bg-surface-raised px-4 py-4 sm:px-5">
          <Button
            variant="primary"
            size="md"
            className="w-full text-sm sm:w-auto sm:min-w-[10rem]"
            onClick={() => void handleCopy()}
          >
            <Copy className="size-4" aria-hidden />
            {copied ? "Copied!" : "Copy entire text"}
          </Button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
